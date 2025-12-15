from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import UserProfile, UserRelationship
from ..serializers import UserProfileSerializer
from django.contrib.auth.models import User

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_profile(request):
    user = request.user
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=user)
    
    # Language settings
    native_lang = request.data.get('native_language')
    target_lang = request.data.get('target_language')
    
    if native_lang:
        profile.native_language = native_lang
    if target_lang:
        profile.target_language = target_lang
    
    # API Keys - save any that are provided in the request
    api_key_fields = [
        'ocrspace_api_key',
        'deepgram_api_key',
        'speechify_api_key',
        'stable_horde_api_key',
    ]
    
    for field in api_key_fields:
        if field in request.data:
            setattr(profile, field, request.data[field])
    
    # Profile info
    if 'bio' in request.data:
        profile.bio = request.data['bio']
    if 'location' in request.data:
        profile.location = request.data['location']
        
    profile.save()
    return Response(UserProfileSerializer(profile).data)


class UserProfileViewSet(viewsets.ModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return UserProfile.objects.filter(user=self.request.user)

    def get_object(self):
        return self.request.user.profile

    @action(detail=False, methods=['get'])
    def me(self, request):
        serializer = self.get_serializer(request.user.profile)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def public(self, request):
        username = request.query_params.get('username')
        if not username:
            return Response({'error': 'Username required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(username=username)
            serializer = self.get_serializer(user.profile)
            
            # Add follow status
            data = serializer.data
            data['is_following'] = UserRelationship.objects.filter(follower=request.user, following=user).exists()
            data['followers_count'] = user.followers.count()
            data['following_count'] = user.following.count()
            
            return Response(data)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserSearchView(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if len(query) < 3:
            return UserProfile.objects.none()
        return UserProfile.objects.filter(user__username__icontains=query).exclude(user=self.request.user)[:10]

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def follow_user(request):
    username = request.data.get('username')
    action = request.data.get('action', 'follow') # follow or unfollow
    
    try:
        target_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
    if target_user == request.user:
        return Response({'error': 'Cannot follow yourself'}, status=status.HTTP_400_BAD_REQUEST)
        
    if action == 'follow':
        UserRelationship.objects.get_or_create(follower=request.user, following=target_user)
        return Response({'status': 'following'})
    else:
        UserRelationship.objects.filter(follower=request.user, following=target_user).delete()
        return Response({'status': 'unfollowed'})
