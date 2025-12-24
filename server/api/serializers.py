from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vocabulary, UserProgress, Quiz, Tag, GrammarTopic, Podcast, PodcastCategory, UserProfile, Exam, ExamAttempt, UserRelationship, SavedText, Teacher, Classroom, ClassMembership, Assignment, AssignmentProgress, WritingExercise, WritingSubmission, LearningPath, PathSubLevel, PathNode, PathNodeMaterial, PathEnrollment, NodeProgress, ClassPathProgress, StudentRemediation

class SavedTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedText
        fields = ['id', 'title', 'content', 'language', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    native_language = serializers.CharField(source='profile.native_language', read_only=True)
    target_language = serializers.CharField(source='profile.target_language', read_only=True)
    is_teacher = serializers.BooleanField(source='profile.is_teacher', read_only=True)
    date_joined = serializers.DateTimeField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'native_language', 'target_language', 'is_teacher', 'is_staff', 'is_superuser', 'date_joined']


class VocabularySerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Vocabulary
        fields = ['id', 'word', 'translation', 'example', 'type', 'created_by', 'created_at', 'tags', 'synonyms', 'antonyms', 'related_words', 'related_concepts', 'is_public', 'total_practice_count', 'correct_count', 'wrong_count']
        read_only_fields = ['created_by', 'created_at', 'related_words', 'total_practice_count', 'correct_count', 'wrong_count']

    def validate_word(self, value):
        user = self.context['request'].user
        # Get user's current native language context
        try:
            native_language = user.profile.native_language
        except:
            native_language = 'en'
            
        # Check for duplicates only within the same language pair (word + native_language)
        if Vocabulary.objects.filter(
            created_by=user, 
            word__iexact=value,
            native_language=native_language
        ).exists():
            raise serializers.ValidationError("You have already added this word.")
        return value

    def create(self, validated_data):
        tags_data = validated_data.pop('tags', [])
        vocab = Vocabulary.objects.create(**validated_data)
        for tag_name in tags_data:
            tag, _ = Tag.objects.get_or_create(name=tag_name, user=validated_data['created_by'])
            vocab.tags.add(tag)
        return vocab

    def update(self, instance, validated_data):
        tags_data = validated_data.pop('tags', None)
        instance = super().update(instance, validated_data)
        if tags_data is not None:
            instance.tags.clear()
            for tag_name in tags_data:
                tag, _ = Tag.objects.get_or_create(name=tag_name, user=instance.created_by)
                instance.tags.add(tag)
        return instance
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation['tags'] = [tag.name for tag in instance.tags.all()]
        return representation

class UserProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProgress
        fields = '__all__'
        read_only_fields = ['user']

class QuizSerializer(serializers.ModelSerializer):
    vocab_word = serializers.CharField(source='vocab.word', read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'user', 'vocab', 'score', 'timestamp', 'vocab_word']
        read_only_fields = ['user', 'timestamp']

class ExamAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAttempt
        fields = ['id', 'user_answers', 'feedback', 'score', 'created_at']
        read_only_fields = ['created_at']

class ExamSerializer(serializers.ModelSerializer):
    attempts = ExamAttemptSerializer(many=True, read_only=True)
    latest_attempt = serializers.SerializerMethodField()
    
    class Meta:
        model = Exam
        fields = ['id', 'user', 'language', 'topic', 'difficulty', 'questions', 'best_score', 'attempt_count', 'created_at', 'updated_at', 'attempts', 'latest_attempt', 'is_public']
        read_only_fields = ['user', 'created_at', 'updated_at', 'best_score', 'attempt_count']
    
    def get_latest_attempt(self, obj):
        latest = obj.attempts.first()  # Already ordered by -created_at
        if latest:
            return ExamAttemptSerializer(latest).data
        return None

class WritingSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = WritingSubmission
        fields = ['id', 'student', 'student_name', 'content', 'word_count', 'teacher_grade', 'teacher_feedback', 'ai_score', 'ai_feedback', 'submitted_at']
        read_only_fields = ['student', 'submitted_at', 'word_count']

