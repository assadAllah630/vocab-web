from rest_framework import viewsets, permissions
from rest_framework.response import Response
from ..models import SkillMastery
from ..serializers import SkillMasterySerializer

class SkillMasteryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only endpoint for user's skill mastery metrics.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SkillMasterySerializer
    
    def get_queryset(self):
        return SkillMastery.objects.filter(user=self.request.user).select_related('skill')
