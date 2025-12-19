import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'dart:async';

class ArticleState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? generatedContent;
  final Map<String, dynamic>? currentArticle;

  ArticleState({
    this.isLoading = false,
    this.error,
    this.generatedContent,
    this.currentArticle,
  });

  ArticleState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? generatedContent,
    Map<String, dynamic>? currentArticle,
  }) {
    return ArticleState(
      isLoading: isLoading ?? this.isLoading,
      error: error, // Nullable update
      generatedContent: generatedContent ?? this.generatedContent,
      currentArticle: currentArticle ?? this.currentArticle,
    );
  }
}

class ArticleNotifier extends StateNotifier<ArticleState> {
  final ApiClient _apiClient = ApiClient();

  ArticleNotifier() : super(ArticleState());

  Future<void> generateArticle({
    required String topic,
    required String style,
    required String structure,
    required String level,
    required int wordCount,
    String? instructorNotes,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'article',
          'topic': topic,
          'student_level': level,
          'article_style': style,
          'structure_type': structure,
          'word_count': wordCount,
          'instructor_notes': instructorNotes,
        },
      );

      state = state.copyWith(isLoading: false, generatedContent: response.data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchArticle(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.get('ai/generated-content/$id/');
      state = state.copyWith(isLoading: false, currentArticle: response.data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final articleProvider = StateNotifierProvider<ArticleNotifier, ArticleState>((
  ref,
) {
  return ArticleNotifier();
});
