"""
Web Content Extraction Service
Extracts content from URLs, YouTube videos, and web articles.

Uses best-in-class FREE libraries:
- Trafilatura (93.7% F1 score) for articles
- youtube-transcript-api for YouTube transcripts (FREE UNLIMITED)
- Newspaper4k for news articles with NLP
- Jina Reader API as fallback for JS-heavy sites
"""
import re
import logging
from typing import Optional, Dict, Any
from urllib.parse import urlparse, parse_qs

import httpx
import trafilatura
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable
)

logger = logging.getLogger(__name__)


class ContentExtractionError(Exception):
    """Custom exception for content extraction errors."""
    pass


class ContentExtractor:
    """
    Unified content extraction from URLs and videos.
    
    Extracts:
    - Web articles (Trafilatura → Newspaper4k → Jina fallback)
    - YouTube transcripts (auto-generated + manual)
    - News with NLP (keywords, summary)
    """
    
    # Jina Reader API (FREE: 200 req/min with API key, 20/min without)
    JINA_READER_URL = "https://r.jina.ai/"
    
    # YouTube URL patterns
    YOUTUBE_PATTERNS = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})',
    ]
    
    def __init__(self, jina_api_key: Optional[str] = None):
        """
        Initialize the content extractor.
        
        Args:
            jina_api_key: Optional Jina API key for higher rate limits (200/min vs 20/min)
        """
        self.jina_api_key = jina_api_key
        self.http_client = httpx.Client(timeout=30.0, follow_redirects=True)
    
    def extract(self, url: str, prefer_transcript: bool = True) -> Dict[str, Any]:
        """
        Extract content from any URL (article or YouTube video).
        
        Args:
            url: URL to extract content from
            prefer_transcript: For YouTube, prefer transcript over description
            
        Returns:
            dict with keys:
                - content: Extracted text
                - title: Page/video title
                - source_type: 'article', 'youtube', or 'webpage'
                - language: Detected language
                - metadata: Additional info (author, date, keywords, etc.)
        """
        # Check if YouTube
        video_id = self._extract_youtube_id(url)
        if video_id:
            return self._extract_youtube(video_id, url)
        
        # Otherwise, extract as article
        return self._extract_article(url)
    
    def _extract_youtube_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL."""
        for pattern in self.YOUTUBE_PATTERNS:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def _extract_youtube(self, video_id: str, url: str, preferred_language: str = None) -> Dict[str, Any]:
        """
        Extract YouTube video transcript.
        
        Uses youtube-transcript-api (FREE, UNLIMITED, NO API KEY).
        Prioritizes the preferred_language transcript if available.
        """
        try:
            # Create API instance
            # API is static, no instance needed
            
            transcript_data = None
            language = 'auto'
            transcript_type = 'auto'
            
            # If preferred language specified, try to get that transcript first
            if preferred_language:
                try:
                    # List all available transcripts using instance method
                    transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
                    
                    # Log available languages
                    try:
                        available_langs = [f"{t.language_code} ({'auto' if t.is_generated else 'manual'})" for t in transcript_list]
                        logger.info(f"Available transcripts for {video_id}: {available_langs}")
                    except:
                        pass
                    
                    logger.info(f"Looking for preferred language: {preferred_language}")
                    
                    # Try to find transcript in preferred language
                    try:
                        transcript = transcript_list.find_transcript([preferred_language])
                        fetched = transcript.fetch()
                        if fetched:
                            transcript_data = fetched
                            language = preferred_language
                            transcript_type = 'manual' if not transcript.is_generated else 'auto'
                            logger.info(f"SUCCESS: Found transcript in target language: {language}")
                    except:
                        # try translation
                        logger.info(f"No direct {preferred_language} transcript, trying translation...")
                        try:
                            # Try to translate the first available transcript
                            source_transcript = None
                            try:
                                source_transcript = transcript_list.find_manually_created_transcript(['en', 'de', 'fr', 'es'])
                            except:
                                try:
                                    source_transcript = transcript_list.find_generated_transcript(['en'])
                                except:
                                    for t in transcript_list:
                                        source_transcript = t
                                        break
                            
                            if source_transcript and source_transcript.is_translatable:
                                translated = source_transcript.translate(preferred_language)
                                fetched = translated.fetch()
                                if fetched:
                                    transcript_data = fetched
                                    language = preferred_language
                                    transcript_type = 'translated'
                                    logger.info(f"SUCCESS: Using translated transcript from {source_transcript.language_code} to {preferred_language}")
                        except Exception as e:
                            logger.warning(f"Translation to {preferred_language} failed: {e}")

                except Exception as e:
                    logger.warning(f"Could not get preferred language transcript list: {e}")
            
            # Fallback: get any available transcript using fetch() (proven to work)
            if not transcript_data:
                transcript_result = YouTubeTranscriptApi.get_transcript(video_id)
                
                if hasattr(transcript_result, 'snippets'):
                    transcript_data = [
                        {'text': s.text, 'start': s.start, 'duration': s.duration}
                        for s in transcript_result.snippets
                    ]
                    language = getattr(transcript_result, 'language', 'auto')
                else:
                    transcript_data = transcript_result if isinstance(transcript_result, list) else []
                    language = 'auto'
            
            if not transcript_data:
                raise ContentExtractionError("No transcript data available")
            
            # Combine all text segments
            full_text = '\n'.join([
                segment['text'] if isinstance(segment, dict) else getattr(segment, 'text', '')
                for segment in transcript_data
            ])
            
            # Get video title
            title = self._get_youtube_title(video_id)
            
            return {
                'content': full_text,
                'title': title,
                'source_type': 'youtube',
                'language': language if isinstance(language, str) else 'auto',
                'word_count': len(full_text.split()),
                'metadata': {
                    'video_id': video_id,
                    'url': url,
                    'transcript_type': transcript_type,
                    'duration_segments': len(transcript_data),
                    'preferred_language': preferred_language or 'none',
                }
            }
            
        except TranscriptsDisabled:
            raise ContentExtractionError("Transcripts are disabled for this video")
        except VideoUnavailable:
            raise ContentExtractionError("Video is unavailable or private")
        except ContentExtractionError:
            raise
        except Exception as e:
            logger.exception(f"YouTube extraction failed: {e}")
            raise ContentExtractionError(f"Failed to extract YouTube transcript: {str(e)}")
    
    def _get_youtube_title(self, video_id: str) -> str:
        """Get YouTube video title via oembed API."""
        try:
            response = self.http_client.get(
                f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
            )
            if response.status_code == 200:
                return response.json().get('title', f'YouTube Video {video_id}')
        except Exception:
            pass
        return f'YouTube Video {video_id}'
    
    def _extract_article(self, url: str) -> Dict[str, Any]:
        """
        Extract article content using Trafilatura with fallbacks.
        
        Fallback chain: Trafilatura → Newspaper4k → Jina Reader API
        """
        # Try Trafilatura first (best accuracy: 93.7% F1)
        result = self._extract_with_trafilatura(url)
        if result and result.get('content'):
            return result
        
        # Try Newspaper4k for news sites
        result = self._extract_with_newspaper(url)
        if result and result.get('content'):
            return result
        
        # Fallback to Jina Reader API (handles JS-heavy sites)
        result = self._extract_with_jina(url)
        if result and result.get('content'):
            return result
        
        raise ContentExtractionError(f"Failed to extract content from {url}")
    
    def _extract_with_trafilatura(self, url: str) -> Optional[Dict[str, Any]]:
        """Extract using Trafilatura (93.7% F1 score)."""
        try:
            # Download the page
            downloaded = trafilatura.fetch_url(url)
            if not downloaded:
                return None
            
            # Extract content
            content = trafilatura.extract(
                downloaded,
                include_comments=False,
                include_tables=True,
                include_images=False,
                include_links=False,
                output_format='txt'
            )
            
            if not content:
                return None
            
            # Extract metadata
            metadata = trafilatura.extract(
                downloaded,
                output_format='json',
                include_comments=False
            )
            
            meta_dict = {}
            title = ''
            language = 'unknown'
            
            if metadata:
                import json
                try:
                    meta_dict = json.loads(metadata)
                    title = meta_dict.get('title', '')
                    language = meta_dict.get('language', 'unknown')
                except json.JSONDecodeError:
                    pass
            
            return {
                'content': content,
                'title': title,
                'source_type': 'article',
                'language': language,
                'word_count': len(content.split()),
                'metadata': {
                    'url': url,
                    'author': meta_dict.get('author', ''),
                    'date': meta_dict.get('date', ''),
                    'sitename': meta_dict.get('sitename', ''),
                    'extractor': 'trafilatura'
                }
            }
            
        except Exception as e:
            logger.warning(f"Trafilatura extraction failed for {url}: {e}")
            return None
    
    def _extract_with_newspaper(self, url: str) -> Optional[Dict[str, Any]]:
        """Extract using Newspaper4k (90.2% F1, good for news)."""
        try:
            from newspaper import Article
            
            article = Article(url)
            article.download()
            article.parse()
            
            if not article.text:
                return None
            
            # Try NLP processing
            try:
                article.nlp()
                keywords = article.keywords
                summary = article.summary
            except Exception:
                keywords = []
                summary = ''
            
            return {
                'content': article.text,
                'title': article.title or '',
                'source_type': 'article',
                'language': article.meta_lang or 'unknown',
                'word_count': len(article.text.split()),
                'metadata': {
                    'url': url,
                    'author': ', '.join(article.authors) if article.authors else '',
                    'date': str(article.publish_date) if article.publish_date else '',
                    'keywords': keywords,
                    'summary': summary,
                    'extractor': 'newspaper4k'
                }
            }
            
        except Exception as e:
            logger.warning(f"Newspaper4k extraction failed for {url}: {e}")
            return None
    
    def _extract_with_jina(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Extract using Jina Reader API (handles JS-heavy sites).
        FREE: 20 req/min without key, 200 req/min with free API key.
        """
        try:
            headers = {}
            if self.jina_api_key:
                headers['Authorization'] = f'Bearer {self.jina_api_key}'
            
            response = self.http_client.get(
                f"{self.JINA_READER_URL}{url}",
                headers=headers
            )
            
            if response.status_code != 200:
                return None
            
            content = response.text
            
            # Try to extract title from markdown
            title = ''
            lines = content.split('\n')
            for line in lines:
                if line.startswith('# '):
                    title = line[2:].strip()
                    break
            
            return {
                'content': content,
                'title': title,
                'source_type': 'webpage',
                'language': 'unknown',
                'word_count': len(content.split()),
                'metadata': {
                    'url': url,
                    'format': 'markdown',
                    'extractor': 'jina_reader'
                }
            }
            
        except Exception as e:
            logger.warning(f"Jina Reader extraction failed for {url}: {e}")
            return None
    
    def close(self):
        """Close HTTP client."""
        self.http_client.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, *args):
        self.close()


# Singleton instance
extractor = ContentExtractor()


def extract_content_from_url(url: str) -> Dict[str, Any]:
    """
    Convenience function to extract content from a URL.
    
    Args:
        url: URL to article or YouTube video
        
    Returns:
        dict with content, title, source_type, language, word_count, metadata
    """
    return extractor.extract(url)


def extract_youtube_transcript(video_id_or_url: str, preferred_language: str = None) -> Dict[str, Any]:
    """
    Extract YouTube transcript specifically.
    
    Args:
        video_id_or_url: YouTube video ID or full URL
        preferred_language: Preferred language code (e.g., 'de', 'en', 'ar')
        
    Returns:
        dict with transcript content and metadata
    """
    # Check if it's a URL or just an ID
    if 'youtube' in video_id_or_url or 'youtu.be' in video_id_or_url:
        video_id = extractor._extract_youtube_id(video_id_or_url)
        if not video_id:
            raise ContentExtractionError("Invalid YouTube URL")
    else:
        video_id = video_id_or_url
    
    return extractor._extract_youtube(video_id, f"https://youtube.com/watch?v={video_id}", preferred_language)
