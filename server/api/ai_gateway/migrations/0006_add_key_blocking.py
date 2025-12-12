from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ai_gateway', '0005_add_quota_reset_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='userapikey',
            name='block_reason',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='userapikey',
            name='block_until',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='userapikey',
            name='is_blocked',
            field=models.BooleanField(db_index=True, default=False),
        ),
    ]
