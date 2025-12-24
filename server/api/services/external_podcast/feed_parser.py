"""
RSS Feed Parser Service for External Podcasts.

Parses podcast RSS feeds and extracts metadata + episode information.
Uses feedparser library for robust XML handling.

Example usage:
    service = PodcastFeedService()
    data = service.parse_feed('https://rss.dw.com/xml/rss-de-langsamdeutsch')
    print(data['name'], len(data['episodes']))
"""

import re
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from email.utils import parsedate_to_datetime

import feedparser

import requests

logger = logging.getLogger(__name__)


class PodcastFeedService:
    """
    Service to parse podcast RSS feeds.
    
    Extracts podcast metadata and episode information including
    direct audio URLs for streaming.
    """
    
    # Common browser user agent to avoid being blocked
    USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    
    def parse_feed(self, feed_url: str) -> Dict[str, Any]:
        """
        Parse an RSS feed and return podcast + episodes data.
        
        Args:
            feed_url: URL to the podcast RSS feed
            
        Returns:
            Dict containing:
                - name: Podcast title
                - description: Podcast description
                - author: Podcast author
                - artwork_url: Cover image URL
                - website_url: Podcast website
                - language: Language code (2 chars)
                - episodes: List of episode dicts
            
        Raises:
            ValueError: If feed is invalid or cannot be parsed
        """
        logger.info(f"Parsing RSS feed: {feed_url}")
        
        try:
            # Use requests with headers to avoid user-agent blocks
            response = requests.get(feed_url, headers={'User-Agent': self.USER_AGENT}, timeout=15)
            response.raise_for_status()
            feed_content = response.content
            
            feed = feedparser.parse(feed_content)
        except Exception as e:
            logger.error(f"Failed to fetch or parse feed {feed_url}: {e}")
            raise ValueError(f"Failed to fetch feed: {e}")
        
        # Check for parse errors
        if feed.bozo and not feed.entries:
            error_msg = str(feed.bozo_exception) if feed.bozo_exception else "Unknown error"
            logger.error(f"Invalid RSS feed {feed_url}: {error_msg}")
            raise ValueError(f"Invalid RSS feed: {error_msg}")
        
        # Extract podcast metadata
        podcast_data = {
            'name': self._clean_text(feed.feed.get('title', 'Unknown Podcast')),
            'description': self._clean_html(feed.feed.get('description', '')),
            'author': self._get_author(feed),
            'artwork_url': self._get_artwork(feed),
            'website_url': feed.feed.get('link', ''),
            'language': self._normalize_language(feed.feed.get('language', 'de')),
            'episodes': []
        }
        
        # Extract episodes
        for entry in feed.entries:
            audio_url = self._get_audio_url(entry)
            if not audio_url:
                continue  # Skip entries without audio
            
            # Try to get full content (often contains transcript/shownotes)
            content_encoded = ''
            if 'content' in entry:
                # content is a list of dicts like [{'base': '...', 'language': None, 'type': 'text/html', 'value': '...'}, ...]
                for c in entry.content:
                    if c.get('type') == 'text/html' or c.get('type') == 'text/plain':
                        content_encoded += c.get('value', '')
            
            # If no content field, fallback to summary/description
            raw_description = entry.get('summary', entry.get('description', ''))
            
            # Use content as primary source for description if available and longer
            final_description_raw = content_encoded if len(content_encoded) > len(raw_description) else raw_description
            
            episode = {
                'guid': self._get_guid(entry, audio_url),
                'title': self._clean_text(entry.get('title', 'Untitled Episode')),
                'link': entry.get('link', ''),
                'description': self._clean_html(final_description_raw),  # Preserves newlines now
                'transcript': self._clean_html(content_encoded), # explicit transcript field
                'audio_url': audio_url,
                'duration': self._parse_duration(entry),
                'published_at': self._parse_date(entry),
                'image_url': self._get_episode_image(entry),
                'file_size': self._get_file_size(entry),
            }
            podcast_data['episodes'].append(episode)
        
        logger.info(f"Parsed {len(podcast_data['episodes'])} episodes from {podcast_data['name']}")
        return podcast_data
    
    def _get_audio_url(self, entry) -> Optional[str]:
        """Extract audio URL from RSS entry enclosure tag."""
        # Check enclosures first (standard podcast format)
        for enc in entry.get('enclosures', []):
            mime_type = enc.get('type', '')
            if mime_type.startswith('audio/'):
                return enc.get('href')
        
        # Fallback: check links
        for link in entry.get('links', []):
            mime_type = link.get('type', '')
            if mime_type.startswith('audio/'):
                return link.get('href')
        
        return None
    
    def _get_artwork(self, feed) -> str:
        """Extract podcast artwork URL."""
        # Try iTunes image first (most common)
        itunes_image = getattr(feed.feed, 'itunes_image', None)
        if itunes_image:
            if isinstance(itunes_image, dict):
                return itunes_image.get('href', '')
            elif hasattr(itunes_image, 'href'):
                return itunes_image.href
        
        # Try image tag
        image = getattr(feed.feed, 'image', None)
        if image:
            if isinstance(image, dict):
                return image.get('href', image.get('url', ''))
            elif hasattr(image, 'href'):
                return image.href
            elif hasattr(image, 'url'):
                return image.url
        
        return ''
    
    def _get_author(self, feed) -> str:
        """Get podcast author from multiple possible sources."""
        # Try itunes:author first
        author = getattr(feed.feed, 'itunes_author', None)
        if author:
            return self._clean_text(author)
        
        # Fall back to author tag
        author = feed.feed.get('author', '')
        if author:
            return self._clean_text(author)
        
        # Try managingEditor
        return self._clean_text(feed.feed.get('managingEditor', ''))
    
    def _parse_duration(self, entry) -> int:
        """Parse duration string to seconds."""
        duration_str = str(entry.get('itunes_duration', '0'))
        
        try:
            # Handle HH:MM:SS or MM:SS format
            parts = duration_str.split(':')
            if len(parts) == 3:  # HH:MM:SS
                return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:  # MM:SS
                return int(parts[0]) * 60 + int(parts[1])
            else:
                # Try as pure integer (seconds)
                return int(float(duration_str))
        except (ValueError, TypeError):
            return 0
    
    def _parse_date(self, entry) -> datetime:
        """Parse published date from RSS entry."""
        date_str = entry.get('published', entry.get('updated', ''))
        
        if date_str:
            try:
                return parsedate_to_datetime(date_str)
            except (ValueError, TypeError) as e:
                logger.debug(f"Failed to parse date '{date_str}': {e}")
        
        return datetime.now()
    
    def _get_file_size(self, entry) -> int:
        """Get file size from enclosure."""
        for enc in entry.get('enclosures', []):
            length = enc.get('length')
            if length:
                try:
                    return int(length)
                except (ValueError, TypeError):
                    pass
        return 0
    
    def _get_guid(self, entry, fallback_url: str) -> str:
        """Get unique identifier for episode."""
        guid = entry.get('id', entry.get('guid', ''))
        if guid:
            return guid[:500]  # Limit length
        
        # Fall back to link or audio URL
        return entry.get('link', fallback_url)[:500]
    
    def _get_episode_image(self, entry) -> str:
        """Get episode-specific image if available."""
        itunes_image = entry.get('itunes_image', {})
        if isinstance(itunes_image, dict):
            return itunes_image.get('href', '')
        return ''
    
    def _clean_html(self, text: str) -> str:
        """Remove HTML tags but preserve structural whitespace."""
        if not text:
            return ''
            
        # Replace block elements with newlines before stripping
        text = re.sub(r'</p>', '\n\n', text)
        text = re.sub(r'<br\s*/?>', '\n', text)
        text = re.sub(r'</li>', '\n', text)
        
        # Remove all other HTML tags
        clean = re.sub(r'<[^>]+>', '', text)
        
        # Decode HTML entities
        clean = clean.replace('&amp;', '&')
        clean = clean.replace('&lt;', '<')
        clean = clean.replace('&gt;', '>')
        clean = clean.replace('&quot;', '"')
        clean = clean.replace('&#39;', "'")
        clean = clean.replace('&nbsp;', ' ')
        
        return clean.strip()
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ''
        return ' '.join(str(text).split()).strip()
    
    def _normalize_language(self, lang: str) -> str:
        """Normalize language code to 2 characters."""
        if not lang:
            return 'de'
        # Handle formats like 'de-DE', 'en-US'
        return lang[:2].lower()
