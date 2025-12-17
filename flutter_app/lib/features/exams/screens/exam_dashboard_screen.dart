import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../providers/exam_provider.dart';

class ExamDashboardScreen extends ConsumerWidget {
  const ExamDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(examProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text(
          'Exams',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: Color(0xFF8B5CF6)),
            onPressed: () => context.push('/exams/create'),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: state.recentExams.length,
        itemBuilder: (context, index) {
          final exam = state.recentExams[index];
          return _ExamCard(exam: exam)
              .animate()
              .fadeIn(duration: 400.ms, delay: (index * 100).ms)
              .slideY(begin: 0.2, end: 0);
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/exams/create'),
        backgroundColor: const Color(0xFF8B5CF6),
        icon: const Icon(LucideIcons.brain, color: Colors.white),
        label: const Text(
          'Generate Exam',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final Exam exam;

  const _ExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    final isCompleted = exam.score != null;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isCompleted
              ? const Color(0xFF27272A)
              : const Color(0xFF8B5CF6).withOpacity(0.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                exam.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${exam.score}%',
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            exam.description,
            style: const TextStyle(color: Color(0xFFA1A1AA), fontSize: 14),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(
                LucideIcons.calendar,
                size: 14,
                color: Color(0xFF71717A),
              ),
              const SizedBox(width: 4),
              Text(
                DateFormat.yMMMd().format(exam.createdAt),
                style: const TextStyle(color: Color(0xFF71717A), fontSize: 12),
              ),
              const Spacer(),
              if (!isCompleted)
                ElevatedButton(
                  onPressed: () => context.push('/exams/play/${exam.id}'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Start Now'),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
