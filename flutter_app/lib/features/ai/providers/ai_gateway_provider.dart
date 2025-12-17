import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

// Models
class AIDashboard {
  final Map<String, dynamic> summary;
  final Map<String, dynamic>? quotaStatus;
  final Map<String, dynamic>? resetTimes;
  final AIModelsData? models;
  final List<dynamic>? blockedKeys;
  final List<dynamic>? blockedModels;

  AIDashboard({
    required this.summary,
    this.quotaStatus,
    this.resetTimes,
    this.models,
    this.blockedKeys,
    this.blockedModels,
  });

  factory AIDashboard.fromJson(Map<String, dynamic> json) {
    return AIDashboard(
      summary: json['summary'] ?? {},
      quotaStatus: json['quota_status'],
      resetTimes: json['reset_times'],
      models: json['models'] != null
          ? AIModelsData.fromJson(json['models'])
          : null,
      blockedKeys: json['blocked_keys'],
      blockedModels: json['blocked_models'],
    );
  }
}

class AIModelsData {
  final int healthy;
  final int degraded;
  final List<dynamic>? blockedList;
  final List<dynamic> topModels;

  AIModelsData({
    required this.healthy,
    required this.degraded,
    this.blockedList,
    required this.topModels,
  });

  factory AIModelsData.fromJson(Map<String, dynamic> json) {
    return AIModelsData(
      healthy: json['healthy'] ?? 0,
      degraded: json['degraded'] ?? 0,
      blockedList: json['blocked_list'],
      topModels: json['top_models'] ?? [],
    );
  }
}

class AIProvider {
  final String id;
  final String name;

  AIProvider({required this.id, required this.name});

  factory AIProvider.fromJson(Map<String, dynamic> json) {
    return AIProvider(id: json['id'], name: json['name']);
  }
}

class AIKey {
  final int id;
  final String provider;
  final String? nickname;
  final int healthScore;
  final bool isBlocked;
  final String? blockReason;
  final String? blockUntil;
  final int requestsToday;
  final int dailyQuota;
  final int avgLatencyMs;

  AIKey({
    required this.id,
    required this.provider,
    this.nickname,
    required this.healthScore,
    required this.isBlocked,
    this.blockReason,
    this.blockUntil,
    required this.requestsToday,
    required this.dailyQuota,
    required this.avgLatencyMs,
  });

  factory AIKey.fromJson(Map<String, dynamic> json) {
    return AIKey(
      id: json['id'],
      provider: json['provider'],
      nickname: json['nickname'],
      healthScore: json['health_score'] ?? 100,
      isBlocked: json['is_blocked'] ?? false,
      blockReason: json['block_reason'],
      blockUntil: json['block_until'],
      requestsToday: json['requests_today'] ?? 0,
      dailyQuota: json['daily_quota'] ?? 0,
      avgLatencyMs: json['avg_latency_ms'] ?? 0,
    );
  }
}

// State
class AIGatewayState {
  final bool isLoading;
  final String? error;
  final AIDashboard? dashboard;
  final List<AIProvider> providers;
  final List<AIKey> keys;

  AIGatewayState({
    this.isLoading = false,
    this.error,
    this.dashboard,
    this.providers = const [],
    this.keys = const [],
  });

  AIGatewayState copyWith({
    bool? isLoading,
    String? error,
    AIDashboard? dashboard,
    List<AIProvider>? providers,
    List<AIKey>? keys,
  }) {
    return AIGatewayState(
      isLoading: isLoading ?? this.isLoading,
      error: error, // Nullable override
      dashboard: dashboard ?? this.dashboard,
      providers: providers ?? this.providers,
      keys: keys ?? this.keys,
    );
  }
}

// Notifier
class AIGatewayNotifier extends StateNotifier<AIGatewayState> {
  final ApiClient _apiClient;

  AIGatewayNotifier(this._apiClient) : super(AIGatewayState());

  Future<void> loadData({bool isBackground = false}) async {
    if (!isBackground) state = state.copyWith(isLoading: true, error: null);

    try {
      final dashboardRes = await _apiClient.get('/ai-gateway/dashboard/');
      final providersRes = await _apiClient.get('/ai-gateway/providers/');
      final keysRes = await _apiClient.get('/ai-gateway/keys/');

      final dashboard = AIDashboard.fromJson(dashboardRes.data);

      final providersList = (providersRes.data['providers'] as List)
          .map((e) => AIProvider.fromJson(e))
          .toList();

      final keysList = (keysRes.data['keys'] as List)
          .map((e) => AIKey.fromJson(e))
          .toList();

      state = state.copyWith(
        isLoading: false,
        dashboard: dashboard,
        providers: providersList,
        keys: keysList,
      );
    } catch (e) {
      if (!isBackground) {
        state = state.copyWith(isLoading: false, error: e.toString());
      }
    }
  }

  Future<void> addKey(Map<String, dynamic> keyData) async {
    try {
      await _apiClient.post('/ai-gateway/keys/', data: keyData);
      await loadData(isBackground: true);
    } catch (e) {
      throw e; // Let UI handle specific toast/alert
    }
  }

  Future<Map<String, dynamic>> testKey(int keyId) async {
    try {
      final res = await _apiClient.post('/ai-gateway/keys/$keyId/test/');
      await loadData(isBackground: true);
      return res.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteKey(int keyId) async {
    try {
      await _apiClient.delete('/ai-gateway/keys/$keyId/');
      await loadData(isBackground: true);
    } catch (e) {
      rethrow;
    }
  }
}

// Provider
final aiGatewayProvider =
    StateNotifierProvider<AIGatewayNotifier, AIGatewayState>((ref) {
      final apiClient = ref.watch(apiClientProvider);
      return AIGatewayNotifier(apiClient);
    });
