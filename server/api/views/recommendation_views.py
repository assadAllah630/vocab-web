from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from ..agents.recommendation_agent import get_personalized_recommendations

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_recommendations(request):
    """
    Get personalized learning recommendations.
    """
    # Use the Agent which wraps the Engine and adds AI personalization
    recs = get_personalized_recommendations(request.user.id)
    return Response(recs)
