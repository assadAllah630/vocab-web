import math
from datetime import datetime, timedelta

class HLRScheduler:
    """
    Simplified Half-Life Regression (HLR) Scheduler.
    
    Formula: p = 2^(-Δ/h)
    where:
      p = recall probability
      Δ = days since last practice
      h = half-life (stability)
      
    Half-life model: h = 2^(Θ·x)
    where x is the feature vector (correct, wrong, sqrt(total), bias)
    """
    
    # Fixed weights as requested
    WEIGHTS = {
        'correct': 1.0,
        'wrong': -1.0,
        'sqrt_total': 0.5,
        'bias': -1.0
    }
    
    # Bounds
    MIN_HALF_LIFE = 0.01  # days
    MAX_HALF_LIFE = 180.0 # days
    MIN_RECALL_PROB = 0.0001
    MAX_RECALL_PROB = 0.9999

    @classmethod
    def estimate_half_life(cls, correct_count, wrong_count, total_count):
        """
        Estimate the half-life (stability) of a memory in days.
        h = 2^(Θ·x)
        """
        # Feature vector x weights
        theta_x = (
            cls.WEIGHTS['correct'] * correct_count +
            cls.WEIGHTS['wrong'] * wrong_count +
            cls.WEIGHTS['sqrt_total'] * math.sqrt(total_count) +
            cls.WEIGHTS['bias']
        )
        
        half_life = 2 ** theta_x
        
        # Clamp to bounds
        return max(cls.MIN_HALF_LIFE, min(cls.MAX_HALF_LIFE, half_life))

    @classmethod
    def predict_recall_probability(cls, correct_count, wrong_count, total_count, days_since_last_practice):
        """
        Predict the probability of recalling the item.
        p = 2^(-Δ/h)
        """
        if days_since_last_practice < 0:
            days_since_last_practice = 0
            
        h = cls.estimate_half_life(correct_count, wrong_count, total_count)
        
        # Avoid division by zero (though h is clamped > 0)
        if h == 0: 
            return 0.0
            
        p = 2 ** (-days_since_last_practice / h)
        
        # Clamp bounds
        return max(cls.MIN_RECALL_PROB, min(cls.MAX_RECALL_PROB, p))

    @classmethod
    def get_priority_score(cls, correct_count, wrong_count, total_count, days_since_last_practice):
        """
        Calculate priority score for practice.
        Lower recall probability = Higher priority (more urgent).
        Returns a score where higher means "practice this first".
        """
        p = cls.predict_recall_probability(correct_count, wrong_count, total_count, days_since_last_practice)
        
        # Priority is inverse of recall probability. 
        # We can use 1 - p, or just return p and sort ascending.
        # Let's return 1 - p so higher is more urgent.
        return 1.0 - p
