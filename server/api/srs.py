import math

def calculate_srs(grade, repetitions, easiness_factor, interval):
    """
    SuperMemo-2 Algorithm implementation.
    
    Args:
        grade (int): User's quality of response (0-5).
                     5 - perfect response
                     4 - correct response after a hesitation
                     3 - correct response recalled with serious difficulty
                     2 - incorrect response; where the correct one seemed easy to recall
                     1 - incorrect response; the correct one remembered
                     0 - complete blackout.
        repetitions (int): Number of consecutive successful repetitions.
        easiness_factor (float): Easiness factor (EF), typically starts at 2.5.
        interval (int): Current interval in days.
        
    Returns:
        dict: {
            'repetitions': int,
            'easiness_factor': float,
            'interval': int
        }
    """
    
    if grade >= 3:
        if repetitions == 0:
            interval = 1
        elif repetitions == 1:
            interval = 6
        else:
            interval = math.ceil(interval * easiness_factor)
        
        repetitions += 1
        
        # Calculate new Easiness Factor
        easiness_factor = easiness_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02))
    else:
        repetitions = 0
        interval = 1
        # EF remains the same for failed attempts in original SM-2, 
        # though some variations decrease it. We'll stick to standard.
    
    if easiness_factor < 1.3:
        easiness_factor = 1.3
        
    return {
        'repetitions': repetitions,
        'easiness_factor': round(easiness_factor, 2),
        'interval': interval
    }
