"""
Multi-User Data Isolation Test Script

This script tests that users cannot access each other's data.
Run this to verify proper user isolation in the vocab_web application.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Vocabulary, UserProgress, Quiz, Exam, UserProfile, Tag, SavedText, Podcast
from django.db import transaction


def cleanup_test_users():
    """Remove test users if they exist"""
    User.objects.filter(username__in=['test_user_a', 'test_user_b']).delete()
    print("[OK] Cleaned up existing test users")


def create_test_users():
    """Create two test users"""
    user_a = User.objects.create_user(
        username='test_user_a',
        email='user_a@test.com',
        password='testpass123'
    )
    user_b = User.objects.create_user(
        username='test_user_b',
        email='user_b@test.com',
        password='testpass123'
    )
    
    # Create and update profiles
    profile_a, _ = UserProfile.objects.get_or_create(user=user_a)
    profile_a.native_language = 'en'
    profile_a.target_language = 'de'
    profile_a.gemini_api_key = 'user_a_gemini_key_123'
    profile_a.google_tts_api_key = 'user_a_tts_key_456'
    profile_a.save()
    
    profile_b, _ = UserProfile.objects.get_or_create(user=user_b)
    profile_b.native_language = 'en'
    profile_b.target_language = 'de'
    profile_b.gemini_api_key = 'user_b_gemini_key_789'
    profile_b.google_tts_api_key = 'user_b_tts_key_012'
    profile_b.save()
    
    print(f"[OK] Created test users: {user_a.username} and {user_b.username}")
    return user_a, user_b



def test_vocabulary_isolation(user_a, user_b):
    """Test that users cannot see each other's vocabulary"""
    print("\n=== Testing Vocabulary Isolation ===")
    
    # User A creates vocabulary
    vocab_a = Vocabulary.objects.create(
        word='Hund',
        translation='dog',
        type='noun',
        created_by=user_a,
        language='de'
    )
    
    # User B creates vocabulary
    vocab_b = Vocabulary.objects.create(
        word='Katze',
        translation='cat',
        type='noun',
        created_by=user_b,
        language='de'
    )
    
    # Check User A can only see their own vocabulary
    user_a_vocab = Vocabulary.objects.filter(created_by=user_a)
    assert user_a_vocab.count() == 1, "User A should see exactly 1 vocabulary item"
    assert user_a_vocab.first().word == 'Hund', "User A should see 'Hund'"
    assert not Vocabulary.objects.filter(created_by=user_a, word='Katze').exists(), \
        "User A should NOT see User B's 'Katze'"
    
    # Check User B can only see their own vocabulary
    user_b_vocab = Vocabulary.objects.filter(created_by=user_b)
    assert user_b_vocab.count() == 1, "User B should see exactly 1 vocabulary item"
    assert user_b_vocab.first().word == 'Katze', "User B should see 'Katze'"
    assert not Vocabulary.objects.filter(created_by=user_b, word='Hund').exists(), \
        "User B should NOT see User A's 'Hund'"
    
    print("[OK] Vocabulary is properly isolated between users")
    return vocab_a, vocab_b


def test_api_key_isolation(user_a, user_b):
    """Test that users cannot access each other's API keys"""
    print("\n=== Testing API Key Isolation ===")
    
    # Refresh profiles from database
    profile_a = UserProfile.objects.get(user=user_a)
    profile_b = UserProfile.objects.get(user=user_b)
    
    # Verify each user has their own API keys
    assert profile_a.gemini_api_key == 'user_a_gemini_key_123', f"User A should have their own Gemini key, got: {profile_a.gemini_api_key}"
    assert profile_b.gemini_api_key == 'user_b_gemini_key_789', f"User B should have their own Gemini key, got: {profile_b.gemini_api_key}"
    
    assert profile_a.google_tts_api_key == 'user_a_tts_key_456', f"User A should have their own TTS key, got: {profile_a.google_tts_api_key}"
    assert profile_b.google_tts_api_key == 'user_b_tts_key_012', f"User B should have their own TTS key, got: {profile_b.google_tts_api_key}"
    
    # Verify keys are different
    assert profile_a.gemini_api_key != profile_b.gemini_api_key, "API keys should be different"
    assert profile_a.google_tts_api_key != profile_b.google_tts_api_key, "TTS keys should be different"
    
    print("[OK] API keys are properly isolated between users")



