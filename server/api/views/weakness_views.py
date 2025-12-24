from rest_framework import viewsets, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from ..services.weakness.service import WeaknessService

class WeaknessViewSet(viewsets.ViewSet):
    """
    Read-only viewset for fetching user weaknesses.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def list(self, request):
        """Get all detected weaknesses."""
        service = WeaknessService()
        results = service.detect_weaknesses(request.user)
        return Response(results)

    @action(detail=False, methods=['post'])
    def refresh(self, request):
        """Force refresh of analysis (invalidate cache)."""
        service = WeaknessService()
        service.invalidate_cache(request.user)
        results = service.detect_weaknesses(request.user)
        return Response(results)
