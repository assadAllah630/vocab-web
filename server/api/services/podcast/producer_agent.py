import os
import requests
import uuid
import json
import base64
from django.conf import settings
from django.core.files.base import ContentFile
from api.models import Podcast


class ProducerAgent:
    def __init__(self, user):
        self.user = user
        self.api_key = getattr(user.profile, 'speechify_api_key', '')

    def run(self, script_data: dict, podcast_instance: Podcast, audio_speed: float = 1.0):
        """
        Generates audio from script and saves to podcast instance.
        """
        script = script_data.get('script', [])
        combined_audio = b""
        combined_marks = []
        current_time_offset_ms = 0
        
        # Language Lookup
        lang = getattr(self.user.profile, 'target_language', 'en').lower()
        
        # Get Voice Map (Speechify)
        voice_map = self._get_voices_speechify(lang)
        print(f"DEBUG: Producer Language='{lang}'. Voice Map: {voice_map}")
        
        # Check API Key
        if not self.api_key:
             print("Producer Error: No Speechify Key found in user profile.")
             return False

        for segment in script:
            speaker = segment.get('speaker', 'Host A')
            text = segment.get('text', '')
            voice_id = voice_map.get(speaker, voice_map['Host A'])
            
            # Call Speechify
            audio_chunk, marks = self._generate_tts_speechify(text, voice_id)
            
            if audio_chunk:
                combined_audio += audio_chunk
                
                # Process timestamps
                if marks:
                    for mark in marks:
                        # Normalize Speechify marks to standard format
                        word = mark.get('value') or mark.get('word')
                        start_time = mark.get('start_time') or mark.get('time') or mark.get('start', 0)
                        
                        if word:
                             combined_marks.append({
                                 'word': word,
                                 'time': start_time + current_time_offset_ms,
                                 'speaker': speaker
                             })
                
                # Update chunk duration
                chunk_duration_ms = 0
                if marks:
                    last = marks[-1]
                    end = last.get('end_time') or last.get('end')
                    if end:
                        chunk_duration_ms = end
                
                if chunk_duration_ms == 0:
                    # Fallback: 128kbps = 16000 bytes/sec = 16 bytes/ms
                    chunk_duration_ms = len(audio_chunk) / 16.0 
                
                current_time_offset_ms += chunk_duration_ms
                
        if not combined_audio:
            print("Producer Error: No audio generated. Check Speechify key or script content.")
            return False

        # Save to file
        filename = f"podcast_{podcast_instance.id}_{uuid.uuid4().hex[:8]}.mp3"
        podcast_instance.audio_file.save(filename, ContentFile(combined_audio))
        podcast_instance.duration = int(current_time_offset_ms / 1000)
        podcast_instance.speech_marks = combined_marks
        podcast_instance.save(update_fields=['duration', 'audio_file', 'speech_marks'])
        
        return True

    def _generate_tts_speechify(self, text, voice_id):
        url = "https://api.sws.speechify.com/v1/audio/speech"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "input": text,
            "voice_id": voice_id,
            "audio_format": "mp3",
            "model": "simba-multilingual",
            "options": {"speech_marks": True}
        }
        
        try:
            response = requests.post(url, headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                response_data = response.json()
                audio_data = None
                marks = []
                
                if 'audio_data' in response_data:
                    audio_data = base64.b64decode(response_data['audio_data'])
                
                if 'speech_marks' in response_data:
                    raw_marks = response_data['speech_marks']
                    if isinstance(raw_marks, dict) and 'chunks' in raw_marks:
                        marks = raw_marks['chunks']
                    elif isinstance(raw_marks, list):
                        marks = raw_marks
                        
                return audio_data, marks
            else:
                if response.status_code == 401:
                    print(f"Speechify Error: 401 Unauthorized. Check API key. Response: {response.text}")
                else:
                    print(f"Speechify Error: {response.status_code} - {response.text}")
                return None, None 
        except Exception as e:
            print(f"TTS Exception (Speechify): {e}")
            return None, None

    def _get_voices_speechify(self, lang_code: str):
        """Returns Host A/B voice IDs for Speechify"""
        if lang_code == 'de':
            return {"Host A": "sarah", "Host B": "viktor"}
        elif lang_code == 'es':
            return {"Host A": "bruno", "Host B": "lucia"}
        elif lang_code == 'fr':
            return {"Host A": "mathieu", "Host B": "celine"}
             
        # Default / English
        return {"Host A": "snoop", "Host B": "gwyneth"}
