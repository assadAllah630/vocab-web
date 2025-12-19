import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import 'dart:async';

class DialogueState {
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? generatedContent;
  final Map<String, dynamic>? currentDialogue;

  DialogueState({
    this.isLoading = false,
    this.error,
    this.generatedContent,
    this.currentDialogue,
  });

  DialogueState copyWith({
    bool? isLoading,
    String? error,
    Map<String, dynamic>? generatedContent,
    Map<String, dynamic>? currentDialogue,
  }) {
    return DialogueState(
      isLoading: isLoading ?? this.isLoading,
      error: error, // Nullable update
      generatedContent: generatedContent ?? this.generatedContent,
      currentDialogue: currentDialogue ?? this.currentDialogue,
    );
  }
}

class DialogueNotifier extends StateNotifier<DialogueState> {
  final ApiClient _apiClient = ApiClient();

  DialogueNotifier() : super(DialogueState());

  Future<void> generateDialogue({
    required String scenario,
    required String tone,
    required List<Map<String, String>> speakers,
    required String level,
    required int wordCount,
    String? instructorNotes,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'dialogue',
          'topic': scenario, // Backend often calls the main topic field 'topic'
          'scenario': scenario,
          'student_level': level,
          'tone': tone,
          'speakers': speakers,
          'word_count': wordCount,
          'instructor_notes': instructorNotes,
        },
      );

      state = state.copyWith(isLoading: false, generatedContent: response.data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchDialogue(String id) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _apiClient.get('ai/generated-content/$id/');
      state = state.copyWith(isLoading: false, currentDialogue: response.data);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final dialogueProvider = StateNotifierProvider<DialogueNotifier, DialogueState>(
  (ref) {
    return DialogueNotifier();
  },
);
