"""
Test third ElevenLabs API key with official SDK
"""
try:
    from elevenlabs.client import ElevenLabs
    
    api_key = "sk_bafd95a27d272adff2a31b122ad66b897578f2f5001f639c"
    
    print("Testing third API key with official ElevenLabs SDK...")
    print(f"Key: {api_key[:20]}...")
    print()
    
    client = ElevenLabs(api_key=api_key)
    
    # Generate audio using SDK
    audio_generator = client.text_to_speech.convert(
        voice_id="EXAVITQu4vr4xnSDxMaL",
        text="Test",
        model_id="eleven_multilingual_v2"
    )
    
    # Save to file to verify it worked
    audio_chunks = []
    for chunk in audio_generator:
        audio_chunks.append(chunk)
    
    audio_bytes = b''.join(audio_chunks)
    
    with open("test_audio.mp3", "wb") as f:
        f.write(audio_bytes)
    
    print(f"✓ SUCCESS - API key is VALID!")
    print(f"Generated {len(audio_bytes)} bytes of audio")
    print("Audio saved to test_audio.mp3")
    
except Exception as e:
    print(f"✗ ERROR: {e}")
    
    # Try to parse the error
    error_str = str(e)
    if "detected_unusual_activity" in error_str:
        print("\n⚠ Account flagged for unusual activity")
    elif "missing_permissions" in error_str:
        print("\n⚠ API key missing required permissions")
    elif "invalid" in error_str.lower():
        print("\n⚠ Invalid API key")
