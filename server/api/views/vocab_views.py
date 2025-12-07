from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from ..models import Vocabulary, Tag, UserProfile
from ..serializers import VocabularySerializer
from ..hlr import HLRScheduler
from ..prompts import ContextEngineer
from ..gemini_helper import generate_content
from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
import csv
import io
import json

def enrich_vocabulary_with_ai(vocab, api_key):
    if not api_key:
        return

    try:
        # Get user languages
        try:
            profile = vocab.created_by.profile
            native_lang_code = profile.native_language
            target_lang_code = profile.target_language
        except UserProfile.DoesNotExist:
            native_lang_code = 'en'
            target_lang_code = 'de'

        context_engineer = ContextEngineer(native_lang_code, target_lang_code)
        prompt = context_engineer.get_enrichment_prompt(vocab.word, vocab.type, vocab.translation)
        
        # Use centralized generate_content with automatic fallback
        response = generate_content(api_key, prompt)
        # Clean response text to ensure valid JSON
        text = response.text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.endswith('```'):
            text = text[:-3]
        
        data = json.loads(text)
        
        # Tags
        for tag_name in data.get('tags', []):
            tag, _ = Tag.objects.get_or_create(name=tag_name.lower(), user=vocab.created_by)
            vocab.tags.add(tag)
            
        # Synonyms & Antonyms (Merge with existing)
        existing_synonyms = set(vocab.synonyms)
        existing_synonyms.update(data.get('synonyms', []))
        vocab.synonyms = list(existing_synonyms)
        
        existing_antonyms = set(vocab.antonyms)
        existing_antonyms.update(data.get('antonyms', []))
        vocab.antonyms = list(existing_antonyms)
        
        # Related Words (Smart Linking)
        # Find existing words in DB that match related concepts
        related_concepts = data.get('related_concepts', [])
        
        # Save abstract concepts to JSON field
        vocab.related_concepts = related_concepts
        
        for concept in related_concepts:
            related_vocab = Vocabulary.objects.filter(
                created_by=vocab.created_by, 
                word__iexact=concept
            ).first()
            if related_vocab:
                vocab.related_words.add(related_vocab)
        
        vocab.save()
        
    except Exception as e:
        print(f"AI Enrichment Failed: {e}")
        # Graceful degradation - do nothing

