"""
API Views for External Podcast management.

Provides endpoints for:
- Listing external podcasts with filtering
- Viewing podcast details with episodes
- Admin: Adding podcasts by RSS URL
- Admin: Syncing podcasts from RSS feeds
"""

import logging
from typing import Optional

from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response

from ..models import ExternalPodcast, ExternalEpisode, ExternalPodcastSubscription, ExternalEpisodeInteraction
from ..serializers import (
    ExternalPodcastSerializer, 
    ExternalPodcastDetailSerializer,
    ExternalEpisodeSerializer,
    ExternalPodcastSubscriptionSerializer
)
from ..services.external_podcast import PodcastFeedService

logger = logging.getLogger(__name__)


# =============================================================================
# Public Endpoints (Authenticated Users)
# =============================================================================

import requests
import xml.etree.ElementTree as ET
from rest_framework.parsers import MultiPartParser
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_podcasts_itunes(request):
    """
    Search for podcasts using iTunes Search API (Free).
    Returns list of podcasts with RSS feed URLs.
    """
    query = request.query_params.get('q', '').strip()
    if not query or len(query) < 3:
        return Response({'results': []})
        
    try:
        # iTunes API is free and requires no key
        response = requests.get(
            'https://itunes.apple.com/search',
            params={
                'term': query,
                'media': 'podcast',
                'entity': 'podcast',
                'limit': 20,
                'lang': 'en_us'
            },
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        results = []
        for item in data.get('results', []):
            results.append({
                'name': item.get('collectionName'),
                'artist': item.get('artistName'),
                'feed_url': item.get('feedUrl'),
                'artwork_url': item.get('artworkUrl600'),
                'genres': item.get('genres', []),
                'itunes_id': item.get('collectionId')
            })
            
        return Response({'results': results})
        
    except Exception as e:
        logger.error(f"iTunes search failed: {e}")
        return Response(
            {'error': 'Search failed, please try again later'}, 
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def import_opml(request):
    """
    Import podcasts from OPML file.
    Adds podcasts to database and subscribes user to them.
    """
    if 'file' not in request.FILES:
        return Response(
            {'error': 'No file provided'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    opml_file = request.FILES['file']
    imported_count = 0
    
    try:
        tree = ET.parse(opml_file)
        root = tree.getroot()
        
        # Find all outline elements with xmlUrl (RSS feed)
        feed_urls = []
        for outline in root.findall('.//outline[@xmlUrl]'):
            feed_urls.append(outline.get('xmlUrl'))
            
        # Process unique feeds
        unique_feeds = list(set(feed_urls))
        service = PodcastFeedService()
        
        for feed_url in unique_feeds:
            # Check if exists
            podcast = ExternalPodcast.objects.filter(feed_url=feed_url).first()
            
            if not podcast:
                try:
                    # New podcast - parse and create
                    data = service.parse_feed(feed_url)
                    podcast = ExternalPodcast.objects.create(
                        name=data['name'][:255],
                        feed_url=feed_url,
                        description=data['description'],
                        author=data['author'][:255] if data['author'] else '',
                        artwork_url=data['artwork_url'][:500] if data['artwork_url'] else '',
                        website_url=data['website_url'][:500] if data['website_url'] else '',
                        language=data['language'],
                        level='B1',  # Default
                        last_synced_at=timezone.now()
                    )
                except Exception as e:
                    logger.warning(f"Failed to import {feed_url}: {e}")
                    continue
            
            # Subscribe user
            ExternalPodcastSubscription.objects.get_or_create(
                user=request.user,
                podcast=podcast
            )
            imported_count += 1
            
        return Response({'imported': imported_count})
        
    except Exception as e:
        logger.error(f"OPML import failed: {e}")
        return Response(
            {'error': 'Invalid OPML file'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


class ExternalPodcastListView(generics.ListAPIView):
    """
    List all active external podcasts with filtering.
    
    GET /api/external-podcasts/
    Query params:
        - level: A1, A2, B1, B2, C1, C2
        - language: de, en, ar, etc.
        - featured: true/false
    """
    serializer_class = ExternalPodcastSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = ExternalPodcast.objects.filter(is_active=True)
        
        # Filter by level
        level = self.request.query_params.get('level')
        if level and level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
            queryset = queryset.filter(level=level)
        
        # Filter by language
        language = self.request.query_params.get('language')
        if language:
            queryset = queryset.filter(language=language[:2].lower())
        
        # Filter featured only
        featured = self.request.query_params.get('featured')
        if featured and featured.lower() == 'true':
            queryset = queryset.filter(is_featured=True)
        
        return queryset.select_related().prefetch_related('subscriptions')
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ExternalPodcastDetailView(generics.RetrieveAPIView):
    """
    Get podcast details with recent episodes.
    
    GET /api/external-podcasts/<id>/
    """
    serializer_class = ExternalPodcastDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = ExternalPodcast.objects.filter(is_active=True)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class ExternalEpisodeListView(generics.ListAPIView):
    """
    List all episodes for a podcast (paginated).
    
    GET /api/external-podcasts/<podcast_id>/episodes/
    """
    serializer_class = ExternalEpisodeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        podcast_id = self.kwargs.get('podcast_id')
        queryset = ExternalEpisode.objects.filter(podcast_id=podcast_id)
        
        search_query = self.request.query_params.get('search', '')
        if search_query:
            # Full-text search with ranking
            # Weights: A=1.0 (Title), B=0.4 (Description), C=0.2 (Transcript)
            vector = (
                SearchVector('title', weight='A') +
                SearchVector('description', weight='B') +
                SearchVector('transcript', weight='C')
            )
            query = SearchQuery(search_query)
            
            queryset = queryset.annotate(
                rank=SearchRank(vector, query)
            ).filter(rank__gte=0.1).order_by('-rank')
            
        return queryset


# =============================================================================
# Admin Endpoints
# =============================================================================

@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_podcast_by_url(request):
    """
    Add a new external podcast by RSS feed URL.
    
    POST /api/external-podcasts/add/
    Body: {
        "feed_url": "https://rss.dw.com/xml/...",
        "level": "B1"  (optional, defaults to B1)
    }
    """
    feed_url = request.data.get('feed_url', '').strip()
    level = request.data.get('level', 'B1')
    
    # Validate input
    if not feed_url:
        return Response(
            {'error': 'feed_url is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate level
    valid_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    if level not in valid_levels:
        level = 'B1'
    
    # Check if already exists
    if ExternalPodcast.objects.filter(feed_url=feed_url).exists():
        return Response(
            {'error': 'Podcast with this feed URL already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Parse the feed
    service = PodcastFeedService()
    try:
        data = service.parse_feed(feed_url)
    except ValueError as e:
        logger.warning(f"Failed to parse feed {feed_url}: {e}")
        return Response(
            {'error': f'Failed to parse feed: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing feed {feed_url}: {e}")
        return Response(
            {'error': 'Failed to fetch RSS feed. Please check the URL.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create podcast
    podcast = ExternalPodcast.objects.create(
        name=data['name'][:255],
        feed_url=feed_url,
        description=data['description'],
        author=data['author'][:255] if data['author'] else '',
        artwork_url=data['artwork_url'][:500] if data['artwork_url'] else '',
        website_url=data['website_url'][:500] if data['website_url'] else '',
        language=data['language'],
        level=level,
        last_synced_at=timezone.now()
    )
    
    # Create episodes (no limit, fetch all available in feed)
    episode_count = 0
    for ep_data in data['episodes']:
        try:
            ExternalEpisode.objects.create(
                podcast=podcast,
                guid=ep_data['guid'][:500],
                title=ep_data['title'][:500],
                description=ep_data['description'],
                audio_url=ep_data['audio_url'][:1000],
                duration=ep_data['duration'],
                published_at=ep_data['published_at'],
                file_size=ep_data['file_size'],
                image_url=ep_data.get('image_url', '')[:500] if ep_data.get('image_url') else ''
            )
            episode_count += 1
        except Exception as e:
            logger.warning(f"Failed to create episode: {e}")
            continue
    
    podcast.episode_count = episode_count
    podcast.save()
    
    logger.info(f"Added podcast: {podcast.name} with {episode_count} episodes")
    
    return Response({
        'message': f'Added podcast: {podcast.name}',
        'podcast': ExternalPodcastSerializer(podcast).data,
        'episodes_added': episode_count
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def sync_podcast_feed(request, pk):
    """
    Sync a podcast from its RSS feed to get new episodes.
    
    POST /api/external-podcasts/<id>/sync/
    """
    podcast = get_object_or_404(ExternalPodcast, pk=pk)
    
    service = PodcastFeedService()
    try:
        data = service.parse_feed(podcast.feed_url)
    except ValueError as e:
        return Response(
            {'error': f'Failed to parse feed: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error syncing podcast {podcast.name}: {e}")
        return Response(
            {'error': 'Failed to fetch RSS feed'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update podcast metadata
    podcast.name = data['name'][:255]
    podcast.description = data['description']
    podcast.author = data['author'][:255] if data['author'] else ''
    podcast.artwork_url = data['artwork_url'][:500] if data['artwork_url'] else ''
    podcast.website_url = data['website_url'][:500] if data['website_url'] else ''
    
    # Sync episodes
    new_episodes = 0
    updated_episodes = 0
    
    for ep_data in data['episodes']:
        try:
            episode, created = ExternalEpisode.objects.update_or_create(
                guid=ep_data['guid'][:500],
                defaults={
                    'podcast': podcast,
                    'title': ep_data['title'][:500],
                    'description': ep_data['description'],
                    'audio_url': ep_data['audio_url'][:1000],
                    'duration': ep_data['duration'],
                    'published_at': ep_data['published_at'],
                    'file_size': ep_data['file_size'],
                    'image_url': ep_data.get('image_url', '')[:500] if ep_data.get('image_url') else ''
                }
            )
            if created:
                new_episodes += 1
            else:
                updated_episodes += 1
        except Exception as e:
            logger.warning(f"Failed to sync episode: {e}")
            continue
    
    podcast.episode_count = podcast.episodes.count()
    podcast.last_synced_at = timezone.now()
    podcast.save()
    
    logger.info(f"Synced {podcast.name}: {new_episodes} new, {updated_episodes} updated")
    
    return Response({
        'message': f'Synced {podcast.name}',
        'new_episodes': new_episodes,
        'updated_episodes': updated_episodes,
        'total_episodes': podcast.episode_count
    })


# =============================================================================
# Subscription Endpoints
# =============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def subscribe_to_podcast(request, pk):
    """Subscribe to a podcast."""
    podcast = get_object_or_404(ExternalPodcast, pk=pk, is_active=True)
    
    subscription, created = ExternalPodcastSubscription.objects.get_or_create(
        user=request.user,
        podcast=podcast
    )
    
    if created:
        return Response(
            {'message': f'Subscribed to {podcast.name}'}, 
            status=status.HTTP_201_CREATED
        )
    return Response({'message': 'Already subscribed'})


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsubscribe_from_podcast(request, pk):
    """Unsubscribe from a podcast."""
    deleted, _ = ExternalPodcastSubscription.objects.filter(
        user=request.user,
        podcast_id=pk
    ).delete()
    
    if deleted:
        return Response({'message': 'Unsubscribed'})
    return Response({'message': 'Not subscribed'}, status=status.HTTP_404_NOT_FOUND)


class UserSubscriptionsView(generics.ListAPIView):
    """List user's podcast subscriptions."""
    
    serializer_class = ExternalPodcastSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ExternalPodcastSubscription.objects.filter(
            user=self.request.user
        ).select_related('podcast', 'last_played_episode')


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def scrape_episode_transcript(request, pk):
    """
    On-demand scraping of transcript from the episode source link.
    Uses Trafilatura for smart text extraction.
    
    POST /api/external-episodes/<pk>/scrape_transcript/
    """
    episode = get_object_or_404(ExternalEpisode, pk=pk)
    
    if not episode.link:
        return Response(
            {"error": "No source link available for this episode"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    # Import here to avoid circular imports
    from ..services.external_podcast import TranscriptScraperService
    
    transcript = TranscriptScraperService.fetch_transcript(episode.link)
    
    if transcript:
        # Save to DB so we don't need to scrape again
        episode.transcript = transcript
        episode.transcript_source = 'scraped'
        episode.save()
        return Response({"transcript": transcript})
    else:
        return Response(
            {"error": "Could not extract transcript from website. The site might be blocking scrapers or has no text."}, 
            status=status.HTTP_424_FAILED_DEPENDENCY
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_episode_transcript(request, pk):
    """
    Update the transcript for an episode (e.g. after AI formatting).
    
    POST /api/external-episodes/<pk>/update_transcript/
    Body: { "transcript": "..." }
    """
    episode = get_object_or_404(ExternalEpisode, pk=pk)
    
    transcript = request.data.get('transcript')
    if not transcript:
        return Response(
            {"error": "Transcript content is required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
        
    episode.transcript = transcript
    episode.transcript_source = 'ai_formatted'
    episode.save()
    
    return Response({"success": True, "message": "Transcript updated successfully"})

from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny

@api_view(['GET'])
@permission_classes([AllowAny])
def proxy_image(request):
    """
    Proxy external images to avoid 403 Forbidden (hotlinking protection).
    """
    url = request.query_params.get('url')
    if not url:
        return Response({'error': 'URL is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Browser-like headers to bypass simple bot protection
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        }
        
        # Stream the response back to the client
        resp = requests.get(url, headers=headers, stream=True, timeout=10)
        resp.raise_for_status()
        
        return StreamingHttpResponse(
            resp.iter_content(chunk_size=8192),
            content_type=resp.headers.get('Content-Type', 'image/jpeg')
        )
    except Exception as e:
        logger.error(f"Image proxy failed for {url}: {e}")
        return Response({'error': 'Failed to fetch image'}, status=status.HTTP_502_BAD_GATEWAY)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_episode_like(request, pk):
    """Toggle Like (Heart) status for an episode."""
    episode = get_object_or_404(ExternalEpisode, pk=pk)
    
    interaction, created = ExternalEpisodeInteraction.objects.get_or_create(
        user=request.user,
        episode=episode
    )
    
    # Toggle
    interaction.is_liked = not interaction.is_liked
    interaction.save()
    
    return Response({
        'status': 'liked' if interaction.is_liked else 'unliked',
        'is_liked': interaction.is_liked
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_episode_save(request, pk):
    """Toggle Save (Bookmark) status for an episode."""
    episode = get_object_or_404(ExternalEpisode, pk=pk)
    
    interaction, created = ExternalEpisodeInteraction.objects.get_or_create(
        user=request.user,
        episode=episode
    )
    
    # Toggle
    interaction.is_saved = not interaction.is_saved
    interaction.save()
    
    return Response({
        'status': 'saved' if interaction.is_saved else 'unsaved',
        'is_saved': interaction.is_saved
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_notification(request):
    """Manually trigger daily digest email for testing."""
    try:
        from ..services.external_podcast.tasks import check_new_episodes_and_notify
        # Run synchronously for immediate feedback
        result = check_new_episodes_and_notify()
        return Response({'message': 'Digest task executed', 'result': str(result)})
    except Exception as e:
        logger.error(f"Test notification failed: {e}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
