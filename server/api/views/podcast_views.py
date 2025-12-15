from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Podcast, PodcastCategory
from ..serializers import PodcastSerializer, PodcastCategorySerializer
from ..services.background_podcast import generate_podcast_job
import threading

class PodcastCategoryViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PodcastCategorySerializer

    def get_queryset(self):
        return PodcastCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class PodcastViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PodcastSerializer

    def get_queryset(self):
        return Podcast.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Allow basic create, but main logic is in generation
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Trigger podcast generation.
        Payload: { "category_id": int }
        """
        category_id = request.data.get('category_id')
        if not category_id:
            return Response({"error": "Category ID required"}, status=400)
            
        try:
            category = PodcastCategory.objects.get(id=category_id, user=request.user)
        except PodcastCategory.DoesNotExist:
            return Response({"error": "Category not found"}, status=404)
            
        # Create placeholder Podcast
        # Determine episode number
        last_ep = Podcast.objects.filter(category=category).order_by('-episode_number').first()
        next_ep_num = (last_ep.episode_number + 1) if last_ep else 1
        
        # Custom Inputs
        custom_topic = request.data.get('topic')
        target_level = request.data.get('level', 'B1')
        audio_speed = float(request.data.get('speed', 1.0))
        
        podcast = Podcast.objects.create(
            user=request.user,
            category=category,
            title=f"Episode {next_ep_num}: {custom_topic or 'Generating...'}",
            text_content="Script is being written...",
            episode_number=next_ep_num
        )
        
        # Start Background Job
        thread = threading.Thread(
            target=generate_podcast_job, 
            args=(podcast.id,), 
            kwargs={
                'custom_topic': custom_topic,
                'target_level': target_level,
                'audio_speed': audio_speed
            }
        )
        thread.start()
        
        return Response(PodcastSerializer(podcast).data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        # Clean up audio file
        if instance.audio_file:
            instance.audio_file.delete(save=False)
        instance.delete()
