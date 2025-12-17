import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

// --- Data Models ---

class ReadingContent {
  final String id;
  final String title;
  final String content;
  final String source; // 'text', 'url', 'youtube', 'file'
  final DateTime createdAt;

  ReadingContent({
    required this.id,
    required this.title,
    required this.content,
    required this.source,
    required this.createdAt,
  });
}

class ReaderState {
  final bool isLoading;
  final String? error;
  final ReadingContent? currentContent;
  final List<ReadingContent> recentReadings;

  ReaderState({
    this.isLoading = false,
    this.error,
    this.currentContent,
    this.recentReadings = const [],
  });

  ReaderState copyWith({
    bool? isLoading,
    String? error,
    ReadingContent? currentContent,
    List<ReadingContent>? recentReadings,
  }) {
    return ReaderState(
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentContent: currentContent ?? this.currentContent,
      recentReadings: recentReadings ?? this.recentReadings,
    );
  }
}

// --- Provider ---

final readerProvider = StateNotifierProvider<ReaderNotifier, ReaderState>((
  ref,
) {
  return ReaderNotifier(ref.watch(apiClientProvider));
});

class ReaderNotifier extends StateNotifier<ReaderState> {
  // ignore: unused_field
  final ApiClient _apiClient;

  ReaderNotifier(this._apiClient) : super(ReaderState());

  Future<void> importText(String text, {String title = 'Pasted Text'}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'analyze-text/',
        data: {'text': text, 'title': title},
      );

      // Assuming backend returns the processed content object
      final newContent = ReadingContent(
        id: response.data['id'].toString(),
        title: response.data['title'] ?? title,
        content: response.data['content'] ?? text,
        source: 'text',
        createdAt: DateTime.now(),
      );

      state = state.copyWith(
        isLoading: false,
        currentContent: newContent,
        recentReadings: [newContent, ...state.recentReadings],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> importUrl(String url) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'extract-content/',
        data: {'url': url},
      );

      final newContent = ReadingContent(
        id: DateTime.now().millisecondsSinceEpoch
            .toString(), // or from response
        title: response.data['title'] ?? 'Article from Url',
        content: response.data['content'] ?? '',
        source: 'url',
        createdAt: DateTime.now(),
      );

      state = state.copyWith(
        isLoading: false,
        currentContent: newContent,
        recentReadings: [newContent, ...state.recentReadings],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> importYoutube(String url) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'extract-youtube/',
        data: {'url': url},
      );

      final newContent = ReadingContent(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: response.data['title'] ?? 'YouTube Transcript',
        content: response.data['transcript'] ?? '',
        source: 'youtube',
        createdAt: DateTime.now(),
      );

      state = state.copyWith(
        isLoading: false,
        currentContent: newContent,
        recentReadings: [newContent, ...state.recentReadings],
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> importFile() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // For file upload, we'd need a File picker first in UI, then pass path here.
      // Keeping mock/placeholder as "Not fully implemented" but API mapped.
      // await _apiClient.post('extract-file/', data: formData);
      throw UnimplementedError("File upload needs UI picker integration");
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void openRecent(ReadingContent content) {
    state = state.copyWith(currentContent: content);
  }
}
