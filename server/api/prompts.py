# Context Engineering Module
# This file centralizes all AI prompts and language-specific logic.

class ContextEngineer:
    LANGUAGES = {
        'en': 'English',
        'de': 'German',
        'ar': 'Arabic',
        'ru': 'Russian'
    }

    def __init__(self, native_lang_code='en', target_lang_code='de'):
        self.native_lang = self.LANGUAGES.get(native_lang_code, 'English')
        self.target_lang = self.LANGUAGES.get(target_lang_code, 'German')

    def get_enrichment_prompt(self, word, word_type, translation):
        """
        Generates the prompt for enriching a vocabulary word with tags, synonyms, etc.
        """
        return f"""
        Analyze the word "{word}" (Type: {word_type}, Translation: {translation}).
        The word is in {self.target_lang} and the translation is in {self.native_lang}.
        
        Provide a JSON object with:
        1. "tags": list of 3-5 relevant tags (e.g. topic, difficulty, category) in {self.native_lang}.
        2. "synonyms": list of 3 synonyms in {self.target_lang}.
        3. "antonyms": list of 3 antonyms (if applicable) in {self.target_lang}.
        4. "related_concepts": list of 3 related concepts or words in {self.target_lang}.
        
        Output ONLY valid JSON.
        """

    def get_translation_prompt(self, text):
        """
        Generates the prompt for translating a word/phrase.
        """
        return f"""
        Translate the following word or phrase to {self.native_lang} (or from {self.native_lang} to {self.target_lang} if it's already {self.native_lang}).
        Provide the translation, type (noun/verb/adjective/article/pronoun/numeral/adverb/preposition/conjunction/interjection), a simple example sentence in {self.target_lang}, synonyms, antonyms, and related concepts.
        Return ONLY valid JSON in this format: 
        {{
            'translation': '...', 
            'type': '...', 
            'example': '...',
            'synonyms': ['syn1', 'syn2', 'syn3'],
            'antonyms': ['ant1', 'ant2', 'ant3'],
            'related_concepts': ['rel1', 'rel2', 'rel3']
        }}.
        Word: {text}
        """

    def get_chat_system_instruction(self):
        """
        Generates the system instruction for the AI Assistant.
        """
        return f"""
        You are a helpful language learning assistant. 
        The user speaks {self.native_lang} and is learning {self.target_lang}. 
        Respond in {self.native_lang} unless asked otherwise. 
        Help them learn {self.target_lang} by providing explanations, examples, and corrections.
        """

    def get_quiz_generation_prompt(self, topic, count=5):
        """
        Generates a prompt to create a quiz.
        """
        return f"""
        Generate {count} quiz questions about "{topic}" for a student learning {self.target_lang} (native: {self.native_lang}).
        Format as JSON list of objects: {{'question': '...', 'options': ['...'], 'correct_index': 0, 'explanation': '...'}}.
        """

    def get_exam_generation_prompt(self, topic, level, question_types, vocab_list=None, grammar_list=None, notes=None):
        """
        Generates a comprehensive prompt to create a full exam with multiple sections.
        """
        vocab_instruction = ""
        if vocab_list:
            vocab_instruction = f"MUST include the following vocabulary words: {vocab_list}."

        grammar_instruction = ""
        if grammar_list:
            grammar_instruction = f"MUST focus on the following grammar topics: {grammar_list}."

        notes_instruction = ""
        if notes:
            notes_instruction = f"Additional instructions: {notes}."

        return f"""
        Create a language exam for a student learning {self.target_lang} (Native: {self.native_lang}).
        Topic: {topic}
        Level: {level}
        
        {vocab_instruction}
        {grammar_instruction}
        {notes_instruction}
        
        Generate a JSON object with the following structure. DO NOT wrap in markdown code blocks. Just raw JSON.
        
        {{
            "title": "Exam Title",
            "description": "Brief description",
            "sections": [
                {{
                    "type": "cloze",
                    "instruction": "Fill in the blanks...",
                    "text": "Full text with [blank] placeholders...",
                    "blanks": [
                        {{ "id": 1, "answer": "correct_word", "options": ["distractor1", "distractor2", "correct_word"] }} 
                    ]
                }},
                {{
                    "type": "multiple_choice",
                    "instruction": "Choose the correct answer...",
                    "questions": [
                        {{ "question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "..." }}
                    ]
                }},
                {{
                    "type": "matching",
                    "instruction": "Match the pairs...",
                    "pairs": [
                        {{ "left": "Term A", "right": "Definition A" }}
                    ]
                }},
                {{
                    "type": "reading",
                    "instruction": "Read the text and answer questions...",
                    "text": "Long reading passage...",
                    "questions": [
                        {{ "question": "...", "options": ["..."], "correct_index": 0 }}
                    ]
                }}
            ]
        }}
        
        Include these sections if requested: {', '.join(question_types)}.
        Ensure the content is appropriate for {level} level.
        """
