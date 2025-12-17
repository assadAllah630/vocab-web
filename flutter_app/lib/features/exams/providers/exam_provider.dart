import 'package:flutter_riverpod/flutter_riverpod.dart';

class ExamQuestion {
  final String id;
  final String text;
  final List<String> options;
  final int correctOptionIndex;

  const ExamQuestion({
    required this.id,
    required this.text,
    required this.options,
    required this.correctOptionIndex,
  });
}

class Exam {
  final String id;
  final String title;
  final String description;
  final int durationSeconds;
  final List<ExamQuestion> questions;
  final DateTime createdAt;
  final int? score;

  const Exam({
    required this.id,
    required this.title,
    required this.description,
    required this.durationSeconds,
    required this.questions,
    required this.createdAt,
    this.score,
  });
}

class ExamState {
  final List<Exam> recentExams;
  final Exam? activeExam;
  final int currentQuestionIndex;
  final Map<String, int> answers; // questionId -> optionIndex
  final bool isSubmitting;

  ExamState({
    this.recentExams = const [],
    this.activeExam,
    this.currentQuestionIndex = 0,
    this.answers = const {},
    this.isSubmitting = false,
  });

  ExamState copyWith({
    List<Exam>? recentExams,
    Exam? activeExam,
    int? currentQuestionIndex,
    Map<String, int>? answers,
    bool? isSubmitting,
    bool clearActiveExam = false,
  }) {
    return ExamState(
      recentExams: recentExams ?? this.recentExams,
      activeExam: clearActiveExam ? null : (activeExam ?? this.activeExam),
      currentQuestionIndex: currentQuestionIndex ?? this.currentQuestionIndex,
      answers: answers ?? this.answers,
      isSubmitting: isSubmitting ?? this.isSubmitting,
    );
  }
}

final examProvider = StateNotifierProvider<ExamNotifier, ExamState>((ref) {
  return ExamNotifier();
});

class ExamNotifier extends StateNotifier<ExamState> {
  ExamNotifier() : super(ExamState(recentExams: _mockExams));

  void startExam(String examId) {
    // In real app, fetch exam details. Here we find from mock or create new.
    final exam = _mockExams.firstWhere(
      (e) => e.id == examId,
      orElse: () => _mockExams[0],
    );
    state = state.copyWith(
      activeExam: exam,
      currentQuestionIndex: 0,
      answers: {},
      isSubmitting: false,
    );
  }

  void answerQuestion(String questionId, int optionIndex) {
    final newAnswers = Map<String, int>.from(state.answers);
    newAnswers[questionId] = optionIndex;
    state = state.copyWith(answers: newAnswers);
  }

  void nextQuestion() {
    if (state.activeExam != null &&
        state.currentQuestionIndex < state.activeExam!.questions.length - 1) {
      state = state.copyWith(
        currentQuestionIndex: state.currentQuestionIndex + 1,
      );
    }
  }

  void prevQuestion() {
    if (state.currentQuestionIndex > 0) {
      state = state.copyWith(
        currentQuestionIndex: state.currentQuestionIndex - 1,
      );
    }
  }

  Future<void> submitExam() async {
    state = state.copyWith(isSubmitting: true);
    await Future.delayed(const Duration(seconds: 2)); // Simulate API
    // Calculate score logic could go here
    state = state.copyWith(
      isSubmitting: false,
      clearActiveExam: true,
    ); // End exam
  }

  static final List<Exam> _mockExams = [
    Exam(
      id: '1',
      title: 'German Basics A1',
      description: 'Test your knowledge of basic German greetings and verbs.',
      durationSeconds: 600,
      createdAt: DateTime.now().subtract(const Duration(days: 1)),
      score: 85,
      questions: _mockQuestions,
    ),
    Exam(
      id: '2',
      title: 'Advanced Vocabulary',
      description: 'Challenging words for business context.',
      durationSeconds: 900,
      createdAt: DateTime.now(),
      questions: _mockQuestions,
    ),
  ];

  static final List<ExamQuestion> _mockQuestions = [
    const ExamQuestion(
      id: 'q1',
      text: 'What is "Hello" in German?',
      options: ['Hallo', 'Tschuss', 'Danke', 'Bitte'],
      correctOptionIndex: 0,
    ),
    const ExamQuestion(
      id: 'q2',
      text: 'Which word means "Car"?',
      options: ['Haus', 'Auto', 'Katze', 'Hund'],
      correctOptionIndex: 1,
    ),
    const ExamQuestion(
      id: 'q3',
      text: 'Translate: "I am hungry"',
      options: [
        'Ich bin mude',
        'Ich habe Hunger',
        'Mir ist kalt',
        'Ich bin glucklich',
      ],
      correctOptionIndex: 1,
    ),
  ];
}
