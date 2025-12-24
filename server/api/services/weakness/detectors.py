from typing import List
from collections import Counter
from datetime import timedelta
from django.utils import timezone
from django.db.models import Avg, Count, F
from api.models import LearningEvent, SkillMastery, Vocabulary
from .base import BaseWeaknessDetector, Weakness

class LowMasteryDetector(BaseWeaknessDetector):
    """Detects skills with significantly low mastery scores."""
    
    def detect(self, user) -> List[Weakness]:
        threshold = 0.4
        min_attempts = 5
        
        candidates = SkillMastery.objects.filter(
            user=user,
            mastery_probability__lt=threshold,
            total_attempts__gte=min_attempts
        ).select_related('skill')
        
        weaknesses = []
        for cand in candidates:
            weaknesses.append(Weakness(
                type='low_mastery',
                confidence=1.0 - cand.mastery_probability,
                title=f"Struggling with {cand.skill.name}",
                description=f"Mastery level is low ({cand.mastery_probability:.0%}) despite {cand.total_attempts} attempts.",
                severity='high',
                metadata={
                    'skill_code': cand.skill.code,
                    'mastery': cand.mastery_probability,
                    'attempts': cand.total_attempts
                }
            ))
        return weaknesses

class ErrorPatternDetector(BaseWeaknessDetector):
    """Detects repeated errors on specific words."""
    
    def detect(self, user) -> List[Weakness]:
        # Look back 30 days
        since = timezone.now() - timedelta(days=30)
        
        # Get all incorrect word practices
        events = LearningEvent.objects.filter(
            user=user,
            event_type='word_incorrect',
            created_at__gte=since
        ).values_list('context', flat=True)
        
        # Extract word IDs from context
        # Context is JSON, so values_list might just return the dict.
        # We need to process efficiently.
        word_ids = []
        for ctx in events:
            if ctx and 'word_id' in ctx:
                word_ids.append(ctx['word_id'])
                
        if not word_ids:
            return []
            
        # Find words with 3+ errors
        counts = Counter(word_ids)
        problem_word_ids = [wid for wid, count in counts.items() if count >= 3]
        
        if not problem_word_ids:
            return []
            
        # Fetch actual words
        words = Vocabulary.objects.filter(id__in=problem_word_ids)
        vocab_map = {w.id: w for w in words}
        
        weaknesses = []
        for wid in problem_word_ids:
            if wid not in vocab_map:
                continue
                
            word = vocab_map[wid]
            count = counts[wid]
            
            weaknesses.append(Weakness(
                type='error_pattern',
                confidence=min(count / 5.0, 1.0), # cap confidence at 1.0 for 5+ errors
                title=f"Repeated mistakes: '{word.word}'",
                description=f"You've missed '{word.word}' ({word.translation}) {count} times recently.",
                severity='medium',
                metadata={
                    'word_id': word.id,
                    'word': word.word,
                    'count': count
                }
            ))
            
        return weaknesses

class DecayDetector(BaseWeaknessDetector):
    """Detects skills that were mastered but haven't been practiced recently."""
    
    def detect(self, user) -> List[Weakness]:
        days_inactive = 14
        cutoff = timezone.now() - timedelta(days=days_inactive)
        
        candidates = SkillMastery.objects.filter(
            user=user,
            last_practiced__lt=cutoff,
            mastery_probability__gt=0.7 # Was previously high
        ).select_related('skill')
        
        weaknesses = []
        for cand in candidates:
            days_since = (timezone.now() - cand.last_practiced).days
            
            weaknesses.append(Weakness(
                type='decay',
                confidence=min(days_since / 60.0, 1.0), # More confidence as time goes on
                title=f"Rusty skill: {cand.skill.name}",
                description=f"You haven't practiced this in {days_since} days. It matches your 'Use it or Lose it' criteria.",
                severity='low',
                metadata={
                    'skill_code': cand.skill.code,
                    'days_since': days_since,
                    'last_mastery': cand.mastery_probability
                }
            ))
            
        return weaknesses