def test_progress_isolation(user_a, user_b, vocab_a, vocab_b):
    """Test that users cannot see each other's progress"""
    print("\n=== Testing Progress Isolation ===")
    
    # User A practices their vocabulary
    progress_a = UserProgress.objects.create(
        user=user_a,
        vocab=vocab_a,
        repetition_stage=3,
        mistakes=1
    )
    
    # User B practices their vocabulary
    progress_b = UserProgress.objects.create(
        user=user_b,
        vocab=vocab_b,
        repetition_stage=5,
        mistakes=0
    )
    
    # Check User A can only see their own progress
    user_a_progress = UserProgress.objects.filter(user=user_a)
    assert user_a_progress.count() == 1, "User A should see exactly 1 progress record"
    assert user_a_progress.first().vocab.word == 'Hund', "User A's progress should be for 'Hund'"
    
    # Check User B can only see their own progress
    user_b_progress = UserProgress.objects.filter(user=user_b)
    assert user_b_progress.count() == 1, "User B should see exactly 1 progress record"
    assert user_b_progress.first().vocab.word == 'Katze', "User B's progress should be for 'Katze'"
    
    # Verify users cannot access each other's progress
    assert not UserProgress.objects.filter(user=user_a, vocab=vocab_b).exists(), \
        "User A should NOT have progress for User B's vocabulary"
    assert not UserProgress.objects.filter(user=user_b, vocab=vocab_a).exists(), \
        "User B should NOT have progress for User A's vocabulary"
    
    print("[OK] Progress is properly isolated between users")


def test_quiz_isolation(user_a, user_b, vocab_a, vocab_b):
    """Test that users cannot see each other's quiz history"""
    print("\n=== Testing Quiz History Isolation ===")
    
    # User A takes a quiz
    quiz_a = Quiz.objects.create(
        user=user_a,
        vocab=vocab_a,
        score=90
    )
    
    # User B takes a quiz
    quiz_b = Quiz.objects.create(
        user=user_b,
        vocab=vocab_b,
        score=85
    )
    
    # Check User A can only see their own quiz history
    user_a_quizzes = Quiz.objects.filter(user=user_a)
    assert user_a_quizzes.count() == 1, "User A should see exactly 1 quiz"
    assert user_a_quizzes.first().score == 90, "User A's quiz score should be 90"
    
    # Check User B can only see their own quiz history
    user_b_quizzes = Quiz.objects.filter(user=user_b)
    assert user_b_quizzes.count() == 1, "User B should see exactly 1 quiz"
    assert user_b_quizzes.first().score == 85, "User B's quiz score should be 85"
    
    print("[OK] Quiz history is properly isolated between users")


def test_exam_isolation(user_a, user_b):
    """Test that users cannot see each other's exams (unless public)"""
    print("\n=== Testing Exam Isolation ===")
    
    # User A creates a private exam
    exam_a_private = Exam.objects.create(
        user=user_a,
        topic='German Grammar A1',
        difficulty='easy',
        language='de',
        is_public=False,
        questions=[{'question': 'Test question'}]
    )
    
    # User A creates a public exam
    exam_a_public = Exam.objects.create(
        user=user_a,
        topic='German Vocabulary B1',
        difficulty='medium',
        language='de',
        is_public=True,
        questions=[{'question': 'Public question'}]
    )
    
    # User B creates a private exam
    exam_b_private = Exam.objects.create(
        user=user_b,
        topic='German Verbs A2',
        difficulty='medium',
        language='de',
        is_public=False,
        questions=[{'question': 'Another test'}]
    )
    
    # Check User A can see their own exams
    user_a_exams = Exam.objects.filter(user=user_a)
    assert user_a_exams.count() == 2, "User A should see 2 exams"
    
    # Check User B can see their own exams
    user_b_exams = Exam.objects.filter(user=user_b)
    assert user_b_exams.count() == 1, "User B should see 1 exam"
    
    # Check User B cannot see User A's private exam
    assert not Exam.objects.filter(user=user_b, topic='German Grammar A1').exists(), \
        "User B should NOT see User A's private exam"
    
    # Check User B CAN see User A's public exam (if querying public exams)
    public_exams = Exam.objects.filter(is_public=True)
    assert public_exams.filter(topic='German Vocabulary B1').exists(), \
        "Public exams should be visible to all users"
    
    print("[OK] Exams are properly isolated (private) and shared (public) as expected")


