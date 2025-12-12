"""
Language Service - Centralized Language Configuration
Provides language metadata, RTL detection, TTS mapping, and utilities.
"""

from typing import Dict, Optional

class LanguageService:
    """
    Centralized language configuration and utilities.
    Single source of truth for all language-related operations.
    """
    
    LANGUAGES: Dict[str, Dict] = {
        'en': {
            'name': 'English',
            'native_name': 'English',
            'rtl': False,
            'tts_code': 'en-US',
            'google_tts_voice': 'en-US-Wavenet-F',
            'font_family': 'Inter, system-ui, sans-serif',
        },
        'de': {
            'name': 'German',
            'native_name': 'Deutsch',
            'rtl': False,
            'tts_code': 'de-DE',
            'google_tts_voice': 'de-DE-Wavenet-F',
            'font_family': 'Inter, system-ui, sans-serif',
        },
        'ar': {
            'name': 'Arabic',
            'native_name': 'العربية',
            'rtl': True,
            'tts_code': 'ar-XA',
            'google_tts_voice': 'ar-XA-Wavenet-A',
            'font_family': "'Cairo', 'Noto Sans Arabic', sans-serif",
        },
        'ru': {
            'name': 'Russian',
            'native_name': 'Русский',
            'rtl': False,
            'tts_code': 'ru-RU',
            'google_tts_voice': 'ru-RU-Wavenet-A',
            'font_family': 'Inter, system-ui, sans-serif',
        },
    }
    
    RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']
    
    @classmethod
    def is_rtl(cls, lang_code: str) -> bool:
        """Check if a language is right-to-left."""
        lang = cls.LANGUAGES.get(lang_code, {})
        return lang.get('rtl', False) or lang_code in cls.RTL_LANGUAGES
    
    @classmethod
    def get_name(cls, lang_code: str, use_native: bool = False) -> str:
        """
        Get the full language name.
        
        Args:
            lang_code: Two-letter language code (e.g., 'ar', 'de')
            use_native: If True, return native name (e.g., 'العربية' instead of 'Arabic')
        
        Returns:
            Full language name
        """
        lang = cls.LANGUAGES.get(lang_code, {})
        if use_native:
            return lang.get('native_name', lang_code.upper())
        return lang.get('name', lang_code.upper())
    
    @classmethod
    def get_tts_code(cls, lang_code: str) -> str:
        """Get TTS language code for a language."""
        lang = cls.LANGUAGES.get(lang_code, {})
        return lang.get('tts_code', f'{lang_code}-{lang_code.upper()}')
    
    @classmethod
    def get_google_voice(cls, lang_code: str) -> str:
        """Get default Google TTS voice for a language."""
        lang = cls.LANGUAGES.get(lang_code, {})
        return lang.get('google_tts_voice', f'{lang_code}-Wavenet-A')
    
    @classmethod
    def get_font_family(cls, lang_code: str) -> str:
        """Get appropriate font family for a language."""
        lang = cls.LANGUAGES.get(lang_code, {})
        return lang.get('font_family', 'Inter, system-ui, sans-serif')
    
    @classmethod
    def get_translation_prompt_language(cls, native_code: str) -> str:
        """
        Get language name for AI prompts.
        Returns the English name for consistency in AI prompts.
        """
        return cls.get_name(native_code, use_native=False)
    
    @classmethod
    def get_all_languages(cls) -> list:
        """Get list of all supported languages as tuples (code, name)."""
        return [(code, data['name']) for code, data in cls.LANGUAGES.items()]
    
    @classmethod
    def get_language_info(cls, lang_code: str) -> Optional[Dict]:
        """Get full language information dictionary."""
        return cls.LANGUAGES.get(lang_code)
    
    @classmethod
    def is_supported(cls, lang_code: str) -> bool:
        """Check if a language code is supported."""
        return lang_code in cls.LANGUAGES
