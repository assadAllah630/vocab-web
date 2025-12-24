from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from ..models import Teacher, Classroom, ClassMembership, Assignment, AssignmentProgress
from ..permissions import IsTeacher
from ..serializers import AssignmentProgressSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def dashboard_overview(request):
    """
    Get high-level stats for teacher dashboard.
    """
    teacher = request.user.teacher_profile
    classrooms = Classroom.objects.filter(teacher=teacher)
    
    # Simple counts
    classroom_count = classrooms.count()
    
    # Total unique active students across all classrooms
    # Using filter on memberships for this teacher's classrooms
    total_students = ClassMembership.objects.filter(
        classroom__teacher=teacher, 
        status='active'
    ).values('student').distinct().count()
    
    pending_requests = ClassMembership.objects.filter(
        classroom__teacher=teacher, 
        status='pending'
    ).count()
    
    pending_grading = AssignmentProgress.objects.filter(
        assignment__classroom__teacher=teacher,
        status='submitted'
    ).count()
    
    # New submissions in last 7 days
    week_ago = timezone.now() - timedelta(days=7)
    new_submissions_week = AssignmentProgress.objects.filter(
        assignment__classroom__teacher=teacher,
        status__in=['submitted', 'graded'],
        submitted_at__gte=week_ago
    ).count()

    # Active Sessions (Real-time Pulse)
    active_sessions_count = 0
    from ..models import LiveSession
    active_sessions_count = LiveSession.objects.filter(
        classroom__teacher=teacher,
        status='live'
    ).count()

    return Response({
        'classroom_count': classroom_count,
        'total_students': total_students,
        'pending_requests': pending_requests,
        'pending_grading': pending_grading,
        'new_submissions_week': new_submissions_week,
        'active_sessions_count': active_sessions_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def classroom_stats(request, id):
    """
    Get detailed stats for a specific classroom.
    """
    teacher = request.user.teacher_profile
    classroom = get_object_or_404(Classroom, id=id, teacher=teacher)
    
    student_count = classroom.memberships.filter(status='active').count()
    assignment_count = classroom.assignments.count()
    
    # Calculate average score of graded assignments
    avg_score = AssignmentProgress.objects.filter(
        assignment__classroom=classroom,
        status='graded'
    ).aggregate(Avg('score'))['score__avg'] or 0
    
    # Calculate completion rate (simplified)
    # Total assigned = assignments * students
    # Total completed = progress where status in [submitted, graded]
    # This is a rough metric.
    
    total_completed = AssignmentProgress.objects.filter(
        assignment__classroom=classroom,
        status__in=['submitted', 'graded']
    ).count()
    
    # Avoiding division by zero
    total_possible = assignment_count * student_count
    completion_rate = 0
    if total_possible > 0:
        completion_rate = (total_completed / total_possible) * 100
        
    return Response({
        'student_count': student_count,
        'assignment_count': assignment_count,
        'average_score': round(avg_score, 1),
        'completion_rate': round(completion_rate, 1)
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def recent_activity(request):
    """
    Get recent activity feed (submissions, joins).
    """
    teacher = request.user.teacher_profile
    activity = []
    
    # Limit to last 20 events total (approx)
    limit = 20
    
    # 1. Recent Submissions
    submissions = AssignmentProgress.objects.filter(
        assignment__classroom__teacher=teacher,
        status__in=['submitted', 'graded'],
        submitted_at__isnull=False
    ).select_related('student', 'assignment', 'assignment__classroom').order_by('-submitted_at')[:limit]
    
    for sub in submissions:
        activity.append({
            'type': 'submission',
            'timestamp': sub.submitted_at,
            'student_name': sub.student.username,
            'details': f"submitted {sub.assignment.title}",
            'classroom': sub.assignment.classroom.name,
            'link_id': sub.id # link to verify/grade
        })
        
    # 2. Recent Joins (Active or Pending)
    # joined_at is auto_now_add
    joins = ClassMembership.objects.filter(
        classroom__teacher=teacher
    ).select_related('student', 'classroom').order_by('-joined_at')[:limit]
    
    for join in joins:
        action = "requested to join" if join.status == 'pending' else "joined"
        activity.append({
            'type': 'join',
            'timestamp': join.joined_at,
            'student_name': join.student.username,
            'details': f"{action}",
            'classroom': join.classroom.name,
            'link_id': join.id
        })
        
    # Sort combined list by timestamp descending
    activity.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return Response(activity[:limit])


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTeacher])
def student_performance(request, cid, sid):
    """
    Get performance stats for a specific student in a classroom.
    """
    teacher = request.user.teacher_profile
    classroom = get_object_or_404(Classroom, id=cid, teacher=teacher)
    
    # Verify student membership
    membership = get_object_or_404(ClassMembership, classroom=classroom, student_id=sid)
    student = membership.student
    
    # 1. Get all assignments
    assignments = classroom.assignments.all().order_by('-due_date')
    
    # 2. Get progress dict
    progress_records = AssignmentProgress.objects.filter(
        assignment__classroom=classroom,
        student=student
    )
    progress_map = {p.assignment_id: p for p in progress_records}
    
    assignment_data = []
    completed_count = 0
    total_score = 0
    graded_count = 0
    
    for assignment in assignments:
        prog = progress_map.get(assignment.id)
        status_val = prog.status if prog else 'not_started'
        score = prog.score if prog else None
        
        if status_val in ['submitted', 'graded']:
            completed_count += 1
        
        if status_val == 'graded' and score is not None:
            total_score += score
            graded_count += 1
            
        assignment_data.append({
            'id': assignment.id,
            'title': assignment.title,
            'due_date': assignment.due_date,
            'status': status_val,
            'score': score,
            'type': assignment.content_type
        })
        
    # Stats
    avg_score = round(total_score / graded_count, 1) if graded_count > 0 else 0
    total_assignments = assignments.count()
    completion_rate = 0
    if total_assignments > 0:
        completion_rate = round((completed_count / total_assignments) * 100, 1)
        
    return Response({
        'student': {
            'id': student.id,
            'username': student.username,
            'email': student.email,
            'joined_at': membership.joined_at
        },
        'stats': {
            'average_score': avg_score,
            'completed': completed_count,
            'total_assignments': total_assignments,
            'completion_rate': completion_rate
        },
        'assignments': assignment_data
    })
