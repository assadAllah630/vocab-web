from typing import List, Dict, Any
from dataclasses import dataclass, field
from django.utils import timezone
from api.models import User, AssignmentProgress, SkillMastery
from api.services.weakness.service import WeaknessService

@dataclass
class Recommendation:
    type: str          
    priority: int      
    title: str
    reason: str
    action_url: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self):
        return {
            'type': self.type,
            'priority': self.priority,
            'title': self.title,
            'reason': self.reason,
            'action_url': self.action_url,
            'metadata': self.metadata
        }

class RecommendationSource:
    def get_recommendations(self, user) -> List[Recommendation]:
        raise NotImplementedError

class AssignmentSource(RecommendationSource):
    def get_recommendations(self, user) -> List[Recommendation]:
        recs = []
        pending = AssignmentProgress.objects.filter(
            student=user,
            status__in=['not_started', 'in_progress']
        ).select_related('assignment')
        
        now = timezone.now()
        for p in pending:
            assignment = p.assignment
            if not assignment.due_date:
                continue
                
            time_left = assignment.due_date - now
            
            if time_left.days < 0:
                recs.append(Recommendation(
                    type='assignment',
                    priority=5, # Highest priority
                    title=f"Overdue: {assignment.title}",
                    reason="This assignment is past due. Complete it now!",
                    action_url=f"/assignments/{assignment.id}"
                ))
            elif time_left.days < 2:
                recs.append(Recommendation(
                    type='assignment',
                    priority=4,
                    title=f"Due Soon: {assignment.title}",
                    reason=f"Due in {time_left.days} days",
                    action_url=f"/assignments/{assignment.id}"
                ))
        return recs

class WeaknessSource(RecommendationSource):
    def get_recommendations(self, user) -> List[Recommendation]:
        recs = []
        service = WeaknessService()
        weaknesses = service.detect_weaknesses(user).get('items', [])
        
        for w in weaknesses:
            if w['type'] == 'low_mastery':
                recs.append(Recommendation(
                    type='practice',
                    priority=3,
                    title=f"Strengthen {w['metadata'].get('skill_code', 'Skill')}",
                    reason=w['description'],
                    action_url=f"/practice/skill/{w['metadata'].get('skill_code')}"
                ))
            elif w['type'] == 'error_pattern':
                recs.append(Recommendation(
                    type='review',
                    priority=3,
                    title=f"Fix '{w['metadata'].get('word')}'",
                    reason=w['description'],
                    action_url=f"/practice/words/{w['metadata'].get('word_id')}"
                ))
        return recs

class DecaySource(RecommendationSource):
    def get_recommendations(self, user) -> List[Recommendation]:
        # Decay is handled by WeaknessService('decay'), but we can add specific logic here if needed.
        # For now, let's assume WeaknessService covers it.
        # But we might want specific "Refresher" recs.
        return []

class RecommendationEngine:
    def __init__(self):
        self.sources = [
            AssignmentSource(),
            WeaknessSource(),
            DecaySource()
        ]
        
    def get_recommendations(self, user) -> List[Dict[str, Any]]:
        all_recs = []
        for source in self.sources:
            try:
                all_recs.extend(source.get_recommendations(user))
            except Exception as e:
                print(f"Error in recommendation source {source}: {e}")
                
        # Sort by priority desc, then title 
        all_recs.sort(key=lambda r: (-r.priority, r.title))
        
        return [r.to_dict() for r in all_recs[:5]] # Top 5