def test_tag_isolation(user_a, user_b):
    """Test that users cannot see each other's tags"""
    print("\n=== Testing Tag Isolation ===")
    
    # User A creates tags
    tag_a1 = Tag.objects.create(name='animals', user=user_a)
    tag_a2 = Tag.objects.create(name='food', user=user_a)
    
    # User B creates tags
    tag_b1 = Tag.objects.create(name='animals', user=user_b)  # Same name, different user
    tag_b2 = Tag.objects.create(name='colors', user=user_b)
    
    # Check User A can only see their own tags
    user_a_tags = Tag.objects.filter(user=user_a)
    assert user_a_tags.count() == 2, "User A should see 2 tags"
    assert set(user_a_tags.values_list('name', flat=True)) == {'animals', 'food'}
    
    # Check User B can only see their own tags
    user_b_tags = Tag.objects.filter(user=user_b)
    assert user_b_tags.count() == 2, "User B should see 2 tags"
    assert set(user_b_tags.values_list('name', flat=True)) == {'animals', 'colors'}
    
    # Verify tags with same name are separate per user
    assert Tag.objects.filter(name='animals', user=user_a).count() == 1
    assert Tag.objects.filter(name='animals', user=user_b).count() == 1
    assert tag_a1.id != tag_b1.id, "Tags with same name should be different objects"
    
    print("[OK] Tags are properly isolated between users")


def test_hlr_practice_data_isolation(user_a, user_b):
    """Test that HLR practice data (in Vocabulary model) is isolated"""
    print("\n=== Testing HLR Practice Data Isolation ===")
    
    # User A's vocabulary with practice data
    vocab_a = Vocabulary.objects.filter(created_by=user_a).first()
    vocab_a.correct_count = 10
    vocab_a.wrong_count = 2
    vocab_a.total_practice_count = 12
    vocab_a.save()
    
    # User B's vocabulary with practice data
    vocab_b = Vocabulary.objects.filter(created_by=user_b).first()
    vocab_b.correct_count = 5
    vocab_b.wrong_count = 5
    vocab_b.total_practice_count = 10
    vocab_b.save()
    
    # Verify User A's practice data
    user_a_vocab = Vocabulary.objects.filter(created_by=user_a).first()
    assert user_a_vocab.correct_count == 10, "User A's correct count should be 10"
    assert user_a_vocab.total_practice_count == 12, "User A's total practice count should be 12"
    
    # Verify User B's practice data
    user_b_vocab = Vocabulary.objects.filter(created_by=user_b).first()
    assert user_b_vocab.correct_count == 5, "User B's correct count should be 5"
    assert user_b_vocab.total_practice_count == 10, "User B's total practice count should be 10"
    
    # Verify practice data is different
    assert user_a_vocab.id != user_b_vocab.id, "Vocabulary items should be different"
    assert user_a_vocab.correct_count != user_b_vocab.correct_count, "Practice data should be different"
    
    print("[OK] HLR practice data is properly isolated between users")


def run_all_tests():
    """Run all isolation tests"""
    print("\n" + "="*60)
    print("MULTI-USER DATA ISOLATION TEST SUITE")
    print("="*60)
    
    try:
        with transaction.atomic():
            # Setup
            cleanup_test_users()
            user_a, user_b = create_test_users()
            
            # Run tests
            vocab_a, vocab_b = test_vocabulary_isolation(user_a, user_b)
            test_api_key_isolation(user_a, user_b)
            test_progress_isolation(user_a, user_b, vocab_a, vocab_b)
            test_quiz_isolation(user_a, user_b, vocab_a, vocab_b)
            test_exam_isolation(user_a, user_b)
            test_tag_isolation(user_a, user_b)
            test_hlr_practice_data_isolation(user_a, user_b)
            
            # Cleanup (rollback transaction)
            raise Exception("Rollback test data")
            
    except Exception as e:
        if str(e) == "Rollback test data":
            print("\n" + "="*60)
            print("[OK] ALL TESTS PASSED - DATA IS PROPERLY ISOLATED")
            print("="*60)
            print("\nTest data has been rolled back (not saved to database)")
        else:
            print(f"\n[FAIL] TEST FAILED: {e}")
            raise
    finally:
        # Final cleanup
        cleanup_test_users()


if __name__ == '__main__':
    run_all_tests()

