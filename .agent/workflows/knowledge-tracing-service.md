---
description: Implement Bayesian Knowledge Tracing algorithm for predicting skill mastery
---

# Knowledge Tracing Service

## Prerequisites
- `/skill-mastery-models` ✅
- `/learning-events-pipeline` ✅

## Overview
Implements **Bayesian Knowledge Tracing (BKT)** - the gold standard for adaptive learning systems. Predicts probability a student has mastered a skill based on their response history.

## BKT Parameters

| Param | Symbol | Default | Description |
|-------|--------|---------|-------------|
| P(L₀) | `p_init` | 0.3 | Initial mastery probability |
| P(T) | `p_transit` | 0.09 | Probability of learning on each attempt |
| P(G) | `p_guess` | 0.2 | Probability of correct guess (no mastery) |
| P(S) | `p_slip` | 0.1 | Probability of incorrect despite mastery |

## Create `services/knowledge_tracing.py`

```python
from dataclasses import dataclass
from typing import List, Tuple
from api.models import SkillMastery, LearningEvent

@dataclass
class BKTParams:
    p_init: float = 0.3    # P(L₀)
    p_transit: float = 0.09 # P(T)
    p_guess: float = 0.2   # P(G)
    p_slip: float = 0.1    # P(S)

class BayesianKnowledgeTracer:
    def __init__(self, params: BKTParams = None):
        self.params = params or BKTParams()
    
    def update(self, p_mastery: float, correct: bool) -> float:
        """Single Bayesian update after one observation."""
        p = self.params
        
        if correct:
            # P(L|correct) = P(correct|L)*P(L) / P(correct)
            p_correct_given_L = 1 - p.p_slip
            p_correct_given_notL = p.p_guess
            p_correct = p_correct_given_L * p_mastery + p_correct_given_notL * (1 - p_mastery)
            p_L_given_correct = (p_correct_given_L * p_mastery) / p_correct
        else:
            # P(L|incorrect)
            p_incorrect_given_L = p.p_slip
            p_incorrect_given_notL = 1 - p.p_guess
            p_incorrect = p_incorrect_given_L * p_mastery + p_incorrect_given_notL * (1 - p_mastery)
            p_L_given_correct = (p_incorrect_given_L * p_mastery) / p_incorrect
        
        # Apply learning transition
        return p_L_given_correct + (1 - p_L_given_correct) * p.p_transit
    
    def predict_next(self, p_mastery: float) -> float:
        """Predict probability of correct on next attempt."""
        p = self.params
        return p_mastery * (1 - p.p_slip) + (1 - p_mastery) * p.p_guess

def update_mastery_bkt(user, skill_code: str, responses: List[bool]):
    """Update skill mastery using BKT on response sequence."""
    tracer = BayesianKnowledgeTracer()
    mastery = SkillMastery.objects.get_or_create(user=user, skill__code=skill_code)[0]
    
    p = mastery.mastery_probability
    for correct in responses:
        p = tracer.update(p, correct)
    
    mastery.mastery_probability = min(0.99, max(0.01, p))  # Clamp
    mastery.total_attempts += len(responses)
    mastery.correct_attempts += sum(responses)
    mastery.save()
    return mastery
```

## Mastery Threshold
- `P(L) > 0.95` → **Mastered** (stop practice)
- `P(L) < 0.4` → **Needs Focus** (recommend more practice)

## Integration Points
1. Call `update_mastery_bkt()` after flashcard sessions
2. Call after exam answers with skill tags
3. Background job to recalculate from event history

## Next → `/weakness-detection-service`