class VocabularyViewSet(viewsets.ModelViewSet):
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    # pagination_class = StandardResultsSetPagination
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['word', 'created_at', 'type', 'last_seen']
    ordering = ['-created_at']  # Default ordering

    def get_queryset(self):
        # Filter by user's target language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'

        queryset = Vocabulary.objects.filter(created_by=self.request.user, language=target_lang)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(word__icontains=search) | Q(translation__icontains=search))
            
        # Tag
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__name=tag)
            
        # Type
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
            
        return queryset

    def _generate_embedding_for_vocab(self, vocab, request):
        """Helper to generate embedding for a vocabulary item."""
        api_key = request.headers.get('X-OpenRouter-Key')
        if not api_key:
            return
            
        try:
            from ..embedding_service import EmbeddingService
            import threading
            
            def generate_and_save():
                try:
                    # Simplified format: "Word Translation"
                    # This proved to be much more effective for semantic search than including examples/synonyms
                    text = f"{vocab.word} {vocab.translation}"
                        
                    embedding = EmbeddingService.generate_embedding(text, api_key)
                    vocab.embedding = embedding
                    vocab.save(update_fields=['embedding'])
                except Exception as e:
                    print(f"Failed to auto-generate embedding for {vocab.word}: {e}")
            
            # Run in background thread
            thread = threading.Thread(target=generate_and_save)
            thread.start()
        except Exception as e:
            print(f"Error initiating embedding generation: {e}")

    def perform_create(self, serializer):
        # Set language to user's target language
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        vocab = serializer.save(created_by=self.request.user, language=target_lang)
        
        # Trigger AI Enrichment
        gemini_key = self.request.headers.get('X-Gemini-Key')
        if gemini_key:
            # Use background thread for AI enrichment
            import threading
            thread = threading.Thread(target=enrich_vocabulary_with_ai, args=(vocab, gemini_key))
            thread.start()
            
        # Trigger Embedding Generation
        self._generate_embedding_for_vocab(vocab, self.request)

    def perform_update(self, serializer):
        vocab = serializer.save()
        # Trigger Embedding Generation on update
        self._generate_embedding_for_vocab(vocab, self.request)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="vocabulary_export_{timezone.now().date()}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Word', 'Translation', 'Type', 'Example', 'Tags', 'Synonyms', 'Antonyms', 'Created At'])

        vocab_list = self.get_queryset()
        for vocab in vocab_list:
            tags = ", ".join([t.name for t in vocab.tags.all()])
            synonyms = ", ".join(vocab.synonyms)
            antonyms = ", ".join(vocab.antonyms)
            writer.writerow([vocab.word, vocab.translation, vocab.type, vocab.example, tags, synonyms, antonyms, vocab.created_at])

        return response

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def import_csv(self, request):
        """
        Import Vocabulary from CSV
        CSV Format: word, translation, type, example, tags (comma-separated), synonyms (comma-separated), antonyms (comma-separated)
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Use utf-8-sig to handle BOM from Excel
            decoded_file = file_obj.read().decode('utf-8-sig')
            io_string = io.StringIO(decoded_file)
            
            # Read CSV and normalize headers
            reader = csv.DictReader(io_string)
            
            # Normalize headers (strip whitespace, lowercase)
            # This is a bit tricky with DictReader as it reads headers immediately.
            # Instead, we'll handle key lookups robustly.
            
            created_count = 0
            errors = []
            
            # Get user's target language for import
            try:
                target_lang = request.user.profile.target_language
            except UserProfile.DoesNotExist:
                target_lang = 'de'
            
            for row in reader:
                try:
                    # Parse tags
                    tags_str = row.get('tags', '') or row.get('Tags', '')
                    tag_names = [t.strip() for t in tags_str.split(',') if t.strip()]
                    
                    # Parse synonyms and antonyms
                    synonyms_str = row.get('synonyms', '') or row.get('Synonyms', '')
                    synonyms = [s.strip() for s in synonyms_str.split(',') if s.strip()]
                    
                    antonyms_str = row.get('antonyms', '') or row.get('Antonyms', '')
                    antonyms = [a.strip() for a in antonyms_str.split(',') if a.strip()]

                    # Check for duplicates
                    word_text = row.get('word') or row.get('Word')
                    if not word_text:
                        continue
                        
                    # Skip if word already exists for this user and language
                    if Vocabulary.objects.filter(word__iexact=word_text, created_by=request.user, language=target_lang).exists():
                        continue
                    
                    # Create vocabulary
                    vocab = Vocabulary.objects.create(
                        word=word_text,
                        translation=row.get('translation') or row.get('Translation'),
                        type=row.get('type') or row.get('Type', 'other'),
                        example=row.get('example', '') or row.get('Example', ''),
                        synonyms=synonyms,
                        antonyms=antonyms,
                        created_by=request.user,
                        language=target_lang
                    )
                    
                    # Add tags
                    for tag_name in tag_names:
                        tag, _ = Tag.objects.get_or_create(name=tag_name, user=request.user)
                        vocab.tags.add(tag)
                    
                    created_count += 1
                except Exception as e:
                    errors.append(f"Error importing row {row.get('word', 'unknown')}: {str(e)}")
            
            return Response({
                'message': f'Successfully imported {created_count} words',
                'errors': errors
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PublicVocabularyViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VocabularySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        try:
            target_lang = self.request.user.profile.target_language
        except UserProfile.DoesNotExist:
            target_lang = 'de'
            
        return Vocabulary.objects.filter(is_public=True, language=target_lang).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def copy(self, request, pk=None):
        vocab = self.get_object()
        # Check if user already has this word
        if Vocabulary.objects.filter(created_by=request.user, word=vocab.word).exists():
            return Response({'error': 'You already have this word in your collection'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create copy
        new_vocab = Vocabulary.objects.create(
            word=vocab.word,
            translation=vocab.translation,
            example=vocab.example,
            type=vocab.type,
            created_by=request.user,
            is_public=False # Private by default when copied
        )
        # Copy tags
        for tag in vocab.tags.all():
            # Create new tag for user if not exists, or link existing
            user_tag, _ = Tag.objects.get_or_create(name=tag.name, user=request.user)
            new_vocab.tags.add(user_tag)
            
        return Response(VocabularySerializer(new_vocab).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_vocab_by_status(request):
    """
    Get vocabulary filtered by HLR status: 'new', 'learning', 'mastered'.
    """
    status_param = request.query_params.get('status', 'new')
    user = request.user
    
    try:
        target_lang = user.profile.target_language
    except UserProfile.DoesNotExist:
        target_lang = 'de'
        
    queryset = Vocabulary.objects.filter(created_by=user, language=target_lang)
    
    filtered_vocab = []
    now = timezone.now()
    
    for word in queryset:
        # Determine status
        if not word.last_practiced_at:
            status = 'new'
            recall_prob = 0.0
        else:
            days_since = (now - word.last_practiced_at).days
            recall_prob = HLRScheduler.predict_recall_probability(
                word.correct_count,
                word.wrong_count,
                word.total_practice_count,
                days_since
            )
            
            # Mastery Definition:
            # 1. Practiced at least 3 times
            # 2. Recall Probability > 90%
            is_mastered = word.total_practice_count >= 3 and recall_prob > 0.9
            
            if is_mastered:
                status = 'mastered'
            elif recall_prob < 0.5:
                status = 'new' # "Needs Review" is grouped with New/Weak
            else:
                status = 'learning'
        
        # Filter
        if status == status_param:
            # Add recall_prob to the serialized data for the frontend WiFi signal
            data = VocabularySerializer(word).data
            data['recall_probability'] = recall_prob
            filtered_vocab.append(data)
            
    # Sort by recall probability (ascending for new/learning, descending for mastered)
    if status_param == 'mastered':
        filtered_vocab.sort(key=lambda x: x['recall_probability'], reverse=True)
    else:
        filtered_vocab.sort(key=lambda x: x['recall_probability'])
        
    return Response(filtered_vocab)
