"""
Advanced Text Generator Agent
AI-powered educational content generation for language learners
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from .character_consistency_enforcer import CharacterConsistencyEnforcer

logger = logging.getLogger(__name__)

class AdvancedTextAgent:
    """AI agent for generating educational content (stories, articles, dialogues)"""
    
    def __init__(self, api_key: str):
        """Initialize agent with Gemini API key"""
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        self.generation_config = {
            'temperature': 0.8,  # Higher for more creative content
            'top_p': 0.95,
            'top_k': 40,
            'max_output_tokens': 8192, # Increased for longer responses with image prompts
        }
        self.consistency_enforcer = CharacterConsistencyEnforcer()
    
    def generate_story(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate an engaging story with sequential events and optional image prompts
        
        Args:
            params: Dictionary containing:
                - topic: Story subject
                - level: CEFR level (A1-C2)
                - target_language: Language code
                - vocabulary_selection: 'random' or 'manual'
                - selected_words: List of words (if manual)
                - grammar_selection: 'random' or 'manual'
                - selected_grammar: List of grammar points (if manual)
                - word_count: Target word count
                - generate_images: Boolean (NEW)
        
        Returns:
            Structured story data with events
        """
        prompt = self._build_story_prompt(params)
        response = self._call_gemini(prompt)
        structured_data = self._parse_json_response(response)
        
        # Highlight vocabulary in content
        structured_data = self._highlight_vocabulary_in_story(
            structured_data,
            params.get('selected_words', [])
        )
        
        # Enforce character consistency if images are requested
        if params.get('generate_images', False) and 'events' in structured_data:
            logger.info("Enforcing character consistency for generated story")
            structured_data['events'] = self.consistency_enforcer.enforce_consistency(
                structured_data['events']
            )
            
            # Add metadata about image generation
            structured_data['image_generation_metadata'] = {
                'total_images': len(structured_data['events']),
                'art_style': 'digital_illustration_professional', # Default
                'generated_for_level': params.get('level', 'B1')
            }
        
        return structured_data
    
    def generate_article(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a professional article with organized paragraphs
        
        Args:
            params: Same structure as generate_story
        
        Returns:
            Structured article data with paragraphs
        """
        prompt = self._build_article_prompt(params)
        response = self._call_gemini(prompt)
        structured_data = self._parse_json_response(response)
        
        # Highlight vocabulary in content
        structured_data = self._highlight_vocabulary_in_article(
            structured_data,
            params.get('selected_words', [])
        )
        
        return structured_data
    
    def generate_dialogue(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a natural conversation between two people
        
        Args:
            params: Same structure as generate_story
        
        Returns:
            Structured dialogue data with messages
        """
        prompt = self._build_dialogue_prompt(params)
        response = self._call_gemini(prompt)
        structured_data = self._parse_json_response(response)
        
        # Highlight vocabulary in content
        structured_data = self._highlight_vocabulary_in_dialogue(
            structured_data,
            params.get('selected_words', [])
        )
        
        return structured_data
    
    # ========== Prompt Builders ==========
    
    def _build_story_prompt(self, params: Dict[str, Any]) -> str:
        """Build prompt for story generation"""
        topic = params.get('topic', '')
        level = params.get('level', 'B1')
        target_lang = params.get('target_language', 'de')
        word_count = params.get('word_count', 300)
        instructor_notes = params.get('instructor_notes', '')
        generate_images = params.get('generate_images', False)
        
        # Vocabulary handling
        vocab_instruction = ""
        if params.get('selected_words'):
            vocab_list = ', '.join(params['selected_words'])
            vocab_instruction = f"Required Vocabulary (MUST use naturally): {vocab_list}"
        else:
            vocab_instruction = f"Select appropriate vocabulary for {level} level learners"
        
        # Grammar handling
        grammar_instruction = ""
        if params.get('grammar_selection') == 'manual' and params.get('selected_grammar'):
            grammar_list = ', '.join(params['selected_grammar'])
            grammar_instruction = f"Grammar Focus (demonstrate clearly): {grammar_list}"
        elif params.get('grammar_focus'): # Specific focus from text input
            grammar_instruction = f"Grammar Focus (demonstrate clearly): {params['grammar_focus']}"
        else:
            grammar_instruction = f"Use grammar appropriate for {level} level"
        
        lang_name = self._get_language_name(target_lang)
        
        notes_section = ""
        if instructor_notes:
            notes_section = f"\nADDITIONAL INSTRUCTIONS:\n{instructor_notes}\n(Note: Follow these instructions for style/content, but strictly adhere to the {level} level and {params['content_type']} format.)"

        # Image Generation Instructions
        image_section = ""
        if generate_images:
            image_section = """
IMAGE PROMPT REQUIREMENTS (CRITICAL):
1. For EACH event, generate a "image_prompt" object.
2. First event: Define main character(s) as PROFESSIONAL ILLUSTRATION.
   Example: "An illustrated adult character with neat short hair, wearing business attire, digital illustration style, concept art quality, sophisticated artwork"
3. All other events: Use EXACT same character description.
4. Positive prompt: 50-90 words (detailed, professional illustration style).
5. Negative prompt: 40-60 words (MUST exclude: photorealistic, realistic photo, children's style, childish, cute cartoon).
6. Art Style: Choose ONE mature style and stick with it (e.g., digital_illustration_professional, graphic_novel_style).
7. Aspect ratio: "16:9".

PROFESSIONAL ILLUSTRATION KEYWORDS TO USE:
✅ Always include in positive prompt:
- "digital illustration", "concept art style", "professional artwork"
- "editorial illustration", "graphic novel art", "contemporary design"
- "detailed linework", "sophisticated color palette", "clean composition"

❌ NEVER include in positive prompt:
- "photorealistic", "realistic photo", "photograph", "real person"
- "children's book", "cute", "childish", "simple cartoon"
"""

        prompt = f"""You are a creative storytelling expert for language learners.
{image_section}

Create an engaging story in {lang_name} about: "{topic}"

REQUIREMENTS:
- Student Level: {level} (CEFR standard)
- Number of Events: 6-8 sequential events
- {vocab_instruction}
- {grammar_instruction}
- Total Words: approximately {word_count}
- Style: Engaging, coherent, age-appropriate
{notes_section}

STRUCTURE REQUIREMENTS:
Each event should:
1. Be 2-4 sentences long
2. Include relevant emojis (1-2 per event)
3. Use vocabulary naturally (not forced)
4. Demonstrate grammar points organically
5. Build logically on previous events
6. Create a complete, satisfying narrative arc

CRITICAL: Output ONLY valid JSON in this exact format:
{{
  "title": "Engaging story title",
  "events": [
    {{
      "event_number": 1,
      "title": "Event title with emoji 🎒",
      "content": "Event text here. Use **vocabulary** for important words.",
      "translation": "English translation of this event",
      "vocabulary_in_event": ["word1", "word2"],
      "grammar_in_event": ["grammar_point1"]{', "image_prompt": {"positive_prompt": "...", "negative_prompt": "...", "style": "...", "aspect_ratio": "16:9"}' if generate_images else ''}
    }}
  ],
  "character_description": "Description of main character(s)"
}}

IMPORTANT:
- Make the story interesting and memorable
- Ensure {level} level appropriateness (vocabulary, grammar, complexity)
- Natural flow between events
- Clear beginning, middle, and end
- Output ONLY the JSON, no other text"""

        return prompt
    
    def _build_article_prompt(self, params: Dict[str, Any]) -> str:
        """Build prompt for article generation"""
        topic = params.get('topic', '')
        level = params.get('level', 'B1')
        target_lang = params.get('target_language', 'de')
        word_count = params.get('word_count', 400)
        instructor_notes = params.get('instructor_notes', '')
        
        # Vocabulary handling
        vocab_instruction = ""
        if params.get('selected_words'):
            vocab_list = ', '.join(params['selected_words'])
            vocab_instruction = f"Required Vocabulary (integrate naturally): {vocab_list}"
        else:
            vocab_instruction = f"Use vocabulary appropriate for {level} level"
        
        # Grammar handling
        grammar_instruction = ""
        if params.get('grammar_selection') == 'manual' and params.get('selected_grammar'):
            grammar_list = ', '.join(params['selected_grammar'])
            grammar_instruction = f"Grammar Focus (demonstrate): {grammar_list}"
        elif params.get('grammar_focus'):
            grammar_instruction = f"Grammar Focus (demonstrate): {params['grammar_focus']}"
        else:
            grammar_instruction = f"Use grammar structures for {level} level"
        
        lang_name = self._get_language_name(target_lang)
        
        notes_section = ""
        if instructor_notes:
            notes_section = f"\nADDITIONAL INSTRUCTIONS:\n{instructor_notes}\n(Note: Follow these instructions for style/content, but strictly adhere to the {level} level and {params['content_type']} format.)"
        
        prompt = f"""You are a professional content writer for language learners.

Create an informative article in {lang_name} about: "{topic}"

REQUIREMENTS:
- Student Level: {level} (CEFR standard)
- Number of Paragraphs: 5-7
- {vocab_instruction}
- {grammar_instruction}
- Total Words: approximately {word_count}
- Style: Professional, informative, well-structured
{notes_section}

STRUCTURE:
1. Introduction (context and overview)
2. Main body (3-5 paragraphs with clear subheadings)
3. Conclusion (summary and key takeaways)

FORMATTING:
- Use markdown: # for title, ## for headings
- **bold** for important vocabulary words
- Use lists, bullet points where appropriate
- Professional academic/journalistic style

CRITICAL: Output ONLY valid JSON in this exact format:
{{
  "title": "Professional article title",
  "paragraphs": [
    {{
      "paragraph_number": 1,
      "heading": "Introduction",
      "content": "Paragraph text with **vocabulary** highlighted. Use markdown formatting.",
      "translation": "English translation of this paragraph",
      "vocabulary_in_paragraph": ["word1", "word2"],
      "grammar_in_paragraph": ["grammar1"]
    }}
  ]
}}

IMPORTANT:
- Content should be factual and informative
- Appropriate complexity for {level} level
- Natural integration of required elements
- Professional tone throughout
- Output ONLY the JSON, no other text"""

        return prompt
    
    def _build_dialogue_prompt(self, params: Dict[str, Any]) -> str:
        """Build prompt for dialogue generation"""
        topic = params.get('topic', '')
        level = params.get('level', 'A2')
        target_lang = params.get('target_language', 'de')
        word_count = params.get('word_count', 250)
        instructor_notes = params.get('instructor_notes', '')
        
        # Vocabulary handling
        vocab_instruction = ""
        if params.get('selected_words'):
            vocab_list = ', '.join(params['selected_words'])
            vocab_instruction = f"Required Vocabulary (use naturally): {vocab_list}"
        else:
            vocab_instruction = f"Use common vocabulary for {level} level"
        
        # Grammar handling
        grammar_instruction = ""
        if params.get('grammar_selection') == 'manual' and params.get('selected_grammar'):
            grammar_list = ', '.join(params['selected_grammar'])
            grammar_instruction = f"Grammar Focus (demonstrate): {grammar_list}"
        elif params.get('grammar_focus'):
            grammar_instruction = f"Grammar Focus (demonstrate): {params['grammar_focus']}"
        else:
            grammar_instruction = f"Use typical {level} level grammar"
        
        lang_name = self._get_language_name(target_lang)
        
        notes_section = ""
        if instructor_notes:
            notes_section = f"\nADDITIONAL INSTRUCTIONS:\n{instructor_notes}\n(Note: Follow these instructions for style/content, but strictly adhere to the {level} level and {params['content_type']} format.)"
        
        prompt = f"""You are a dialogue writing expert for language learners.

Create a natural conversation in {lang_name} about: "{topic}"

REQUIREMENTS:
- Student Level: {level} (CEFR standard)
- Number of Messages: 15-20 exchanges
- {vocab_instruction}
- {grammar_instruction}
- Total Words: approximately {word_count}
- Style: Natural, spontaneous, realistic
{notes_section}

CHARACTERS:
Create 2 distinct characters with:
- Different personalities
- Clear roles/relationship
- Natural speaking styles

DIALOGUE FLOW:
1. Natural greeting/opening
2. Main conversation (incorporate vocabulary/grammar)
3. Natural closing/conclusion

CRITICAL: Output ONLY valid JSON in this exact format:
{{
  "title": "Dialogue title",
  "characters": [
    {{"name": "Anna", "role": "Customer"}},
    {{"name": "Marco", "role": "Waiter"}}
  ],
  "messages": [
    {{
      "message_number": 1,
      "speaker": "Anna",
      "text": "Message with **vocabulary** highlighted",
      "translation": "English translation of the message",
      "vocabulary_in_message": ["word1"],
      "grammar_in_message": ["grammar1"]
    }}
  ]
}}

IMPORTANT:
- Make dialogue realistic and spontaneous
- Natural responses (not scripted feeling)
- Appropriate for {level} level learners
- Clear character personalities
- Realistic conversation flow
- Output ONLY the JSON, no other text"""

        return prompt
    
    # ========== Helper Methods ==========
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Gemini API with prompt"""
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=self.generation_config
            )
            return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """Parse JSON from Gemini response, handling markdown code blocks"""
        # Remove markdown code blocks if present
        response = response.strip()
        if response.startswith('```'):
            # Extract JSON from code block
            lines = response.split('\n')
            # Remove first line (```json or ```)
            lines = lines[1:]
            # Remove last line (```)
            if lines[-1].strip() == '```':
                lines = lines[:-1]
            response = '\n'.join(lines)
        
        try:
            return json.loads(response)
        except json.JSONDecodeError as e:
            # Try to extract JSON if there's extra text
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                try:
                    return json.loads(json_match.group())
                except:
                    pass
            raise Exception(f"Failed to parse JSON response: {str(e)}")
    
    def _highlight_vocabulary_in_story(
        self,
        story_data: Dict[str, Any],
        vocab_words: List[str]
    ) -> Dict[str, Any]:
        """Highlight vocabulary words in story events"""
        if not vocab_words:
            return story_data
        
        for event in story_data.get('events', []):
            content = event.get('content', '')
            for word in vocab_words:
                # Case-insensitive replacement, preserve original case
                pattern = re.compile(re.escape(word), re.IGNORECASE)
                content = pattern.sub(f'**{word}**', content)
            event['content'] = content
        
        return story_data
    
    def _highlight_vocabulary_in_article(
        self,
        article_data: Dict[str, Any],
        vocab_words: List[str]
    ) -> Dict[str, Any]:
        """Highlight vocabulary words in article paragraphs"""
        if not vocab_words:
            return article_data
        
        for paragraph in article_data.get('paragraphs', []):
            content = paragraph.get('content', '')
            for word in vocab_words:
                pattern = re.compile(re.escape(word), re.IGNORECASE)
                content = pattern.sub(f'**{word}**', content)
            paragraph['content'] = content
        
        return article_data
    
    def _highlight_vocabulary_in_dialogue(
        self,
        dialogue_data: Dict[str, Any],
        vocab_words: List[str]
    ) -> Dict[str, Any]:
        """Highlight vocabulary words in dialogue messages"""
        if not vocab_words:
            return dialogue_data
        
        for message in dialogue_data.get('messages', []):
            text = message.get('text', '')
            for word in vocab_words:
                pattern = re.compile(re.escape(word), re.IGNORECASE)
                text = pattern.sub(f'**{word}**', text)
            message['text'] = text
        
        return dialogue_data
    
    def _get_language_name(self, lang_code: str) -> str:
        """Convert language code to full name"""
        lang_map = {
            'en': 'English',
            'de': 'German',
            'ar': 'Arabic',
            'ru': 'Russian',
        }
        return lang_map.get(lang_code, 'German')
