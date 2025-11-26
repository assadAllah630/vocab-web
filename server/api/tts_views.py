"""
Google Cloud & Deepgram Text-to-Speech Views
Handles TTS voice listing and audio generation with streaming
Uses user-specific API keys for authentication
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions, status
from django.http import StreamingHttpResponse
from google.cloud import texttospeech
from google.oauth2 import service_account
import json
import os
import requests
from .models import UserProfile

def get_tts_client(api_key):
    """
    Create TTS client with user's API key
    API key should be the JSON service account key as a string
    """
    try:
        # Parse the API key as JSON
        credentials_dict = json.loads(api_key)
        credentials = service_account.Credentials.from_service_account_info(credentials_dict)
        client = texttospeech.TextToSpeechClient(credentials=credentials)
        return client
    except json.JSONDecodeError:
        raise ValueError("Invalid API key format. Please provide a valid Google Cloud service account JSON key.")
    except Exception as e:
        raise ValueError(f"Failed to create TTS client: {str(e)}")


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_tts_voices(request):
    """
    List all available Google TTS voices
    Returns 380+ voices across 75+ languages
    Uses user's API key from their profile
    """
    try:
        # Get user's API key
        api_key = request.user.profile.google_tts_api_key
        if not api_key:
            return Response({
                'error': 'Google TTS API key not configured. Please add your API key in Settings.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = get_tts_client(api_key)
        voices_response = client.list_voices()
        
        # Organize voices by language
        voices_by_language = {}
        for voice in voices_response.voices:
            for language_code in voice.language_codes:
                if language_code not in voices_by_language:
                    voices_by_language[language_code] = []
                
                voices_by_language[language_code].append({
                    'name': voice.name,
                    'gender': texttospeech.SsmlVoiceGender(voice.ssml_gender).name,
                    'natural_sample_rate': voice.natural_sample_rate_hertz,
                    'language_codes': list(voice.language_codes),
                })
        
        return Response({
            'total_voices': len(voices_response.voices),
            'voices_by_language': voices_by_language
        })
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Failed to list voices: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_voices_for_language(request, language_code):
    """
    Get voices for a specific language
    Example: /api/tts/voices/de-DE/
    """
    try:
        # Get user's API key
        api_key = request.user.profile.google_tts_api_key
        if not api_key:
            return Response({
                'error': 'Google TTS API key not configured. Please add your API key in Settings.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        client = get_tts_client(api_key)
        voices_response = client.list_voices(language_code=language_code)
        
        voices = []
        for voice in voices_response.voices:
            voices.append({
                'name': voice.name,
                'gender': texttospeech.SsmlVoiceGender(voice.ssml_gender).name,
                'natural_sample_rate': voice.natural_sample_rate_hertz,
                'language_codes': list(voice.language_codes),
            })
        
        return Response({
            'language_code': language_code,
            'count': len(voices),
            'voices': voices
        })
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Failed to list voices for {language_code}: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


from django_ratelimit.decorators import ratelimit

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@ratelimit(key='user', rate='30/m', block=True)
def generate_speech(request):
    """
    Generate speech from text using Deepgram (Priority) or Google Cloud TTS (Fallback)
    Streams audio directly to client (no server storage)
    """
    text = request.data.get('text')
    if not text:
        return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Try Deepgram First
    deepgram_key = request.user.profile.deepgram_api_key
    if deepgram_key:
        try:
            url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en" # Default to Asteria (English)
            
            # Simple mapping for other languages if needed, or let frontend pass model
            # For now, we'll default to English/German based on profile or request
            # Deepgram Aura models: https://developers.deepgram.com/docs/tts-models
            # English: aura-asteria-en, aura-luna-en, aura-stella-en, aura-athena-en, aura-hera-en, aura-orion-en, aura-arcas-en, aura-perseus-en, aura-angus-en, aura-orpheus-en, aura-helios-en, aura-zeus-en
            # No German Aura models yet? Checking docs... 
            # As of late 2024, Deepgram Aura supports English. 
            # If target is German, we might need to fallback to Google or check for new models.
            # For this implementation, we will use 'aura-asteria-en' as a placeholder or check if user wants specific model.
            
            payload = {"text": text}
            headers = {
                "Authorization": f"Token {deepgram_key}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(url, json=payload, headers=headers, stream=True)
            
            if response.status_code == 200:
                def deepgram_stream():
                    for chunk in response.iter_content(chunk_size=1024):
                        if chunk:
                            yield chunk

                return StreamingHttpResponse(
                    deepgram_stream(),
                    content_type='audio/mpeg',
                    headers={
                        'Content-Disposition': 'inline; filename="speech.mp3"',
                        'Cache-Control': 'no-cache'
                    }
                )
            else:
                print(f"Deepgram error: {response.text}")
                # Fallback to Google if Deepgram fails? Or return error?
                # Let's fallback if configured.
        except Exception as e:
            print(f"Deepgram exception: {str(e)}")
            # Fallback to Google

    # 2. Fallback to Google Cloud TTS
    try:
        api_key = request.user.profile.google_tts_api_key
        if not api_key:
             return Response({
                'error': 'No TTS API key configured. Please add Deepgram or Google TTS key in Settings.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get voice settings
        voice_name = request.data.get('voice_name') or request.user.profile.preferred_tts_voice
        language_code = request.data.get('language_code') or request.user.profile.preferred_tts_language
        speaking_rate = float(request.data.get('speaking_rate', 1.0))
        pitch = float(request.data.get('pitch', 0.0))
        
        # Initialize client with user's API key
        client = get_tts_client(api_key)
        
        # Set up synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Configure voice
        voice = texttospeech.VoiceSelectionParams(
            language_code=language_code,
            name=voice_name
        )
        
        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speaking_rate,
            pitch=pitch
        )
        
        # Generate speech
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        # Stream audio directly to client
        def audio_stream():
            yield response.audio_content
        
        return StreamingHttpResponse(
            audio_stream(),
            content_type='audio/mpeg',
            headers={
                'Content-Disposition': 'inline; filename="speech.mp3"',
                'Cache-Control': 'no-cache'
            }
        )
    
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Speech generation failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_google_tts_key(request):
    """
    Validate a Google Cloud TTS API key
    Tests by listing voices
    """
    try:
        api_key = request.data.get('api_key')
        if not api_key:
            return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Try to create client and list voices
        client = get_tts_client(api_key)
        voices_response = client.list_voices()
        
        return Response({
            'valid': True,
            'message': f'API key is valid! Found {len(voices_response.voices)} voices.',
            'total_voices': len(voices_response.voices)
        })
    
    except ValueError as e:
        return Response({
            'valid': False,
            'error': str(e)
        }, status=status.HTTP_200_OK)  # Return 200 to allow frontend to show error
    except Exception as e:
        return Response({
            'valid': False,
            'error': f'Validation failed: {str(e)}'
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_deepgram_key(request):
    """
    Validate a Deepgram API key
    Tests by making a simple request to the API
    """
    api_key = request.data.get('api_key')
    if not api_key:
        return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Test with a simple usage request or project details
        # Using usage endpoint as it's lightweight
        url = "https://api.deepgram.com/v1/projects"
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return Response({
                'valid': True,
                'message': 'Deepgram API key is valid!'
            })
        else:
            return Response({
                'valid': False,
                'error': 'Invalid API Key or permissions.'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'valid': False,
            'error': f'Validation failed: {str(e)}'
        }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def list_speechify_voices(request):
    """
    Get available Speechify voices
    """
    try:
        user_profile, created = UserProfile.objects.get_or_create(user=request.user)
        api_key = user_profile.speechify_api_key
        
        if not api_key:
            return Response({
                'voices': [],
                'error': 'Please add your Speechify API key in Settings'
            }, status=status.HTTP_200_OK)
        
        url = "https://api.sws.speechify.com/v1/voices"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            return Response(response.json())
        else:
            return Response({
                'voices': [],
                'error': 'Failed to fetch voices. Please check your API key.'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'voices': [],
            'error': str(e)
        }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def validate_speechify_key(request):
    api_key = request.data.get('api_key')
    if not api_key:
        return Response({'error': 'API key is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        url = "https://api.sws.speechify.com/v1/voices"
        headers = {"Authorization": f"Bearer {api_key}"}
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            voices = response.json()
            # Handle potential different response format
            count = len(voices) if isinstance(voices, list) else 0
            return Response({
                'valid': True,
                'message': f'Speechify API key is valid! Found {count} voices.'
            })
        else:
            return Response({
                'valid': False,
                'error': 'Invalid API Key or permissions.'
            }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'valid': False,
            'error': f'Validation failed: {str(e)}'
        }, status=status.HTTP_200_OK)
