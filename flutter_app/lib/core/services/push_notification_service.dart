import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';

/// Push Notification Service using Firebase Cloud Messaging
class PushNotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final ApiClient _apiClient;

  PushNotificationService(this._apiClient);

  /// Initialize push notifications
  Future<void> initialize() async {
    // Request permission (iOS and web)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Push notifications authorized');
      await _registerToken();
      _setupMessageHandlers();
    } else if (settings.authorizationStatus ==
        AuthorizationStatus.provisional) {
      print('⚠️ Push notifications provisional');
      await _registerToken();
      _setupMessageHandlers();
    } else {
      print('❌ Push notifications denied');
    }
  }

  /// Get and register FCM token with backend
  Future<void> _registerToken() async {
    try {
      String? token = await _messaging.getToken();
      if (token != null) {
        print('📱 FCM Token: ${token.substring(0, 20)}...');

        // Register token with backend
        await _apiClient.post(
          'notifications/register-device/',
          data: {'token': token, 'platform': 'android'},
        );
        print('✅ FCM token registered with backend');
      }
    } catch (e) {
      print('❌ Failed to register FCM token: $e');
    }

    // Listen for token refresh
    _messaging.onTokenRefresh.listen((newToken) async {
      try {
        await _apiClient.post(
          'notifications/register-device/',
          data: {'token': newToken, 'platform': 'android'},
        );
      } catch (e) {
        print('❌ Failed to update FCM token: $e');
      }
    });
  }

  /// Set up handlers for incoming messages
  void _setupMessageHandlers() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('📬 Foreground message: ${message.notification?.title}');
      _handleMessage(message);
    });

    // Handle background message taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('📬 Message opened app: ${message.notification?.title}');
      _handleMessageTap(message);
    });
  }

  /// Handle incoming message (show notification)
  void _handleMessage(RemoteMessage message) {
    // You can show a local notification here using flutter_local_notifications
    // For now, just log the message
    print('Title: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
    print('Data: ${message.data}');
  }

  /// Handle message tap (navigate to relevant screen)
  void _handleMessageTap(RemoteMessage message) {
    // Navigate based on message data
    final data = message.data;
    if (data['type'] == 'vocab_reminder') {
      // TODO: Navigate to vocab screen
    } else if (data['type'] == 'new_content') {
      // TODO: Navigate to library
    }
  }

  /// Get current FCM token
  Future<String?> getToken() async {
    return await _messaging.getToken();
  }

  /// Subscribe to a topic
  Future<void> subscribeToTopic(String topic) async {
    await _messaging.subscribeToTopic(topic);
  }

  /// Unsubscribe from a topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _messaging.unsubscribeFromTopic(topic);
  }
}

/// Provider for PushNotificationService
final pushNotificationServiceProvider = Provider<PushNotificationService>((
  ref,
) {
  final apiClient = ref.watch(apiClientProvider);
  return PushNotificationService(apiClient);
});
