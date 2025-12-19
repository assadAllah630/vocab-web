import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'dart:async';
import 'dart:developer' as dev;

class StoryState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? generatedContent;
  final Map<String, dynamic>? currentStory;

  StoryState({
    this.isLoading = false,
    this.error,
    this.generatedContent,
    this.currentStory,
  });

  StoryState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? generatedContent,
    Map<String, dynamic>? currentStory,
  }) {
    return StoryState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      generatedContent: generatedContent ?? this.generatedContent,
      currentStory: currentStory ?? this.currentStory,
    );
  }
}

class StoryNotifier extends StateNotifier<StoryState> {
  final ApiClient _apiClient;
  Timer? _pollingTimer;

  StoryNotifier(this._apiClient) : super(StoryState());

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  void _stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> generateStory({
    required String genre,
    required String plotType,
    required String setting,
    required List<Map<String, String>> characters,
    required String level,
    required int wordCount,
    required bool generateImages,
    String? instructorNotes,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'story',
          'topic': setting,
          'student_level': level,
          'genre': genre,
          'plot_type': plotType,
          'characters': characters,
          'word_count': wordCount,
          'generate_images': generateImages,
          'instructor_notes': instructorNotes,
        },
      );

      final content = response.data;
      state = state.copyWith(isLoading: false, generatedContent: content);

      if (generateImages && content['id'] != null) {
        startPolling(content['id'].toString());
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void startPolling(String contentId) {
    _stopPolling();
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      try {
        final response = await _apiClient.get(
          'ai/generated-content/$contentId/images/status/',
        );
        final data = response.data;

        if (data['status'] != 'none' && data['content'] != null) {
          state = state.copyWith(
            generatedContent: state.generatedContent?.map((key, value) {
              if (key == 'content') return MapEntry(key, data['content']);
              return MapEntry(key, value);
            }),
            currentStory: state.currentStory?.map((key, value) {
              if (key == 'content_data') return MapEntry(key, data['content']);
              return MapEntry(key, value);
            }),
          );
        } else if (data['status'] == 'none') {
          timer.cancel();
        }
      } catch (e) {
        dev.log("Polling error: $e");
        timer.cancel();
      }
    });
  }

  Future<void> fetchStory(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.get('ai/generated-content/$id/');
      final data = response.data;
      state = state.copyWith(isLoading: false, currentStory: data);

      bool hasPending = false;
      if (data['content_data'] != null &&
          data['content_data']['events'] != null) {
        final events = data['content_data']['events'] as List;
        hasPending = events.any(
          (e) =>
              e is Map &&
              (e['image_status'] == 'pending' ||
                  e['image_status'] == 'generating'),
        );
      }

      if (hasPending) {
        startPolling(id);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final storyProvider = StateNotifierProvider<StoryNotifier, StoryState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return StoryNotifier(apiClient);
});
