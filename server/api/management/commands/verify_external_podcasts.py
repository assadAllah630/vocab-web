
import requests
from django.core.management.base import BaseCommand
from api.models import ExternalPodcast

class Command(BaseCommand):
    help = 'Show accessible podcasts and iTunes search test'

    def handle(self, *args, **kwargs):
        self.stdout.write('\n================================================')
        self.stdout.write('       🎧 VOCABMASTER PODCAST ACCESS TEST       ')
        self.stdout.write('================================================')
        
        # 1. Local Database (Seeded/Imported)
        self.stdout.write('\n1. 📁 LOCAL LIBRARY (Ready to Stream)')
        podcasts = ExternalPodcast.objects.all()
        if podcasts.exists():
            for p in podcasts:
                self.stdout.write(f"   ✅ {p.name}")
                self.stdout.write(f"      - Episodes: {p.episode_count}")
                self.stdout.write(f"      - RSS: {p.feed_url[:60]}...")
                audio = p.episodes.first().audio_url if p.episodes.exists() else 'N/A'
                self.stdout.write(f"      - Stream: {audio[:60]}...")
        else:
            self.stdout.write("   (No podcasts in library yet)")

        # 2. iTunes Search (Global Access)
        self.stdout.write('\n2. 🌍 ITUNES API ACCESS (Live Search: "German")')
        try:
            response = requests.get(
                'https://itunes.apple.com/search',
                params={'term': 'german', 'media': 'podcast', 'limit': 3},
                timeout=5
            )
            data = response.json()
            results = data.get('results', [])
            
            for i, res in enumerate(results, 1):
                self.stdout.write(f"   {i}. {res['collectionName']}")
                self.stdout.write(f"      - Artist: {res['artistName']}")
                self.stdout.write(f"      - Feed: {res.get('feedUrl', 'N/A')[:60]}...")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ❌ Search failed: {e}"))
            
        self.stdout.write('\n================================================')
