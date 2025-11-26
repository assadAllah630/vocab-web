"""
Test Google Cloud Text-to-Speech Setup
Run this to verify your Google Cloud TTS is configured correctly
"""
from google.cloud import texttospeech
import os

def test_google_tts():
    print("Testing Google Cloud Text-to-Speech Setup...")
    print("=" * 60)
    
    # Check environment variable
    creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if creds_path:
        print(f"✓ GOOGLE_APPLICATION_CREDENTIALS set to:")
        print(f"  {creds_path}")
    else:
        print("✗ GOOGLE_APPLICATION_CREDENTIALS not set!")
        print("  Please set this environment variable to your JSON key file path")
        return False
    
    # Check if file exists
    if os.path.exists(creds_path):
        print(f"✓ Credentials file exists")
    else:
        print(f"✗ Credentials file not found at: {creds_path}")
        return False
    
    try:
        # Initialize client
        client = texttospeech.TextToSpeechClient()
        print("✓ Successfully initialized TTS client")
        
        # List voices
        print("\nFetching available voices...")
        voices_response = client.list_voices()
        
        total_voices = len(voices_response.voices)
        print(f"✓ Found {total_voices} voices")
        
        # Count by language
        languages = {}
        for voice in voices_response.voices:
            for lang_code in voice.language_codes:
                if lang_code not in languages:
                    languages[lang_code] = 0
                languages[lang_code] += 1
        
        print(f"\n✓ Available in {len(languages)} languages")
        
        # Show German voices as example
        print("\nGerman (de-DE) voices:")
        print("-" * 60)
        german_voices = [v for v in voices_response.voices if 'de-DE' in v.language_codes]
        for voice in german_voices[:10]:  # Show first 10
            gender = texttospeech.SsmlVoiceGender(voice.ssml_gender).name
            print(f"  {voice.name:30} {gender:10}")
        
        if len(german_voices) > 10:
            print(f"  ... and {len(german_voices) - 10} more German voices")
        
        # Test speech generation
        print("\nTesting speech generation...")
        synthesis_input = texttospeech.SynthesisInput(text="Hallo! Dies ist ein Test.")
        voice = texttospeech.VoiceSelectionParams(
            language_code="de-DE",
            name="de-DE-Wavenet-F"
        )
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3
        )
        
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Save test audio
        with open("test_google_tts.mp3", "wb") as out:
            out.write(response.audio_content)
        
        print("✓ Successfully generated speech")
        print("✓ Saved test audio to: test_google_tts.mp3")
        
        print("\n" + "=" * 60)
        print("✓ ALL TESTS PASSED!")
        print("=" * 60)
        print("\nYour Google Cloud TTS is configured correctly!")
        print(f"Free tier: 1M characters/month for WaveNet voices")
        print(f"Available: {total_voices} voices across {len(languages)} languages")
        
        return True
        
    except Exception as e:
        print(f"\n✗ ERROR: {e}")
        print("\nPlease check:")
        print("1. Your Google Cloud project has Text-to-Speech API enabled")
        print("2. Your service account has the correct permissions")
        print("3. The JSON key file is valid")
        return False

if __name__ == "__main__":
    test_google_tts()