class WritingExerciseSerializer(serializers.ModelSerializer):
    submissions = WritingSubmissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = WritingExercise
        fields = ['id', 'topic', 'prompt_text', 'min_words', 'time_limit', 'rubric', 'ai_grading_enabled', 'created_at', 'submissions']
        read_only_fields = ['created_at']


class GrammarTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrammarTopic
        fields = ['id', 'level', 'category', 'title', 'content', 'examples', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class PodcastCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PodcastCategory
        fields = '__all__'
        read_only_fields = ['user', 'created_at']

class PodcastSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Podcast
        fields = ['id', 'user', 'category', 'category_name', 'title', 'text_content', 'audio_file', 'audio_url', 'voice_id', 'duration', 'episode_number', 'created_at', 'processing_status', 'progress', 'current_message', 'estimated_remaining', 'speech_marks']
        read_only_fields = ['user', 'created_at', 'duration', 'audio_url']
    
    def get_audio_url(self, obj):
        if obj.audio_file:
            # For S3, obj.audio_file.url is already an absolute URL (optionally signed)
            return obj.audio_file.url
        return None

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    is_teacher = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'native_language', 'target_language', 'is_teacher', 'deepgram_api_key', 'speechify_api_key', 'speechify_api_key_2', 'speechify_api_key_3', 'speechify_api_key_4', 'ocrspace_api_key', 'stable_horde_api_key', 'bio', 'avatar', 'location']
        extra_kwargs = {
            'deepgram_api_key': {'required': False},
            'speechify_api_key': {'required': False},
            'speechify_api_key_2': {'required': False},
            'speechify_api_key_3': {'required': False},
            'speechify_api_key_4': {'required': False},
            'ocrspace_api_key': {'required': False},
            'stable_horde_api_key': {'required': False}
        }


class UserRelationshipSerializer(serializers.ModelSerializer):
    follower_username = serializers.CharField(source='follower.username', read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)
    following_avatar = serializers.ImageField(source='following.profile.avatar', read_only=True)
    follower_avatar = serializers.ImageField(source='follower.profile.avatar', read_only=True)

    class Meta:
        model = UserRelationship
        fields = ['id', 'follower', 'following', 'created_at', 'follower_username', 'following_username', 'following_avatar', 'follower_avatar']
        read_only_fields = ['follower', 'created_at']

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='admin_role.role', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'last_login', 'role']


# =============================================================================
# External Podcast Serializers
# =============================================================================

from .models import ExternalPodcast, ExternalEpisode, ExternalPodcastSubscription


class ExternalEpisodeSerializer(serializers.ModelSerializer):
    """Serializer for external podcast episodes."""
    
    duration_formatted = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    
    class Meta:
        model = ExternalEpisode
        fields = [
            'id', 'guid', 'title', 'link', 'description', 'audio_url',
            'duration', 'duration_formatted', 'published_at', 
            'file_size', 'image_url', 'transcript', 'transcript_source', 
            'listen_count', 'created_at', 'is_liked', 'is_saved'
        ]
        read_only_fields = ['id', 'created_at', 'duration_formatted']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Optimize this later with prefetch
            return obj.interactions.filter(user=request.user, is_liked=True).exists()
        return False

    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.interactions.filter(user=request.user, is_saved=True).exists()
        return False


class ExternalPodcastSerializer(serializers.ModelSerializer):
    """Serializer for external podcasts (list view)."""
    
    is_subscribed = serializers.SerializerMethodField()
    
    class Meta:
        model = ExternalPodcast
        fields = [
            'id', 'name', 'feed_url', 'artwork_url', 'author',
            'description', 'website_url', 'level', 'language',
            'episode_count', 'last_synced_at', 'is_active', 'is_featured',
            'itunes_id', 'created_at', 'is_subscribed'
        ]
        read_only_fields = ['id', 'created_at', 'last_synced_at', 'episode_count']
    
    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.subscriptions.filter(user=request.user).exists()
        return False


