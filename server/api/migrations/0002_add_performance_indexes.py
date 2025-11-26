# Generated manually for adding performance indexes

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),  # Update this to your latest migration
    ]

    operations = [
        # Add indexes to Vocabulary model
        migrations.AddIndex(
            model_name='vocabulary',
            index=models.Index(fields=['is_public'], name='api_vocab_is_public_idx'),
        ),
        migrations.AddIndex(
            model_name='vocabulary',
            index=models.Index(fields=['created_at'], name='api_vocab_created_at_idx'),
        ),
        
        # Add indexes to Exam model
        migrations.AddIndex(
            model_name='exam',
            index=models.Index(fields=['is_public'], name='api_exam_is_public_idx'),
        ),
        migrations.AddIndex(
            model_name='exam',
            index=models.Index(fields=['user'], name='api_exam_user_idx'),
        ),
        
        # Add indexes to Quiz model
        migrations.AddIndex(
            model_name='quiz',
            index=models.Index(fields=['user'], name='api_quiz_user_idx'),
        ),
        migrations.AddIndex(
            model_name='quiz',
            index=models.Index(fields=['timestamp'], name='api_quiz_timestamp_idx'),
        ),
        
        # Add indexes to GrammarTopic model
        migrations.AddIndex(
            model_name='grammartopic',
            index=models.Index(fields=['level'], name='api_grammar_level_idx'),
        ),
        migrations.AddIndex(
            model_name='grammartopic',
            index=models.Index(fields=['category'], name='api_grammar_category_idx'),
        ),
        
        # Add unique constraint to Tag model
        migrations.AddConstraint(
            model_name='tag',
            constraint=models.UniqueConstraint(
                fields=['name', 'user'],
                name='unique_tag_per_user'
            ),
        ),
    ]
