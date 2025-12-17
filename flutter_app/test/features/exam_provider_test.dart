import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_app/features/exams/providers/exam_provider.dart';

void main() {
  late ExamNotifier examNotifier;

  setUp(() {
    examNotifier = ExamNotifier();
  });

  group('ExamNotifier Tests', () {
    test('initial state should have recent exams but no active exam', () {
      expect(examNotifier.debugState.recentExams, isNotEmpty); // Uses mock data
      expect(examNotifier.debugState.activeExam, isNull);
      expect(examNotifier.debugState.currentQuestionIndex, 0);
    });

    test('startExam should set active exam and reset state', () {
      // Act
      examNotifier.startExam('1'); // existing mock ID

      // Assert
      expect(examNotifier.debugState.activeExam, isNotNull);
      expect(examNotifier.debugState.activeExam!.id, '1');
      expect(examNotifier.debugState.currentQuestionIndex, 0);
      expect(examNotifier.debugState.answers, isEmpty);
      expect(examNotifier.debugState.isSubmitting, false);
    });

    test('answerQuestion should update answers map', () {
      examNotifier.startExam('1');

      // Act
      examNotifier.answerQuestion('q1', 2);

      // Assert
      expect(examNotifier.debugState.answers['q1'], 2);
    });

    test('nextQuestion should increment index if available', () {
      examNotifier.startExam('1');
      // activeExam '1' has questions (mock data)
      final initialIndex = examNotifier.debugState.currentQuestionIndex;

      // Act
      examNotifier.nextQuestion();

      // Assert
      expect(examNotifier.debugState.currentQuestionIndex, initialIndex + 1);
    });

    test('prevQuestion should decrement index', () {
      examNotifier.startExam('1');
      examNotifier.nextQuestion(); // Go to 1
      expect(examNotifier.debugState.currentQuestionIndex, 1);

      // Act
      examNotifier.prevQuestion();

      // Assert
      expect(examNotifier.debugState.currentQuestionIndex, 0);
    });

    test('submitExam should clear active exam', () async {
      examNotifier.startExam('1');

      // Act
      await examNotifier.submitExam();

      // Assert
      expect(examNotifier.debugState.isSubmitting, false);
      expect(examNotifier.debugState.activeExam, isNull);
    });
  });
}
