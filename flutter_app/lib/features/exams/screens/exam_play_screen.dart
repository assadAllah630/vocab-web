import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:circular_countdown_timer/circular_countdown_timer.dart';
import '../providers/exam_provider.dart';

class ExamPlayScreen extends ConsumerStatefulWidget {
  final String examId;
  const ExamPlayScreen({super.key, required this.examId});

  @override
  ConsumerState<ExamPlayScreen> createState() => _ExamPlayScreenState();
}

class _ExamPlayScreenState extends ConsumerState<ExamPlayScreen> {
  final CountDownController _controller = CountDownController();

  @override
  void initState() {
    super.initState();
    // In real app, we check if exam is already active or fetch by ID
    Future.microtask(
      () => ref.read(examProvider.notifier).startExam(widget.examId),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(examProvider);
    final exam = state.activeExam;

    if (exam == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final question = exam.questions[state.currentQuestionIndex];
    final selectedOption = state.answers[question.id];

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.x, color: Colors.white),
          onPressed: () => _confirmExit(context),
        ),
        title: Text(
          exam.title,
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Timer & Progress
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Question ${state.currentQuestionIndex + 1}/${exam.questions.length}',
                  style: const TextStyle(
                    color: Color(0xFFA1A1AA),
                    fontSize: 16,
                  ),
                ),
                CircularCountDownTimer(
                  duration: exam.durationSeconds,
                  initialDuration: 0,
                  controller: _controller,
                  width: 40,
                  height: 40,
                  ringColor: const Color(0xFF27272A),
                  fillColor: const Color(0xFF8B5CF6),
                  backgroundColor: const Color(0xFF18181B),
                  strokeWidth: 4.0,
                  strokeCap: StrokeCap.round,
                  textStyle: const TextStyle(
                    fontSize: 12.0,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textFormat: CountdownTextFormat.S,
                  isReverse: true,
                  isReverseAnimation: true,
                  isTimerTextShown: true,
                  autoStart: true,
                  onComplete: () {
                    // Time's up logic
                    ScaffoldMessenger.of(
                      context,
                    ).showSnackBar(const SnackBar(content: Text("Time's up!")));
                  },
                ),
              ],
            ),

            const SizedBox(height: 40),

            // Question
            Text(
              question.text,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 40),

            // Options
            ...List.generate(question.options.length, (index) {
              final isSelected = selectedOption == index;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () => ref
                      .read(examProvider.notifier)
                      .answerQuestion(question.id, index),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF8B5CF6)
                          : const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? Colors.transparent
                            : const Color(0xFF27272A),
                      ),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            color: isSelected
                                ? Colors.white
                                : Colors.transparent,
                          ),
                          child: isSelected
                              ? const Center(
                                  child: Icon(
                                    Icons.check,
                                    size: 16,
                                    color: Color(0xFF8B5CF6),
                                  ),
                                )
                              : null,
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            question.options[index],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),

            const Spacer(),

            // Navigation
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (state.currentQuestionIndex > 0)
                  TextButton(
                    onPressed: () =>
                        ref.read(examProvider.notifier).prevQuestion(),
                    child: const Text(
                      'Previous',
                      style: TextStyle(color: Color(0xFFA1A1AA)),
                    ),
                  )
                else
                  const SizedBox(),

                if (state.currentQuestionIndex < exam.questions.length - 1)
                  ElevatedButton(
                    onPressed: () =>
                        ref.read(examProvider.notifier).nextQuestion(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF8B5CF6),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 12,
                      ),
                    ),
                    child: const Text(
                      'Next',
                      style: TextStyle(color: Colors.white),
                    ),
                  )
                else
                  ElevatedButton(
                    onPressed: () => _submitExam(context, ref),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 12,
                      ),
                    ),
                    child: const Text(
                      'Submit',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _confirmExit(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text('Quit Exam?', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Your progress will be lost.',
          style: TextStyle(color: Color(0xFFA1A1AA)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.pop();
            },
            child: const Text('Quit', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  void _submitExam(BuildContext context, WidgetRef ref) async {
    await ref.read(examProvider.notifier).submitExam();
    if (mounted) {
      // Show Result Dialog or Navigate
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF18181B),
          title: const Text(
            'Exam Completed! 🎉',
            style: TextStyle(color: Colors.white),
          ),
          content: const Text(
            'You scored 85% (Simulated). Well done!',
            style: TextStyle(color: Colors.white),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.pop(); // Exit to dashboard
              },
              child: const Text(
                'Finish',
                style: TextStyle(color: Color(0xFF8B5CF6)),
              ),
            ),
          ],
        ),
      );
    }
  }
}
