from rest_framework import viewsets, permissions, status, serializers
import logging
logger = logging.getLogger(__name__)
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.http import FileResponse
from ..models import LearningPath, PathNode, PathEnrollment, NodeProgress, Teacher, PathNodeMaterial, PathSubLevel
from ..serializers import (
    LearningPathSerializer, 
    PathNodeSerializer, 
    PathEnrollmentSerializer, 
    NodeProgressSerializer,
    PathSubLevelSerializer
)


class PathNodeMaterialSerializer(serializers.ModelSerializer):
    """Serializer for path node materials."""
    download_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PathNodeMaterial
        fields = ['id', 'node', 'filename', 'file_type', 'file_size', 
                  'is_teacher_only', 'uploaded_by', 'created_at', 'download_url']
        read_only_fields = ['uploaded_by', 'created_at', 'file_size', 'file_type']
    
    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/path-node-materials/{obj.id}/download/')
        return None

class LearningPathViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Learning Paths.
    Now organized by Language Pair (Speaking -> Target).
    """
    serializer_class = LearningPathSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Paths are now potentially global/shared, or at least not strictly teacher-owned
        # Filter by language pair if provided in query params
        queryset = LearningPath.objects.all()
        
        speaking = self.request.query_params.get('speaking_language')
        target = self.request.query_params.get('target_language')
        classroom_id = self.request.query_params.get('classroom_id')
        
        if classroom_id:
            try:
                from ..models import Classroom
                classroom = Classroom.objects.get(id=classroom_id)
                speaking = classroom.speaking_language
                target = classroom.target_language
            except Classroom.DoesNotExist:
                pass
        
        if speaking:
            queryset = queryset.filter(speaking_language=speaking)
        if target:
            queryset = queryset.filter(target_language=target)
            
        return queryset

    def perform_create(self, serializer):
        # No longer requires teacher profile
        # Just save.
        serializer.save()

    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        path = self.get_object()
        enrollment, created = PathEnrollment.objects.get_or_create(
            path=path,
            student=request.user
        )
        
        if created:
            # Initialize progress for first node of first sublevel
            first_sublevel = path.sublevels.order_by('order').first()
            if first_sublevel:
                first_node = first_sublevel.nodes.order_by('order').first()
                if first_node:
                    NodeProgress.objects.create(
                        enrollment=enrollment,
                        node=first_node,
                        status='available'
                    )
        
        return Response(PathEnrollmentSerializer(enrollment).data)

    @action(detail=True, methods=['get'])
    def my_progress(self, request, pk=None):
        path = self.get_object()
        enrollment = PathEnrollment.objects.filter(path=path, student=request.user).first()
        if not enrollment:
            return Response({"error": "Not enrolled"}, status=status.HTTP_404_NOT_FOUND)
        return Response(PathEnrollmentSerializer(enrollment).data)

    @action(detail=True, methods=['get'])
    def structure(self, request, pk=None):
        """Get full hierarchy: Path -> SubLevels -> Nodes"""
        path = self.get_object()
        data = {
            "id": path.id,
            "title": path.title,
            "sublevels": []
        }
        
        for sublevel in path.sublevels.all().order_by('order'):
            sl_data = {
                "id": sublevel.id,
                "title": sublevel.title,
                "code": sublevel.sublevel_code,
                "nodes": PathNodeSerializer(sublevel.nodes.all().order_by('order'), many=True, context={'request': request}).data
            }
            data["sublevels"].append(sl_data)
            
        return Response(data)

    @action(detail=True, methods=['get', 'post'])
    def nodes(self, request, pk=None):
        """Get flattened list of nodes or create new node (legacy support)"""
        path = self.get_object()
        
        if request.method == 'GET':
            # Flatten all nodes from all sublevels
            nodes = PathNode.objects.filter(sublevel__path=path).order_by('sublevel__order', 'order')
            return Response(PathNodeSerializer(nodes, many=True, context={'request': request}).data)
        
        elif request.method == 'POST':
            return Response({"error": "Use /api/sublevels/{id}/nodes/ to create nodes now"}, status=400)
            serializer = PathNodeSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                serializer.save(path=path)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PathNodeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing nodes within a path.
    """
    serializer_class = PathNodeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        path_id = self.request.query_params.get('path_id')
        sublevel_id = self.request.query_params.get('sublevel_id')
        
        if sublevel_id:
            return PathNode.objects.filter(sublevel_id=sublevel_id)
        if path_id:
            return PathNode.objects.filter(sublevel__path_id=path_id)
            
        return PathNode.objects.all()

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        node = self.get_object()
        enrollment = PathEnrollment.objects.filter(path=node.sublevel.path, student=request.user).first()
        if not enrollment:
            return Response({"error": "No enrollment"}, status=status.HTTP_403_FORBIDDEN)
        
        progress, created = NodeProgress.objects.get_or_create(enrollment=enrollment, node=node)
        
        if progress.status == 'locked':
            return Response({"error": "Node is locked"}, status=status.HTTP_403_FORBIDDEN)
            
        if progress.status != 'completed':
            progress.status = 'in_progress'
            if not progress.started_at:
                progress.started_at = timezone.now()
            progress.save()
            
        return Response(NodeProgressSerializer(progress).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        node = self.get_object()
        enrollment = PathEnrollment.objects.filter(path=node.sublevel.path, student=request.user).first()
        if not enrollment:
            return Response({"error": "No enrollment"}, status=status.HTTP_403_FORBIDDEN)
            
        progress = NodeProgress.objects.get(enrollment=enrollment, node=node)
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        progress.attempts += 1
        progress.score = request.data.get('score', 100)
        progress.save()
        
        # Unlock next node
        next_node = PathNode.objects.filter(sublevel=node.sublevel, order__gt=node.order).order_by('order').first()
        
        if not next_node:
            # Try next sublevel
            next_sublevel = PathSubLevel.objects.filter(
                path=node.sublevel.path, 
                order__gt=node.sublevel.order
            ).order_by('order').first()
            if next_sublevel:
                next_node = next_sublevel.nodes.order_by('order').first()
        
        if next_node:
            next_progress, _ = NodeProgress.objects.get_or_create(enrollment=enrollment, node=next_node)
            if next_progress.status == 'locked':
                next_progress.status = 'available'
                next_progress.save()
        else:
            # Path completed
            enrollment.completed_at = timezone.now()
            enrollment.save()
            
        return Response(NodeProgressSerializer(progress).data)

    @action(detail=True, methods=['get', 'post'], parser_classes=[MultiPartParser, FormParser])
    def materials(self, request, pk=None):
        """List or upload materials for this node."""
        node = self.get_object()
        
        if request.method == 'GET':
            materials = PathNodeMaterial.objects.filter(node=node)
            # Filter teacher-only materials for non-teachers
            if not request.user.is_superuser:
                try:
                    if not hasattr(request.user, 'teacher_profile'):
                        materials = materials.filter(is_teacher_only=False)
                except Exception:
                    materials = materials.filter(is_teacher_only=False)
            
            serializer = PathNodeMaterialSerializer(materials, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Upload a new file
            file = request.FILES.get('file')
            if not file:
                return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            material = PathNodeMaterial.objects.create(
                node=node,
                file=file,
                filename=file.name,
                file_type=file.content_type,
                file_size=file.size,
                is_teacher_only=request.data.get('is_teacher_only', 'false').lower() == 'true',
                uploaded_by=request.user
            )
            
            serializer = PathNodeMaterialSerializer(material, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class PathSubLevelViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing Path SubLevels (A1.1, A1.2, etc.)
    """
    queryset = PathSubLevel.objects.all()
    serializer_class = PathSubLevelSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        path_id = self.request.query_params.get('path_id')
        if path_id:
            return PathSubLevel.objects.filter(path_id=path_id)
        return PathSubLevel.objects.all()

    @action(detail=True, methods=['post'])
    def generate_objectives(self, request, pk=None):
        """AI Generator: Create learning objectives for this sublevel."""
        try:
            sublevel = self.get_object()
            from ..unified_ai import generate_ai_content
            
            prompt = f"""Generate 5-7 clear, actionable learning objectives for a language learning module.
            Language: {sublevel.path.target_language} (taught in {sublevel.path.speaking_language})
            Level: {sublevel.level_code} ({sublevel.title})
            Topic: {sublevel.description or sublevel.title}
            
            Output JSON as a list of strings."""
            logger.info(f"Generating objectives for sublevel {sublevel.id}")
            response = generate_ai_content(request.user, prompt, json_mode=True)
            
            import json
            import re
            
            # Robust JSON parsing
            try:
                objectives = json.loads(response.text)
            except json.JSONDecodeError:
                # Try to extract JSON from markdown code blocks
                match = re.search(r'```json\s*(.*?)\s*```', response.text, re.DOTALL)
                if match:
                    objectives = json.loads(match.group(1))
                else:
                    # Fallback: Split by lines if it looks like a list
                    objectives = [line.strip('- ').strip() for line in response.text.split('\n') if line.strip().startswith('-')]
            
            # Ensure it's a list
            if not isinstance(objectives, list):
                objectives = [str(objectives)]
                
            sublevel.objectives = objectives
            sublevel.save()
            logger.info("Objectives generated and saved successfully")
            return Response(PathSubLevelSerializer(sublevel).data)
        except Exception as e:
            import traceback
            tb = traceback.format_exc()
            logger.error(f"Error generating objectives: {e}\n{tb}")
            return Response({"error": f"AI Generation Failed: {str(e)}"}, status=500)

    @action(detail=False, methods=['put'])
    def reorder(self, request):
        node_orders = request.data.get('orders', []) # list of {id: X, order: Y}
        for item in node_orders:
            PathNode.objects.filter(id=item['id']).update(order=item['order'])
        return Response({"status": "reordered"})

    @action(detail=True, methods=['get', 'post'], parser_classes=[MultiPartParser, FormParser])
    def materials(self, request, pk=None):
        """List or upload materials for this node."""
        node = self.get_object()
        
        if request.method == 'GET':
            materials = PathNodeMaterial.objects.filter(node=node)
            # Filter teacher-only materials for non-teachers
            if not request.user.is_superuser:
                try:
                    if not hasattr(request.user, 'teacher_profile'):
                        materials = materials.filter(is_teacher_only=False)
                except Exception:
                    materials = materials.filter(is_teacher_only=False)
            
            serializer = PathNodeMaterialSerializer(materials, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Upload a new file
            file = request.FILES.get('file')
            if not file:
                return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
            
            material = PathNodeMaterial.objects.create(
                node=node,
                file=file,
                filename=file.name,
                file_type=file.content_type,
                file_size=file.size,
                is_teacher_only=request.data.get('is_teacher_only', 'false').lower() == 'true',
                uploaded_by=request.user
            )
            
            serializer = PathNodeMaterialSerializer(material, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class PathNodeMaterialViewSet(viewsets.ModelViewSet):
    """ViewSet for managing individual path node materials."""
    queryset = PathNodeMaterial.objects.all()
    serializer_class = PathNodeMaterialSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download a material file."""
        material = self.get_object()
        
        # Check access for teacher-only materials
        if material.is_teacher_only:
            if not request.user.is_superuser:
                try:
                    if not hasattr(request.user, 'teacher_profile'):
                        return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
                except Exception:
                    return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        response = FileResponse(material.file.open('rb'), as_attachment=True)
        response['Content-Disposition'] = f'attachment; filename="{material.filename}"'
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Delete a material - only by teacher/admin."""
        material = self.get_object()
        
        # Check if user can delete (uploader, teacher, or superuser)
        can_delete = (
            request.user.is_superuser or 
            material.uploaded_by == request.user
        )
        if not can_delete:
            try:
                if hasattr(request.user, 'teacher_profile'):
                    can_delete = True
            except Exception:
                pass
        
        if not can_delete:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Delete the file from storage
        material.file.delete(save=False)
        return super().destroy(request, *args, **kwargs)

