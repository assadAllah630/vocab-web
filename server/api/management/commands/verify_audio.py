
import requests
from django.core.management.base import BaseCommand
from api.models import ExternalPodcast

class Command(BaseCommand):
    help = 'Verify audio URL availability'

    def handle(self, *args, **kwargs):
        podcast = ExternalPodcast.objects.filter(name__contains='Das sagt').first()
        if not podcast:
            self.stdout.write("❌ Podcast not found")
            return

        episode = podcast.episodes.first()
        if not episode:
            self.stdout.write("❌ Episode not found")
            return
            
        url = episode.audio_url
        self.stdout.write(f"checking URL: {url}")
        
        try:
            # Fake a browser user agent, just in case
            headers = {'User-Agent': 'Mozilla/5.0'}
            r = requests.head(url, headers=headers, allow_redirects=True, timeout=5)
            self.stdout.write(f"Status: {r.status_code}")
            
            if r.status_code == 200:
                self.stdout.write(self.style.SUCCESS("✅ AUDIO URL IS VALID"))
            else:
                 self.stdout.write(self.style.ERROR(f"❌ INVALID STATUS: {r.status_code}"))
                 
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ EXCEPTION: {e}"))
            
        # Write to file just in case needed
        with open('valid_url.txt', 'w', encoding='utf-8') as f:
            f.write(url)
