import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';

class GrammarExample {
  final String german;
  final String english;

  GrammarExample({required this.german, required this.english});

  factory GrammarExample.fromJson(Map<String, dynamic> json) {
    return GrammarExample(
      german: json['german'] ?? '',
      english: json['english'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {'german': german, 'english': english};
}

class GrammarTopic {
  final int id;
  final String title;
  final String level;
  final String category;
  final String content;
  final List<GrammarExample> examples;
  final String? estimatedReadTime;

  GrammarTopic({
    required this.id,
    required this.title,
    required this.level,
    required this.category,
    required this.content,
    required this.examples,
    this.estimatedReadTime,
  });

  factory GrammarTopic.fromJson(Map<String, dynamic> json) {
    return GrammarTopic(
      id: json['id'] ?? 0,
      title: json['title'] ?? '',
      level: json['level'] ?? 'A1',
      category: json['category'] ?? 'uncategorized',
      content: json['content'] ?? '',
      examples:
          (json['examples'] as List?)
              ?.map((e) => GrammarExample.fromJson(e))
              .toList() ??
          [],
      estimatedReadTime: json['estimated_read_time'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'level': level,
    'category': category,
    'content': content,
    'examples': examples.map((e) => e.toJson()).toList(),
  };
}

class GrammarState {
  final List<GrammarTopic> topics;
  final bool isLoading;
  final String? error;

  GrammarState({this.topics = const [], this.isLoading = false, this.error});

  GrammarState copyWith({
    List<GrammarTopic>? topics,
    bool? isLoading,
    String? error,
  }) {
    return GrammarState(
      topics: topics ?? this.topics,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class GrammarNotifier extends StateNotifier<GrammarState> {
  final ApiClient _apiClient;

  GrammarNotifier(this._apiClient) : super(GrammarState());

  Future<void> fetchTopics() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.get('grammar/');
      final responseData = response.data;
      final List data = responseData is List
          ? responseData
          : (responseData['results'] ?? []);
      final topics = data.map((item) => GrammarTopic.fromJson(item)).toList();
      state = state.copyWith(topics: topics, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<GrammarTopic?> generateTopic({
    required String title,
    required String level,
    String? context,
  }) async {
    // We don't set global loading here to avoid blocking the whole UI if desired,
    // but the generator screen will handle its own local state.
    try {
      final response = await _apiClient.post(
        'grammar/generate/',
        data: {'title': title, 'level': level, 'context_note': context},
      );

      final responseData = response.data;
      if (responseData['id'] != null) {
        final topic = GrammarTopic.fromJson(responseData);
        // Add to local state if not already there
        if (!state.topics.any((t) => t.id == topic.id)) {
          state = state.copyWith(topics: [topic, ...state.topics]);
        }
        return topic;
      } else if (responseData['success'] == true) {
        return GrammarTopic.fromJson(responseData['data']);
      }
      return null;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> saveTopic(GrammarTopic topic) async {
    try {
      final response = await _apiClient.post('grammar/', data: topic.toJson());
      final savedTopic = GrammarTopic.fromJson(response.data);
      state = state.copyWith(topics: [savedTopic, ...state.topics]);
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateTopic(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiClient.put('grammar/$id/', data: data);
      final updatedTopic = GrammarTopic.fromJson(response.data);
      state = state.copyWith(
        topics: state.topics.map((t) => t.id == id ? updatedTopic : t).toList(),
      );
    } catch (e) {
      rethrow;
    }
  }

  Future<void> deleteTopic(int id) async {
    try {
      await _apiClient.delete('grammar/$id/');
      state = state.copyWith(
        topics: state.topics.where((t) => t.id != id).toList(),
      );
    } catch (e) {
      rethrow;
    }
  }
}

final grammarProvider = StateNotifierProvider<GrammarNotifier, GrammarState>((
  ref,
) {
  final apiClient = ref.watch(apiClientProvider);
  return GrammarNotifier(apiClient);
});
