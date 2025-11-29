from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vocabulary, UserProgress, Quiz, Tag, GrammarTopic, Podcast, UserProfile, Exam, ExamAttempt, UserRelationship, SavedText

class SavedTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedText
        fields = ['id', 'title', 'content', 'language', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    native_language = serializers.CharField(source='profile.native_language', read_only=True)
    target_language = serializers.CharField(source='profile.target_language', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'native_language', 'target_language']

class VocabularySerializer(serializers.ModelSerializer):
    tags = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)

    class Meta:
        model = Vocabulary
        fields = ['id', 'word', 'translation', 'example', 'type', 'created_by', 'created_at', 'tags', 'synonyms', 'antonyms', 'related_words', 'related_concepts', 'is_public', 'total_practice_count', 'correct_count', 'wrong_count']
        read_only_fields = ['created_by', 'created_at', 'related_words', 'total_practice_count', 'correct_count', 'wrong_count']

    def validate_word(self, value):
        user = self.context['request'].user
        if Vocabulary.objects.filter(created_by=user, word__iexact=value).exists():
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


class GrammarTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = GrammarTopic
        fields = ['id', 'level', 'category', 'title', 'content', 'examples', 'order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']

class PodcastSerializer(serializers.ModelSerializer):
    audio_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Podcast
        fields = ['id', 'user', 'title', 'text_content', 'audio_file', 'audio_url', 'voice_id', 'duration', 'created_at']
        read_only_fields = ['user', 'created_at', 'duration']
    
    def get_audio_url(self, obj):
        if obj.audio_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.audio_file.url)
        return None

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'native_language', 'target_language', 'google_tts_api_key', 'deepgram_api_key', 'speechify_api_key', 'gemini_api_key', 'openrouter_api_key', 'stable_horde_api_key', 'huggingface_api_token', 'bio', 'avatar', 'location']
        extra_kwargs = {
            'google_tts_api_key': {'write_only': True},
            'deepgram_api_key': {'write_only': True},
            'speechify_api_key': {'write_only': True},
            'gemini_api_key': {'write_only': True},
            'openrouter_api_key': {'write_only': True},
            'stable_horde_api_key': {'write_only': True},
            'huggingface_api_token': {'write_only': True}
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
