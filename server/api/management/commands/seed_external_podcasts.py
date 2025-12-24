"""
Management command to seed initial external podcasts.

Seeds German learning podcasts from Deutsche Welle and other sources.
Only adds podcasts that don't already exist.

Usage:
    python manage.py seed_external_podcasts
"""

import logging
from django.core.management.base import BaseCommand
from django.utils import timezone

from api.models import ExternalPodcast, ExternalEpisode
from api.services.external_podcast import PodcastFeedService

logger = logging.getLogger(__name__)


SEED_PODCASTS = [
    # === A1: Beginner ===
    {
        'feed_url': 'https://rss.dw.com/xml/dwn_podcast_deutschtrainer',
        'level': 'A1',
        'is_featured': True,
    },
    {
        'feed_url': 'https://feeds.acast.com/public/shows/0c3c53a1-180f-435a-9453-cec3883b4ada',  # Coffee Break German
        'level': 'A1',
        'is_featured': True,
    },

    # === A2: Elementary ===
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_radiod1_de',
        'level': 'A2',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_radiod2_de',
        'level': 'A2',
        'is_featured': False,
    },

    # === B1: Intermediate ===
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_topthema_de',
        'level': 'B1',
        'is_featured': True,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_sagtmanso_de',
        'level': 'B1', # Das sagt man so!
        'is_featured': True,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_ticket_de',
        'level': 'B1',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_missionberlin_de',
        'level': 'B1',
        'is_featured': False,
    },

    # === B2: Upper Intermediate ===
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_langsam_de', # Langsam gesprochene Nachrichten
        'level': 'B2',
        'is_featured': True,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_WortderWoche_de',
        'level': 'B2',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_marktplatz_de',
        'level': 'B2',
        'is_featured': False,
    },
    {
        'feed_url': 'https://feeds.acast.com/public/shows/63cfc6d668877900110ea42a', # Auf Deutsch gesagt!
        'level': 'B2',
        'is_featured': True,
    },
    {
        'feed_url': 'https://slowgerman.com/feed/podcast/',
        'level': 'B2',
        'is_featured': True,
    },

    # === C1: Advanced ===
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_alltagsdeutsch_de',
        'level': 'C1',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_sprachbar_de',
        'level': 'C1',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_zukunft_de',
        'level': 'C1',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_wissenschaft_de',
        'level': 'C1',
        'is_featured': False,
    },

    # === C2: Mastery / Native ===
    {
        'feed_url': 'https://www.swr.de/~rss/swr2/wissen/podcast-swr2-wissen-100.xml',
        'level': 'C2',
        'is_featured': True,
    },
    {
        'feed_url': 'https://www.deutschlandfunk.de/der-tag-rss-100.xml',
        'level': 'C2',
        'is_featured': False,
    },
    {
        'feed_url': 'https://rss.dw.com/xml/DKpodcast_videothema_de',
        'level': 'C2',
        'is_featured': False,
    }
]


class Command(BaseCommand):
    help = 'Seeds initial external podcasts for German learning'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force re-sync existing podcasts',
        )
        parser.add_argument(
            '--max-episodes',
            type=int,
            default=30,
            help='Maximum episodes per podcast (default: 30)',
        )

    def handle(self, *args, **options):
        service = PodcastFeedService()
        force = options['force']
        max_episodes = options['max_episodes']
        
        added = 0
        skipped = 0
        failed = 0
        
        self.stdout.write(self.style.NOTICE(
            f'Seeding {len(SEED_PODCASTS)} podcasts (max {max_episodes} episodes each)...\n'
        ))
        
        for podcast_info in SEED_PODCASTS:
            feed_url = podcast_info['feed_url']
            level = podcast_info['level']
            is_featured = podcast_info.get('is_featured', False)
            
            # Check if already exists
            existing = ExternalPodcast.objects.filter(feed_url=feed_url).first()
            if existing and not force:
                self.stdout.write(f'  ⏭️  Skipping (exists): {existing.name}')
                skipped += 1
                continue
            
            try:
                self.stdout.write(f'  📡 Parsing: {feed_url}')
                data = service.parse_feed(feed_url)
                
                if existing:
                    # Update existing podcast
                    podcast = existing
                    podcast.name = data['name'][:255]
                    podcast.description = data['description']
                    podcast.author = data['author'][:255] if data['author'] else ''
                    podcast.artwork_url = data['artwork_url'][:500] if data['artwork_url'] else ''
                    podcast.website_url = data['website_url'][:500] if data['website_url'] else ''
                    podcast.is_featured = is_featured
                    podcast.last_synced_at = timezone.now()
                    podcast.save()
                else:
                    # Create new podcast
                    podcast = ExternalPodcast.objects.create(
                        name=data['name'][:255],
                        feed_url=feed_url,
                        description=data['description'],
                        author=data['author'][:255] if data['author'] else '',
                        artwork_url=data['artwork_url'][:500] if data['artwork_url'] else '',
                        website_url=data['website_url'][:500] if data['website_url'] else '',
                        language=data['language'],
                        level=level,
                        is_featured=is_featured,
                        last_synced_at=timezone.now()
                    )
                
                # Add episodes
                episode_count = 0
                for ep_data in data['episodes'][:max_episodes]:
                    try:
                        _, created = ExternalEpisode.objects.update_or_create(
                            guid=ep_data['guid'][:500],
                            defaults={
                                'podcast': podcast,
                                'title': ep_data['title'][:500],
                                'link': ep_data.get('link', '')[:500],
                                'description': ep_data['description'],
                                'audio_url': ep_data['audio_url'][:1000],
                                'duration': ep_data['duration'],
                                'published_at': ep_data['published_at'],
                                'file_size': ep_data['file_size'],
                                'image_url': ep_data.get('image_url', '')[:500] if ep_data.get('image_url') else ''
                            }
                        )
                        episode_count += 1
                    except Exception as e:
                        logger.warning(f'Failed to create episode: {e}')
                        continue
                
                podcast.episode_count = podcast.episodes.count()
                podcast.save()
                
                self.stdout.write(self.style.SUCCESS(
                    f'  ✅ Added: {podcast.name} ({episode_count} episodes)'
                ))
                added += 1
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f'  ❌ Failed: {feed_url} - {e}'
                ))
                failed += 1
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'Done! Added: {added}, Skipped: {skipped}, Failed: {failed}'
        ))
        
        total = ExternalPodcast.objects.count()
        total_episodes = ExternalEpisode.objects.count()
        self.stdout.write(f'Total podcasts: {total}, Total episodes: {total_episodes}')
