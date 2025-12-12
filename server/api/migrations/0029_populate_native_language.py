# Generated data migration for native_language population

from django.db import migrations


def populate_native_language_from_profiles(apps, schema_editor):
    """
    Populate native_language for all existing records from user profiles.
    Sets each record's native_language to match the user's current native_language.
    """
    UserProfile = apps.get_model('api', 'UserProfile')
    Vocabulary = apps.get_model('api', 'Vocabulary')
    Exam = apps.get_model('api', 'Exam')
    GrammarTopic = apps.get_model('api', 'GrammarTopic')
    SavedText = apps.get_model('api', 'SavedText')
    GeneratedContent = apps.get_model('api', 'GeneratedContent')
    
    # Build a lookup of user_id -> native_language
    user_native_langs = {}
    for profile in UserProfile.objects.all():
        user_native_langs[profile.user_id] = profile.native_language
    
    # Update Vocabulary
    for vocab in Vocabulary.objects.all():
        native_lang = user_native_langs.get(vocab.created_by_id, 'en')
        if vocab.native_language != native_lang:
            Vocabulary.objects.filter(pk=vocab.pk).update(native_language=native_lang)
    
    # Update Exam
    for exam in Exam.objects.all():
        native_lang = user_native_langs.get(exam.user_id, 'en')
        if exam.native_language != native_lang:
            Exam.objects.filter(pk=exam.pk).update(native_language=native_lang)
    
    # Update GrammarTopic (may have null created_by)
    for topic in GrammarTopic.objects.all():
        if topic.created_by_id:
            native_lang = user_native_langs.get(topic.created_by_id, 'en')
            if topic.native_language != native_lang:
                GrammarTopic.objects.filter(pk=topic.pk).update(native_language=native_lang)
    
    # Update SavedText
    for text in SavedText.objects.all():
        native_lang = user_native_langs.get(text.user_id, 'en')
        if text.native_language != native_lang:
            SavedText.objects.filter(pk=text.pk).update(native_language=native_lang)
    
    # Update GeneratedContent
    for content in GeneratedContent.objects.all():
        native_lang = user_native_langs.get(content.user_id, 'en')
        if content.native_language != native_lang:
            GeneratedContent.objects.filter(pk=content.pk).update(native_language=native_lang)


def reverse_migration(apps, schema_editor):
    """Reverse: just reset all to 'en' (default)"""
    pass  # No-op since the field will be removed anyway on reverse


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0028_add_native_language_to_models'),
    ]

    operations = [
        migrations.RunPython(
            populate_native_language_from_profiles,
            reverse_code=reverse_migration,
        ),
    ]
