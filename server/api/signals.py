import os
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import Podcast

@receiver(post_delete, sender=Podcast)
def delete_podcast_file(sender, instance, **kwargs):
    """
    Deletes the audio file from the filesystem when the Podcast object is deleted.
    """
    if instance.audio_file:
        if os.path.isfile(instance.audio_file.path):
            os.remove(instance.audio_file.path)
