
import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from api.models import ExternalPodcast, ExternalEpisode

def run_demo():
    print('\n================================================')
    print('       🎧 VOCABMASTER PODCAST EXPERIENCE        ')
    print('================================================')
    
    # Get a seeded podcast
    podcast = ExternalPodcast.objects.filter(name__icontains='Deutsch').first()
    
    if not podcast:
        print("❌ No seeded podcasts found. Please run seed command first.")
        return

    # Get the latest episode
    episode = podcast.episodes.first()
    
    if not episode:
        print(f"❌ No episodes found for {podcast.name}")
        return

    print(f"\n1. 🔊 RUN ONE (Direct Audio Stream)")
    print(f"   Podcast: {podcast.name}")
    print(f"   Episode: {episode.title}")
    print(f"   🔗 CLICK TO PLAY: {episode.audio_url}")

    print(f"\n2. 📝 TRANSCRIPT (Extracted from Description)")
    
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
    
    file_path = os.path.join(os.getcwd(), 'transcript_demo.txt')
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(transcript_text)
        
    print(f"   ✅ Saved to file: {file_path}")
    print(f"   📄 Preview (First 300 chars):")
    print(f"   {'-'*40}")
    print(f"   {episode.description[:300]}...")
    print(f"   {'-'*40}")
    
    print('\n================================================')

if __name__ == '__main__':
    run_demo()
