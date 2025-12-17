import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/material.dart'; // For IconData
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/network/api_client.dart';

class NotificationItem {
  final String id;
  final String title;
  final String message;
  final DateTime time;
  final bool isRead;
  final String type; // 'achievement', 'podcast', 'streak', etc.

  NotificationItem({
    required this.id,
    required this.title,
    required this.message,
    required this.time,
    required this.isRead,
    required this.type,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'].toString(),
      title: json['title'] ?? 'Notification',
      message: json['message'] ?? '',
      time: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
      isRead: json['is_read'] ?? false,
      type: json['type'] ?? 'info',
    );
  }
}

// Helper to map type to Icon/Color
extension NotificationStyle on NotificationItem {
  IconData get icon {
    switch (type) {
      case 'achievement':
        return LucideIcons.trophy;
      case 'podcast':
        return LucideIcons.headphones;
      case 'streak':
        return LucideIcons.flame;
      case 'system':
        return LucideIcons.info;
      default:
        return LucideIcons.bell;
    }
  }

  Color get color {
    switch (type) {
      case 'achievement':
        return Colors.amber;
      case 'podcast':
        return const Color(0xFF8B5CF6);
      case 'streak':
        return Colors.orange;
      case 'system':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }
}

class NotificationsNotifier extends AsyncNotifier<List<NotificationItem>> {
  @override
  Future<List<NotificationItem>> build() async {
    return _fetchNotifications();
  }

  Future<List<NotificationItem>> _fetchNotifications() async {
    try {
      final response = await ApiClient().dio.post('notifications/list/');
      // Assuming response.data is List or { notifications: [] }
      final data = response.data;
      final List<dynamic> list =
          (data is Map && data.containsKey('notifications'))
          ? data['notifications']
          : (data is List ? data : []);

      return list.map((json) => NotificationItem.fromJson(json)).toList();
    } catch (e) {
      // Fallback to empty list or rethrow if strictly needed
      // For now, return empty to avoid breaking UI on 404/Error
      print('Error fetching notifications: $e');
      return [];
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchNotifications());
  }

  Future<void> markAllRead() async {
    try {
      await ApiClient().dio.post('notifications/mark-read/');
      // Optimistic update
      final current = state.value ?? [];
      state = AsyncValue.data(
        current
            .map(
              (n) => NotificationItem(
                id: n.id,
                title: n.title,
                message: n.message,
                time: n.time,
                isRead: true,
                type: n.type,
              ),
            )
            .toList(),
      );
    } catch (e) {
      print('Error marking read: $e');
    }
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<NotificationItem>>(() {
      return NotificationsNotifier();
    });
