# Notifications Module Context

## Purpose
The **Notifications Module** delivers alerts to users via Firebase Cloud Messaging (FCM) for mobile and Web Push for browsers. It manages subscriptions and user preferences.

## Key Models
See `server/api/notification_models.py`.

- **PushSubscription**: Web Push endpoint storage.
  - `endpoint`, `p256dh_key`, `auth_key`.
- **NotificationPreferences**: User-specific settings.
  - Toggles: `daily_reminder`, `streak_warning`, `achievement`.
  - Quiet Hours: `quiet_start`, `quiet_end`.
- **NotificationLog**: History of all sent messages.
  - `delivered`, `clicked` for analytics.

## Core Features
1.  **FCM Registration**: `POST /api/notifications/register-fcm/` stores token on `UserProfile.fcm_token`.
2.  **Web Push**: `POST /api/notifications/subscribe/` for browser subscriptions.
3.  **Preferences**: `GET/PUT /api/notifications/preferences/`.
4.  **Inbox**: `GET /api/notifications/list/` fetches notification history.
5.  **Badge Count**: `GET /api/notifications/unread-count/`.

## Sending Notifications
Sending is abstracted. The actual push is handled by:
-   `firebase-admin` SDK for FCM (Mobile/Web).
-   `pywebpush` for legacy Web Push.

## Key Files
-   `server/api/notification_views.py`: Main view logic.
-   `server/api/notification_models.py`: Database schema for notifications.
