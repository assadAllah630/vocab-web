
import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from celery import shared_task

from api.models import ExternalPodcastSubscription, ExternalEpisode
from .feed_parser import RSSFeedService

logger = logging.getLogger(__name__)
User = get_user_model()

@shared_task
def check_new_episodes_and_notify():
    """
    Daily task to:
    1. Sync subscribed podcasts.
    2. Check for new episodes (last 24h).
    3. Send digest email to each user.
    """
    logger.info("Starting daily podcast digest...")
    
    # Get all users with subscriptions
    # We could optimize this by querying users who have subs, but simple iteration is fine for now
    users = User.objects.filter(external_podcast_subscriptions__isnull=False).distinct()
    
    count_sent = 0
    
    for user in users:
        try:
            subscriptions = ExternalPodcastSubscription.objects.filter(user=user)
            if not subscriptions.exists():
                continue
                
            new_episodes = []
            
            # Time window: Last 24 hours
            yesterday = timezone.now() - timedelta(days=1)
            
            logger.info(f"Checking updates for user {user.username} ({subscriptions.count()} subs)")
            
            for sub in subscriptions:
                podcast = sub.podcast
                
                # 1. Sync Feed (Force check)
                try:
                    RSSFeedService.parse_feed(podcast.feed_url)
                except Exception as e:
                    logger.error(f"Failed to sync feed for {podcast.name}: {e}")
                    continue
                
                # 2. Check for fresh episodes
                # We filter by 'published_at' since yesterday
                # And ensure we link them to local DB if needed (RSSFeedService does this)
                recent = ExternalEpisode.objects.filter(
                    podcast=podcast,
                    published_at__gte=yesterday
                ).order_by('-published_at')
                
                for ep in recent:
                    new_episodes.append({
                        'podcast': podcast.name,
                        'title': ep.title,
                        'link': f"{settings.FRONTEND_URL}/m/podcast/{podcast.id}/episode/{ep.id}" if hasattr(settings, 'FRONTEND_URL') else f"http://localhost:5173/m/podcast/{podcast.id}/episode/{ep.id}",
                        'duration': ep.duration_formatted
                    })
            
            # 3. Send Email if there's news
            if new_episodes:
                send_digest_email(user, new_episodes)
                count_sent += 1
                
        except Exception as u_err:
            logger.error(f"Error processing user {user.username}: {u_err}")
            continue
            
    logger.info(f"Daily digest completed. Sent {count_sent} emails.")
    return f"Sent {count_sent} emails"


def send_digest_email(user, episodes):
    """Formats and sends the HTML email."""
    subject = f"🎙️ You have {len(episodes)} new episodes!"
    
    # Simple HTML Template
    html_list = ""
    for ep in episodes:
        html_list += f"""
        <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">{ep['podcast']}</div>
            <div style="font-size: 16px; font-weight: bold; margin: 4px 0;">
                <a href="{ep['link']}" style="color: #2563eb; text-decoration: none;">{ep['title']}</a>
            </div>
            <div style="font-size: 12px; color: #888;">⏱️ {ep['duration']}</div>
        </div>
        """
        
    html_content = f"""
    <html>
    <body style="font-family: sans-serif; color: #333; line-height: 1.5;">
        <h2>Good Morning, {user.username}! ☀️</h2>
        <p>Here are the latest episodes from your podcasts:</p>
        
        <div style="background: #fdfdfd; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            {html_list}
        </div>
        
        <p style="margin-top: 20px; color: #888; font-size: 12px;">
            Keep practicing! <a href="{settings.FRONTEND_URL}/m/podcast-studio">Open Podcast Studio</a>
        </p>
    </body>
    </html>
    """
    
    if not user.email:
        logger.warning(f"User {user.username} has no email address. Skipping.")
        return

    try:
        send_mail(
            subject=subject,
            message="Please enable HTML emails to view your digest.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_content,
            fail_silently=False
        )
        logger.info(f"Sent email to {user.email}")
    except Exception as e:
        logger.error(f"Failed to send email to {user.email}: {e}")
