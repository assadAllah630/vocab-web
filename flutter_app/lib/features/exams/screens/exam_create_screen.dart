import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/exam_provider.dart';
import '../../shared/widgets/primary_button.dart';

class ExamCreateScreen extends ConsumerStatefulWidget {
  const ExamCreateScreen({super.key});

  @override
  ConsumerState<ExamCreateScreen> createState() => _ExamCreateScreenState();
}

class _ExamCreateScreenState extends ConsumerState<ExamCreateScreen> {
  String _selectedTopic = 'General';
  double _difficulty = 1;
  bool _isGenerating = false;

  void _handleGenerate() async {
    setState(() => _isGenerating = true);
    // Simulate generation
    await Future.delayed(const Duration(seconds: 2));

    // Start the mock exam '2' for now
    ref.read(examProvider.notifier).startExam('2');

    if (mounted) {
      setState(() => _isGenerating = false);
      context.pushReplacement('/exams/play/2');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Generate Exam',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Topic',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            _TopicChipSelector(
              selected: _selectedTopic,
              onChanged: (val) => setState(() => _selectedTopic = val),
              options: const [
                'General',
                'Business',
                'Travel',
                'Medical',
                'Tech',
              ],
            ),
            const SizedBox(height: 30),
            const Text(
              'Difficulty',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 10),
            Slider(
              value: _difficulty,
              min: 0,
              max: 2,
              divisions: 2,
              activeColor: const Color(0xFF8B5CF6),
              label: _difficulty == 0
                  ? 'Easy'
                  : (_difficulty == 1 ? 'Medium' : 'Hard'),
              onChanged: (val) => setState(() => _difficulty = val),
            ),
            Center(
              child: Text(
                _difficulty == 0
                    ? 'Easy'
                    : (_difficulty == 1 ? 'Medium' : 'Hard'),
                style: const TextStyle(color: Color(0xFFA1A1AA)),
              ),
            ),

            const Spacer(),
            PrimaryButton(
              label: _isGenerating ? 'Generating...' : 'Start Exam',
              isLoading: _isGenerating,
              icon: const Icon(
                LucideIcons.sparkles,
                color: Colors.white,
                size: 20,
              ),
              onPressed: _handleGenerate,
            ),
          ],
        ),
      ),
    );
  }
}

class _TopicChipSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;
  final List<String> options;

  const _TopicChipSelector({
    required this.selected,
    required this.onChanged,
    required this.options,
  });

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: options.map((topic) {
        final isSelected = selected == topic;
        return ChoiceChip(
          label: Text(topic),
          selected: isSelected,
          onSelected: (_) => onChanged(topic),
          selectedColor: const Color(0xFF8B5CF6),
          backgroundColor: const Color(0xFF18181B),
          labelStyle: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFFA1A1AA),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(
              color: isSelected ? Colors.transparent : const Color(0xFF27272A),
            ),
          ),
        );
      }).toList(),
    );
  }
}
