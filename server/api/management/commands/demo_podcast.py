
import os
from django.core.management.base import BaseCommand
from api.models import ExternalPodcast, ExternalEpisode

class Command(BaseCommand):
    help = 'Demo audio URL and transcript generation'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n================================================')
        self.stdout.write('       🎧 VOCABMASTER PODCAST EXPERIENCE        ')
        self.stdout.write('================================================')
        
        # Get a seeded podcast
        podcast = ExternalPodcast.objects.filter(name__icontains='Deutsch').first()
        
        if not podcast:
            self.stdout.write(self.style.ERROR("❌ No seeded podcasts found. Please run seed command first."))
            return

        # Get the latest episode
        episode = podcast.episodes.first()
        
        if not episode:
            self.stdout.write(self.style.ERROR(f"❌ No episodes found for {podcast.name}"))
            return

        self.stdout.write(f"\n1. 🔊 RUN ONE (Direct Audio Stream)")
        self.stdout.write(f"   Podcast: {podcast.name}")
        self.stdout.write(f"   Episode: {episode.title}")
        self.stdout.write(f"   🔗 CLICK TO PLAY: {episode.audio_url}")

        self.stdout.write(f"\n2. 📝 TRANSCRIPT (Extracted from Description)")
        
        # Create a transcript text file
        transcript_text = f"""PODCAST: {podcast.name}
EPISODE: {episode.title}
PUBLISHED: {episode.published_at}
DURATION: {episode.duration} seconds
----------------------------------------

{episode.description}

----------------------------------------
(Source: RSS Feed Description)
"""
        
        filename = 'transcript_demo.txt'
        # Save to CWD (server root)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(transcript_text)
            
        self.stdout.write(self.style.SUCCESS(f"   ✅ Saved to file: {os.path.abspath(filename)}"))
        self.stdout.write(f"   📄 Preview (First 300 chars):")
        self.stdout.write(f"   {'-'*40}")
        self.stdout.write(f"   {episode.description[:300]}...")
        self.stdout.write(f"   {'-'*40}")
        
        self.stdout.write('\n================================================')
