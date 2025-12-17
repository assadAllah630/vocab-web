import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';

// --- Data Models ---

class LibraryItem {
  final String id;
  final String title;
  final String type; // 'story', 'dialogue', 'article'
  final DateTime createdAt;
  final String? level;
  final String? topic;
  final Map<String, dynamic> content;

  LibraryItem({
    required this.id,
    required this.title,
    required this.type,
    required this.createdAt,
    this.level,
    this.topic,
    required this.content,
  });

  factory LibraryItem.fromJson(Map<String, dynamic> json) {
    return LibraryItem(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? 'Untitled',
      type: json['type'] ?? 'story',
      createdAt: DateTime.tryParse(json['created_at'] ?? '') ?? DateTime.now(),
      level: json['level'],
      topic: json['topic'],
      content: json['content'] ?? {},
    );
  }
}

class LibraryState {
  final bool isLoading;
  final String? error;
  final List<LibraryItem> stories;
  final List<LibraryItem> dialogues;
  final List<LibraryItem> articles;

  LibraryState({
    this.isLoading = false,
    this.error,
    this.stories = const [],
    this.dialogues = const [],
    this.articles = const [],
  });

  LibraryState copyWith({
    bool? isLoading,
    String? error,
    List<LibraryItem>? stories,
    List<LibraryItem>? dialogues,
    List<LibraryItem>? articles,
  }) {
    return LibraryState(
      isLoading: isLoading ?? this.isLoading,
      error: error, // Nullable update
      stories: stories ?? this.stories,
      dialogues: dialogues ?? this.dialogues,
      articles: articles ?? this.articles,
    );
  }
}

// --- Provider ---

final libraryProvider = StateNotifierProvider<LibraryNotifier, LibraryState>((
  ref,
) {
  return LibraryNotifier(ref.watch(apiClientProvider));
});

class LibraryNotifier extends StateNotifier<LibraryState> {
  // ignore: unused_field
  final ApiClient _apiClient;

  LibraryNotifier(this._apiClient) : super(LibraryState());

  Future<void> logData() async {
    print(
      "Library Loaded Items: ${state.stories.length} stories, ${state.dialogues.length} dialogues",
    );
  }

  Future<void> fetchLibrary() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      // TODO: Replace with real API calls when backend is ready
      // final response = await _apiClient.get('/library/all');

      // Simulate network delay
      await Future.delayed(const Duration(milliseconds: 1000));

      // Mock Data
      final stories = [
        LibraryItem(
          id: '1',
          title: 'The Lost Key',
          type: 'story',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
          level: 'B1',
          content: {
            'chapters': [
              {
                'title': 'The Discovery',
                'content':
                    'One day, **John** found a mysterious key on the floor.',
                'translation':
                    'Eines Tages fand John einen mysteriösen Schlüssel auf dem Boden.',
              },
              {
                'title': 'The Door',
                'content':
                    'He tried to open the **ancient** door. It creaked loudly.',
                'translation':
                    'Er versuchte, die alte Tür zu öffnen. Sie knarrte laut.',
              },
            ],
            'vocabulary': ['Mysterious', 'Ancient', 'Key'],
          },
        ),
        LibraryItem(
          id: '2',
          title: 'A Day in Berlin',
          type: 'story',
          createdAt: DateTime.now().subtract(const Duration(days: 3)),
          level: 'A2',
          content: {
            'chapters': [
              {
                'title': 'Arrival',
                'content':
                    'The train arrived at **noon**. The station was busy.',
              },
            ],
            'vocabulary': ['Station', 'Noon'],
          },
        ),
      ];

      final dialogues = [
        LibraryItem(
          id: '3',
          title: 'Ordering Coffee',
          type: 'dialogue',
          createdAt: DateTime.now().subtract(const Duration(hours: 5)),
          level: 'A1',
          content: {
            'messages': [
              {
                'speaker': 'Barista',
                'text': 'Hello! What can I get for you?',
                'translation': 'Hallo! Was kann ich Ihnen bringen?',
              },
              {
                'speaker': 'You',
                'text': 'I would like a cappuccino, please.',
                'translation': 'Ich hätte gerne einen Cappuccino, bitte.',
              },
              {
                'speaker': 'Barista',
                'text': 'Anything else?',
                'translation': 'Sonst noch etwas?',
              },
            ],
            'vocabulary': ['Cappuccino', 'Please'],
          },
        ),
      ];

      final articles = [
        LibraryItem(
          id: '4',
          title: 'Benefits of Exercise',
          type: 'article',
          createdAt: DateTime.now().subtract(const Duration(days: 10)),
          level: 'B2',
          content: {
            'sections': [
              {
                'heading': 'Physical Health',
                'content': 'Exercise improves **cardiovascular** health.',
                'translation':
                    'Training verbessert die Herz-Kreislauf-Gesundheit.',
              },
              {
                'heading': 'Mental Health',
                'content': 'It also reduces **stress** levels.',
                'translation': 'Es reduziert auch Stresslevel.',
              },
            ],
            'vocabulary': ['Cardiovascular', 'Stress'],
          },
        ),
      ];

      state = state.copyWith(
        isLoading: false,
        stories: stories,
        dialogues: dialogues,
        articles: articles,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // Helper to find item by ID for viewers
  LibraryItem? getItem(String id) {
    try {
      return [
        ...state.stories,
        ...state.dialogues,
        ...state.articles,
      ].firstWhere((item) => item.id == id);
    } catch (e) {
      return null;
    }
  }
}
