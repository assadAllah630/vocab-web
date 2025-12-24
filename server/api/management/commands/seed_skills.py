from django.core.management.base import BaseCommand
from api.models import Skill

class Command(BaseCommand):
    help = 'Seed default skills'

    def handle(self, *args, **kwargs):
        skills = [
            # Vocabulary
            ('vocab_a1', 'A1 Vocabulary', 'vocabulary', 'A1', 'Basic vocabulary for everyday use.'),
            ('vocab_a2', 'A2 Vocabulary', 'vocabulary', 'A2', 'Elementary vocabulary.'),
            ('vocab_b1', 'B1 Vocabulary', 'vocabulary', 'B1', 'Intermediate vocabulary.'),
            ('vocab_b2', 'B2 Vocabulary', 'vocabulary', 'B2', 'Upper Intermediate vocabulary.'),
            ('vocab_c1', 'C1 Vocabulary', 'vocabulary', 'C1', 'Advanced vocabulary.'),
            
            # Grammar
            ('grammar_basics', 'Basic Grammar', 'grammar', 'A1', 'Sentence structure, basic articles.'),
            ('grammar_present', 'Present Tense', 'grammar', 'A1', 'Conjugation in present tense.'),
            ('grammar_past', 'Past Tense', 'grammar', 'A2', 'Präteritum and Perfekt.'),
            ('grammar_cases', 'Cases (N/A/D/G)', 'grammar', 'B1', 'Nominative, Accusative, Dative, Genitive.'),
            
            # Listening
            ('listening_basic', 'Basic Listening', 'listening', 'A1', 'Understanding slow, clear speech.'),
            ('listening_inter', 'Intermediate Listening', 'listening', 'B1', 'Understanding main points of clear speech.'),
            
            # Reading
            ('reading_basic', 'Basic Reading', 'reading', 'A1', 'Understanding simple texts.'),
            
            # Speaking
            ('speaking_pronunciation', 'Pronunciation', 'speaking', 'A1', 'Start with basic pronunciation.'),
        ]
        
        count = 0
        for code, name, cat, level, desc in skills:
            skill, created = Skill.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'category': cat,
                    'level': level,
                    'description': desc
                }
            )
            if created:
                count += 1
                
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {count} new skills.'))
