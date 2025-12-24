from django.core.cache import cache
from typing import List, Dict, Any
from .base import Weakness
from .detectors import LowMasteryDetector, ErrorPatternDetector, DecayDetector

class WeaknessService:
    """
    Orchestrator for weakness detection.
    Manages detectors, aggregation, and caching.
    """
    
    CACHE_TIMEOUT = 3600 # 1 hour
    
    def __init__(self):
        self.detectors = [
            LowMasteryDetector(),
            ErrorPatternDetector(),
            DecayDetector(),
            # Future: PhoneticConfusionDetector(), etc.
        ]
        
    def detect_weaknesses(self, user) -> Dict[str, Any]:
        """
        Run all detectors and return aggregated results.
        Results are cached per user.
        """
        cache_key = f"user_weaknesses_{user.id}"
        cached_result = cache.get(cache_key)
        
        if cached_result:
            return cached_result
            
        weaknesses: List[Weakness] = []
        
        for detector in self.detectors:
            try:
                results = detector.detect(user)
                weaknesses.extend(results)
            except Exception as e:
                # Log error but don't fail entire request
                print(f"Error in detector {detector.__class__.__name__}: {e}")
                
        # Sort by severity and confidence
        severity_map = {'critical': 3, 'high': 2, 'medium': 1, 'low': 0}
        weaknesses.sort(
            key=lambda w: (severity_map.get(w.severity, 0), w.confidence), 
            reverse=True
        )
        
        result_payload = {
            'count': len(weaknesses),
            'items': [w.to_dict() for w in weaknesses],
            'summary': self._generate_summary(weaknesses)
        }
        
        cache.set(cache_key, result_payload, self.CACHE_TIMEOUT)
        return result_payload
        
    def invalidate_cache(self, user):
        """Invalidate cache for a user (call this after significant practice sessions)."""
        cache_key = f"user_weaknesses_{user.id}"
        cache.delete(cache_key)

    def _generate_summary(self, weaknesses: List[Weakness]) -> str:
        if not weaknesses:
            return "No significant weaknesses detected. Keep up the good work!"
            
        top_issue = weaknesses[0]
        count = len(weaknesses)
        
        return f"Found {count} areas for improvement. Top priority: {top_issue.title}"
