from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from ..agents.student_insights import run_student_insights

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_student_insights(request):
    """
    Generate personalized insights for the requesting student.
    Uses the Student Insight Agent (LangGraph).
    """
    try:
        insights = run_student_insights(request.user.id)
        return Response(insights)
    except Exception as e:
        print(f"Error generating insights: {e}")
        return Response(
            {"error": "Failed to generate insights. Please try again later."}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