class ExternalPodcastDetailSerializer(ExternalPodcastSerializer):
    """Detailed serializer with recent episodes (detail view)."""
    
    recent_episodes = serializers.SerializerMethodField()
    
    class Meta(ExternalPodcastSerializer.Meta):
        fields = ExternalPodcastSerializer.Meta.fields + ['recent_episodes']
    
    def get_recent_episodes(self, obj):
        episodes = obj.episodes.all()[:100]
        return ExternalEpisodeSerializer(episodes, many=True).data


class ExternalPodcastSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for user podcast subscriptions."""
    
    podcast = ExternalPodcastSerializer(read_only=True)
    podcast_id = serializers.PrimaryKeyRelatedField(
        queryset=ExternalPodcast.objects.all(),
        source='podcast',
        write_only=True
    )
    
    class Meta:
        model = ExternalPodcastSubscription
        fields = [
            'id', 'podcast', 'podcast_id', 
            'last_played_episode', 'last_position', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# =============================================================================
# Teacher & Classroom Serializers
# =============================================================================

class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for teacher profiles."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    user_details = serializers.SerializerMethodField()
    classroom_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = ['id', 'username', 'email', 'user_details', 'organization_name', 'subjects', 
                  'bio', 'is_verified', 'max_classrooms', 'classroom_count', 'student_count', 'created_at']
        read_only_fields = ['id', 'is_verified', 'created_at', 'classroom_count', 'student_count']
    
    def get_user_details(self, obj):
        return {
            'username': obj.user.username,
            'email': obj.user.email,
            'date_joined': obj.user.date_joined
        }

    def get_classroom_count(self, obj):
        return obj.classrooms.count()

    def get_student_count(self, obj):
        from .models import ClassMembership
        return ClassMembership.objects.filter(
            classroom__teacher=obj,
            status='active'
        ).values('student').distinct().count()


class ClassroomSerializer(serializers.ModelSerializer):
    """Serializer for classrooms (list view)."""
    teacher_name = serializers.CharField(source='teacher.user.username', read_only=True)
    language = serializers.CharField(source='target_language', read_only=True)
    student_count = serializers.SerializerMethodField()
    is_active_session = serializers.SerializerMethodField()
    active_session_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'description', 'level', 'language', 'target_language', 'speaking_language', 'max_students',
                  'invite_code', 'is_active', 'requires_approval', 'teacher_name',
                  'student_count', 'is_active_session', 'active_session_id', 'created_at', 'updated_at', 'linked_path']
        read_only_fields = ['id', 'invite_code', 'created_at', 'updated_at']
    
    def get_student_count(self, obj):
        return obj.memberships.filter(status='active').count()

    def get_is_active_session(self, obj):
        # Check if there is any session with status 'live' associated with this classroom
        return obj.sessions.filter(status='live').exists()

    def get_active_session_id(self, obj):
        # Return the ID of the active live session, if any
        live_session = obj.sessions.filter(status='live').first()
        return live_session.id if live_session else None


class ClassroomDetailSerializer(ClassroomSerializer):
    """Extended serializer with students list (detail view)."""
    students = serializers.SerializerMethodField()
    pending_count = serializers.SerializerMethodField()
    pending_requests = serializers.SerializerMethodField()
    
    class Meta(ClassroomSerializer.Meta):
        fields = ClassroomSerializer.Meta.fields + ['students', 'pending_count', 'pending_requests']
    
    def get_students(self, obj):
        memberships = obj.memberships.filter(status='active').select_related('student')
        return [
            {
                'id': m.student.id,
                'username': m.student.username,
                'email': m.student.email,
                'joined_at': m.joined_at
            }
            for m in memberships
        ]
    
    def get_pending_count(self, obj):
        return obj.memberships.filter(status='pending').count()
    
    def get_pending_requests(self, obj):
        """Only show pending requests to the classroom teacher."""
        request = self.context.get('request')
        if request and hasattr(request.user, 'teacher_profile'):
            if obj.teacher.user == request.user:
                pending = obj.memberships.filter(status='pending').select_related('student')
                return [
                    {
                        'membership_id': m.id,
                        'student_id': m.student.id,
                        'username': m.student.username,
                        'email': m.student.email,
                        'requested_at': m.joined_at
                    }
                    for m in pending
                ]
        return []


class ClassMembershipSerializer(serializers.ModelSerializer):
    """Serializer for class memberships."""
    student_username = serializers.CharField(source='student.username', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    
    class Meta:
        model = ClassMembership
        fields = ['id', 'classroom', 'student', 'student_username', 'student_email',
                  'classroom_name', 'status', 'joined_at']
        read_only_fields = ['id', 'joined_at']


class AssignmentProgressSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = AssignmentProgress
        fields = ['id', 'assignment', 'student', 'student_name', 'status', 'started_at', 'submitted_at', 'score', 'feedback']
        read_only_fields = ['started_at']

class AssignmentSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()
    teacher_name = serializers.CharField(source='created_by.username', read_only=True)
    my_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Assignment
        fields = ['id', 'classroom', 'content_type', 'content_id', 'title', 'description', 
                  'due_date', 'is_required', 'max_attempts', 'created_at', 'created_by', 
                  'teacher_name', 'progress', 'my_progress', 'metadata']
        read_only_fields = ['created_at', 'created_by']
        
    def get_progress(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'teacher_profile'):
            if obj.classroom.teacher.user == request.user:
                return AssignmentProgressSerializer(obj.progress.all(), many=True).data
        return []

    def get_my_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            progress = obj.progress.filter(student=request.user).first()
            if progress:
                return AssignmentProgressSerializer(progress).data
        return None

from .models import Skill, SkillMastery, LearningPath, PathNode, PathEnrollment, NodeProgress

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['code', 'name', 'category', 'level', 'description']

class SkillMasterySerializer(serializers.ModelSerializer):
    skill = SkillSerializer(read_only=True)
    
    class Meta:
        model = SkillMastery
        fields = ['skill', 'mastery_probability', 'total_attempts', 'last_practiced']


class PathNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PathNode
        fields = ['id', 'sublevel', 'order', 'node_type', 'content_type', 'content_id', 
                  'title', 'description', 'duration_minutes', 'pass_threshold',
                  'objectives', 'teacher_guide', 'student_summary', 'resources', 'skills']
        extra_kwargs = {
            'content_type': {'required': False, 'allow_null': True, 'allow_blank': True},
            'content_id': {'required': False, 'allow_null': True},
        }
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # Privacy: Hide teacher_guide and teacher-only resources from students
        is_teacher = False
        if request:
            try:
                if hasattr(request.user, 'teacher_profile'):
                    is_teacher = True
            except Exception:
                pass
            
        if not is_teacher:
            data.pop('teacher_guide', None)
            # Filter resources
            if instance.resources:
                data['resources'] = [r for r in instance.resources if not r.get('is_teacher_only', False)]
                
        return data


class PathSubLevelSerializer(serializers.ModelSerializer):
    nodes = PathNodeSerializer(many=True, read_only=True)
    
    class Meta:
        model = PathSubLevel
        fields = ['id', 'path', 'level_code', 'sublevel_code', 'title', 'description', 
                  'order', 'estimated_hours', 'objectives', 'nodes']
        read_only_fields = []


class LearningPathSerializer(serializers.ModelSerializer):
    sublevels = PathSubLevelSerializer(many=True, read_only=True)
    
    class Meta:
        model = LearningPath
        fields = ['id', 'speaking_language', 'target_language', 'title', 'description',
                  'estimated_hours', 'is_published', 'created_at', 'sublevels']
        read_only_fields = ['created_at']

class NodeProgressSerializer(serializers.ModelSerializer):
    node_title = serializers.CharField(source='node.title', read_only=True)
    node_type = serializers.CharField(source='node.node_type', read_only=True)
    
    class Meta:
        model = NodeProgress
        fields = ['id', 'enrollment', 'node', 'node_title', 'node_type', 'status', 
                  'started_at', 'completed_at', 'score', 'attempts']

class PathEnrollmentSerializer(serializers.ModelSerializer):
    path_title = serializers.CharField(source='path.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    progress = NodeProgressSerializer(many=True, read_only=True)
    
    class Meta:
        model = PathEnrollment
        fields = ['id', 'path', 'path_title', 'student', 'student_name', 'classroom', 
                  'enrolled_at', 'completed_at', 'progress']
        read_only_fields = ['enrolled_at']


from .models import LiveSession, SessionAttendance, SessionReminder

class SessionAttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    
    class Meta:
        model = SessionAttendance
        fields = ['id', 'session', 'student', 'student_name', 'status', 
                  'joined_at', 'left_at', 'duration_minutes']

class SessionReminderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SessionReminder
        fields = ['id', 'session', 'remind_before_minutes', 'sent_at']

class LiveSessionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.user.username', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    attendance = SessionAttendanceSerializer(many=True, read_only=True)
    
    class Meta:
        model = LiveSession
        fields = ['id', 'classroom', 'classroom_name', 'teacher', 'teacher_name',
                  'title', 'description', 'scheduled_at', 'duration_minutes', 
                  'timezone', 'session_type', 'meeting_url', 'meeting_id', 
                  'meeting_password', 'status', 'materials', 'recording_url', 
                  'linked_path_node', 'linked_path_node_details', 'created_at', 'attendance']
        read_only_fields = ['created_at', 'teacher', 'meeting_url', 'meeting_id', 'meeting_password', 'status']

    linked_path_node_details = PathNodeSerializer(source='linked_path_node', read_only=True)


from .models import Organization, OrganizationMembership

class OrganizationMembershipSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.username', read_only=True)
    
    class Meta:
        model = OrganizationMembership
        fields = ['id', 'organization', 'user', 'user_name', 'user_email', 
                  'role', 'joined_at', 'invited_by', 'invited_by_name']

class OrganizationSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()
    teacher_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'logo_url', 'primary_color', 'org_type',
                  'max_teachers', 'max_students', 'admin_email', 'website',
                  'created_at', 'is_active', 'member_count', 'teacher_count', 'student_count']
    
    def get_member_count(self, obj):
        return obj.members.count()
    
    def get_teacher_count(self, obj):
        return obj.members.filter(role='teacher').count()
    
    def get_student_count(self, obj):
        return obj.members.filter(role='student').count()


# =============================================================================
# CLASS-LEVEL PATH PROGRESS SERIALIZERS
# =============================================================================

class ClassPathProgressSerializer(serializers.ModelSerializer):
    """Serializer for class-level step progress."""
    node_title = serializers.CharField(source='node.title', read_only=True)
    node_type = serializers.CharField(source='node.node_type', read_only=True)
    node_order = serializers.IntegerField(source='node.order', read_only=True)
    sublevel_code = serializers.CharField(source='node.sublevel.code', read_only=True)
    last_session_title = serializers.CharField(source='last_session.title', read_only=True)
    
    class Meta:
        model = ClassPathProgress
        fields = ['id', 'classroom', 'node', 'node_title', 'node_type', 'node_order',
                  'sublevel_code', 'completion_percent', 'status', 'last_session',
                  'last_session_title', 'last_assignment', 'notes', 'updated_at']
        read_only_fields = ['id', 'classroom', 'node', 'updated_at']


class StudentRemediationSerializer(serializers.ModelSerializer):
    """Serializer for student catch-up tracking."""
    student_name = serializers.CharField(source='student.username', read_only=True)
    node_title = serializers.CharField(source='node.title', read_only=True)
    classroom_name = serializers.CharField(source='classroom.name', read_only=True)
    
    class Meta:
        model = StudentRemediation
        fields = ['id', 'student', 'student_name', 'classroom', 'classroom_name',
                  'node', 'node_title', 'reason', 'remediation_type', 'completed',
                  'completed_at', 'content_id', 'created_at']
        read_only_fields = ['id', 'created_at']
