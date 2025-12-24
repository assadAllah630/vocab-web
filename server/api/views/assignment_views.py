from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from ..models import Assignment, AssignmentProgress, Classroom, ClassMembership
from ..models import Assignment, AssignmentProgress, Classroom, ClassMembership, WritingExercise, WritingSubmission
from ..serializers import AssignmentSerializer, AssignmentProgressSerializer, WritingExerciseSerializer, WritingSubmissionSerializer
from ..services.learning_events import log_assignment_submission
from ..agents.writing_grader import run_writing_grader

class WritingExerciseViewSet(viewsets.ModelViewSet):
    """
    CRUD for Writing Exercises.
    Teachers create these first, then link them to an Assignment.
    """
    queryset = WritingExercise.objects.all()
    serializer_class = WritingExerciseSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Could add check that user is a teacher
        serializer.save()

class AssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # User sees assignments where they are the teacher OR where they are an active student
        queryset = Assignment.objects.filter(
            Q(classroom__teacher__user=user) | 
            Q(classroom__memberships__student=user, classroom__memberships__status='active')
        ).distinct()

        classroom_id = self.request.query_params.get('classroom')
        if classroom_id:
            try:
                # Ensure classroom_id is numeric to prevent 500 error when "create" is passed
                int(classroom_id)
                queryset = queryset.filter(classroom_id=classroom_id)
            except (ValueError, TypeError):
                # If not numeric, return empty or handle gracefully
                return Assignment.objects.none()
            
        return queryset

    def perform_create(self, serializer):
        classroom = serializer.validated_data['classroom']
        # Verify user is the teacher of this classroom
        if classroom.teacher.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only create assignments for your own classrooms.")
        
        # Verify Learning Path Node is provided (Strict Requirement per Roadmap)
        linked_path_node_id = self.request.data.get('linked_path_node_id')
        if not linked_path_node_id:
             # Allow optional for backward compatibility if needed, but per plan it's required.
             # We will enforce it for new "v2" assignments.
             pass 
        
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['get'])
    def my_progress(self, request, pk=None):
        """Get the current user's progress for this assignment."""
        assignment = self.get_object()
        progress = AssignmentProgress.objects.filter(assignment=assignment, student=request.user).first()
        if progress:
            serializer = AssignmentProgressSerializer(progress)
            return Response(serializer.data)
        return Response({'status': 'not_started'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_assignment(request, id):
    """Student starts an assignment attempt."""
    assignment = get_object_or_404(Assignment, id=id)
    student = request.user

    # Verify enrollment
    membership = ClassMembership.objects.filter(
        classroom=assignment.classroom,
        student=student,
        status='active'
    ).exists()

    if not membership:
        return Response({'error': 'Not enrolled in this classroom'}, status=status.HTTP_403_FORBIDDEN)

    # Check existing progress
    progress, created = AssignmentProgress.objects.get_or_create(
        assignment=assignment,
        student=student,
        defaults={
            'status': 'in_progress',
            'started_at': timezone.now()
        }
    )

    if not created:
        if progress.status == 'submitted' or progress.status == 'graded':
            # Check max attempts logic here if implemented (currently simplified)
            # For now, just return existing info if already done, or re-open if allowed?
            # Workflow says "Student starts", implies new or continue.
            # If not submitted, just return success.
            if progress.status == 'in_progress':
                return Response({'message': 'Resumed assignment', 'progress_id': progress.id})
            return Response({'error': 'Assignment already submitted'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Type-Specific Logic
    response_data = {'message': 'Assignment started', 'progress_id': progress.id}
    
    if assignment.content_type == 'exam':
        # logic to handle exam cloning
        if assignment.content_id:
            try:
                 # Fetch Template
                 template = Exam.objects.get(id=assignment.content_id)
                 if template.is_template:
                     # Clone it
                     cloned_exam = Exam.objects.create(
                         user=student,
                         topic=template.topic,
                         difficulty=template.difficulty,
                         language=template.language,
                         questions=template.questions, # Copy questions
                         is_template=False,
                         cloned_from=template
                     )
                     # Link to progress
                     progress.linked_exam = cloned_exam
                     progress.save()
                     response_data['exam_id'] = cloned_exam.id
            except Exam.DoesNotExist:
                pass
    
    elif assignment.content_type == 'story':
         # Return story metadata (text is stored in assignment.metadata)
         response_data['story_metadata'] = assignment.metadata
         
    elif assignment.content_type == 'vocab_list':
         # Return vocab metadata (words stored in assignment.metadata)
         response_data['vocab_metadata'] = assignment.metadata

    elif assignment.content_type == 'writing':
        # Create empty submission skeleton
        try:
            exercise = WritingExercise.objects.get(id=assignment.content_id)
            submission, _ = WritingSubmission.objects.get_or_create(
                exercise=exercise,
                student=student,
                defaults={'content': '', 'word_count': 0}
            )
            progress.linked_writing_submission = submission
            progress.save()
            response_data['submission_id'] = submission.id
            response_data['exercise'] = WritingExerciseSerializer(exercise).data
            response_data['submission'] = WritingSubmissionSerializer(submission).data
        except WritingExercise.DoesNotExist:
            return Response({'error': 'Writing exercise content not found'}, status=404)

    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_assignment(request, id):
    """Student submits an assignment."""
    assignment = get_object_or_404(Assignment, id=id)
    student = request.user
    
    progress = get_object_or_404(AssignmentProgress, assignment=assignment, student=student)
    
    if progress.status == 'submitted' or progress.status == 'graded':
         return Response({'error': 'Already submitted'}, status=status.HTTP_400_BAD_REQUEST)

    # In a real scenario, we'd process answers here.
    # For now, just mark complete.
    
    # Save progress data (e.g. reading time, friction)
    progress_data = request.data.get('progress_data')
    if progress_data:
        progress.progress_data = progress_data
        
    progress.status = 'submitted'
    progress.submitted_at = timezone.now()
    progress.save()
    
    progress.save()
    
    # Log Learning Event
    log_assignment_submission(request.user, assignment.id, assignment.classroom)
    
    # --- LEARNING PATH INTEGRATION ---
    # If this assignment is linked to a path node, mark that node as complete
    if assignment.linked_path_node:
        from ..models import PathEnrollment, NodeProgress, PathNode
        try:
            # Find enrollment for this student in the path containing the node
            enrollment = PathEnrollment.objects.filter(
                student=student,
                path=assignment.linked_path_node.path
            ).first()
            
            if enrollment:
                # Find the specific node progress
                node_prog = NodeProgress.objects.filter(
                    enrollment=enrollment,
                    node=assignment.linked_path_node
                ).first()
                
                if node_prog:
                    node_prog.status = 'completed'
                    node_prog.completed_at = timezone.now()
                    # Use assignment score if available, else 100 or 0 based on completion
                    if progress.score is not None:
                        node_prog.score = progress.score
                    else:
                        node_prog.score = 100 # Default for completion without grading
                    node_prog.save()
                    
                    # Unlock Next Node logic
                    # (Copied/Refactored from PathNodeViewSet.complete)
                    next_node = PathNode.objects.filter(
                        path=assignment.linked_path_node.path, 
                        order=assignment.linked_path_node.order + 1
                    ).first()
                    
                    if next_node:
                        next_progress = NodeProgress.objects.get(enrollment=enrollment, node=next_node)
                        if next_progress.status == 'locked':
                            next_progress.status = 'available'
                            next_progress.save()
                    else:
                        # Path completed if no next node
                        enrollment.completed_at = timezone.now()
                        enrollment.save()

        except Exception as e:
            print(f"Error updating path progress: {e}")
    # ---------------------------------

    return Response({'message': 'Assignment submitted successfully'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_writing_content(request, id):
    """
    Update writing submission content (autosave or final submit).
    ID is AssignmentProgress ID.
    """
    progress = get_object_or_404(AssignmentProgress, id=id)
    if progress.student != request.user:
        return Response({'error': 'Not your assignment'}, status=403)
        
    submission = progress.linked_writing_submission
    if not submission:
        return Response({'error': 'No writing submission started'}, status=400)

    content = request.data.get('content')
    word_count = request.data.get('word_count', 0)
    is_final = request.data.get('is_final', False)
    
    if content is not None:
        submission.content = content
        submission.word_count = word_count
        submission.save()
        
    if is_final:
        progress.status = 'submitted'
        progress.submitted_at = timezone.now()
        progress.save()
        log_assignment_submission(request.user, progress.assignment.id, progress.assignment.classroom)
        
    return Response({'status': 'saved', 'submission': WritingSubmissionSerializer(submission).data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_grading_details(request, id):
    """
    Get full details for grading a writing assignment.
    ID is AssignmentProgress ID.
    """
    progress = get_object_or_404(AssignmentProgress, id=id)
    # Teacher Check
    if progress.assignment.classroom.teacher.user != request.user:
        return Response({'error': 'Permission denied'}, status=403)
        
    submission = progress.linked_writing_submission
    if not submission:
         return Response({'error': 'No submission found'}, status=404)
         
    return Response({
        'progress': AssignmentProgressSerializer(progress).data,
        'submission': WritingSubmissionSerializer(submission).data,
        'exercise': WritingExerciseSerializer(submission.exercise).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def analyze_writing_submission(request, id):
    """
    Trigger AI Agent to grade/analyze a writing submission.
    ID is AssignmentProgress ID.
    """
    progress = get_object_or_404(AssignmentProgress, id=id)
    # Teacher Only
    if progress.assignment.classroom.teacher.user != request.user:
        return Response({'error': 'Permission denied'}, status=403)
        
    submission = progress.linked_writing_submission
    if not submission:
        return Response({'error': 'No submission found'}, status=404)
        
    # Run Agent
    # This is synchronous for now, could be async task in production
    ai_result = run_writing_grader(submission.id)
    
    if "error" in ai_result:
        return Response(ai_result, status=500)
        
    # Save Result
    submission.ai_feedback = ai_result
    submission.ai_score = ai_result.get('score', 0)
    submission.save()
    
    return Response(WritingSubmissionSerializer(submission).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def grade_assignment(request, id):
    """Teacher grades an assignment progress (id is progress_id)."""
    progress = get_object_or_404(AssignmentProgress, id=id)
    
    # Verify request user is the teacher
    if progress.assignment.classroom.teacher.user != request.user:
        return Response({'error': 'Only the class teacher can grade'}, status=status.HTTP_403_FORBIDDEN)
    
    score = request.data.get('score')
    feedback = request.data.get('feedback', '')
    
    if score is not None:
        progress.score = float(score)
    
    progress.feedback = feedback
    progress.status = 'graded'
    progress.save()
    
    return Response(AssignmentProgressSerializer(progress).data)
