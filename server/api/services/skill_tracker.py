from django.utils import timezone
from api.models import Skill, SkillMastery

def update_skill_mastery(user, skill_code, correct):
    """
    Update skill mastery using Bayesian Knowledge Tracing (BKT).
    """
    try:
        skill = Skill.objects.get(code=skill_code)
    except Skill.DoesNotExist:
        # If skill doesn't exist, we can't track it.
        # Ideally, log this warning.
        return None

    mastery, created = SkillMastery.objects.get_or_create(
        user=user, 
        skill=skill,
        defaults={'mastery_probability': 0.15} # Initial prior: low for new skill
    )
    
    # BKT Parameters (fetch from skill or use defaults)
    p_slip = getattr(skill, 'default_p_slip', 0.1)
    p_guess = getattr(skill, 'default_p_guess', 0.2)
    p_transit = getattr(skill, 'default_p_transit', 0.05) # Rate of learning per practice
    
    p_learned = mastery.mastery_probability
    
    # 1. Update belief based on evidence (Correct or Incorrect)
    if correct:
        # P(L | Correct) = (P(L) * (1 - S)) / (P(L)*(1-S) + (1-P(L))*G)
        numerator = p_learned * (1 - p_slip)
        denominator = numerator + (1 - p_learned) * p_guess
    else:
        # P(L | Incorrect) = (P(L) * S) / (P(L)*S + (1-P(L))*(1-G))
        numerator = p_learned * p_slip
        denominator = numerator + (1 - p_learned) * (1 - p_guess)
        
    p_learned_posterior = numerator / denominator if denominator > 0 else p_learned
    
    # 2. Account for Learning Transition (Knowledge acquisition between steps)
    # P(L_next) = P(L_post) + (1 - P(L_post)) * P(Transit)
    p_learned_next = p_learned_posterior + (1 - p_learned_posterior) * p_transit
    
    # Update State
    mastery.mastery_probability = min(max(p_learned_next, 0.0), 1.0) # Clamp 0-1
    mastery.total_attempts += 1
    if correct:
        mastery.correct_attempts += 1
    mastery.last_practiced = timezone.now()
    
    # Append to history (keep last 20 for graphs)
    history = mastery.history or []
    history.append({
        't': mastery.total_attempts,
        'p': round(mastery.mastery_probability, 4),
        'correct': correct
    })
    mastery.history = history[-20:]
    
    mastery.save()
    
    return mastery.mastery_probability

def get_weak_skills(user, threshold=0.5):
    """
    Get skills where the user is struggling (low mastery after some attempts).
    """
    return SkillMastery.objects.filter(
        user=user, 
        mastery_probability__lt=threshold, 
        total_attempts__gte=3
    ).select_related('skill').order_by('mastery_probability')

def get_strong_skills(user, threshold=0.9):
    """
    Get skills considered mastered.
    """
    return SkillMastery.objects.filter(
        user=user, 
        mastery_probability__gte=threshold
    ).select_related('skill').order_by('-mastery_probability')
