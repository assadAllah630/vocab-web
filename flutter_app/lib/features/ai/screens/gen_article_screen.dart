import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/layouts/wizard_layout.dart';
import '../../../core/network/api_client.dart';

class GenArticleScreen extends ConsumerStatefulWidget {
  const GenArticleScreen({super.key});

  @override
  ConsumerState<GenArticleScreen> createState() => _GenArticleScreenState();
}

class _GenArticleScreenState extends ConsumerState<GenArticleScreen> {
  int _currentStep = 1;
  bool _isLoading = false;

  // Form State
  final _topicController = TextEditingController();
  String _style = 'News';
  String _tone = 'Neutral';
  String _level = 'B1';
  double _length = 300;

  final List<String> _styles = [
    'News',
    'Blog Post',
    'Academic',
    'Opinion',
    'Guide',
  ];
  final List<String> _tones = [
    'Neutral',
    'Professional',
    'Humorous',
    'Critical',
    'Enthusiastic',
  ];

  @override
  Widget build(BuildContext context) {
    return WizardLayout(
      title: 'Article Gen',
      subtitle: _getSubtitle(),
      currentStep: _currentStep,
      totalSteps: 3,
      onBack: _currentStep > 1 ? () => setState(() => _currentStep--) : null,
      onNext: _handleNext,
      isNextDisabled: _currentStep == 1 && _topicController.text.isEmpty,
      nextLabel: _currentStep == 2
          ? 'Generate Article'
          : (_currentStep == 3 ? 'Read Now' : 'Next'),
      isLoading: _isLoading,
      loadingMessage: "Researching & writing...",
      child: _buildStepContent(),
    );
  }

  String _getSubtitle() {
    switch (_currentStep) {
      case 1:
        return 'Topic & Style';
      case 2:
        return 'Refine Content';
      case 3:
        return 'Done';
      default:
        return '';
    }
  }

  Future<void> _handleNext() async {
    if (_currentStep == 2) {
      await _generateArticle();
    } else if (_currentStep == 3) {
      context.pop();
    } else {
      setState(() => _currentStep++);
    }
  }

  Future<void> _generateArticle() async {
    setState(() => _isLoading = true);
    try {
      final apiClient = ref.read(apiClientProvider);

      await apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'article',
          'topic': _topicController.text,
          'student_level': _level,
          'style': _style,
          'tone': _tone,
          'word_count': _length.toInt(),
        },
      );

      if (mounted) {
        setState(() {
          _currentStep = 3;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text("Generation failed: $e")));
      }
    }
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 1:
        return _buildStep1();
      case 2:
        return _buildStep2();
      case 3:
        return _buildStep3();
      default:
        return const SizedBox();
    }
  }

  // STEP 1: TOPIC & STYLE
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "TOPIC",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _topicController,
          style: const TextStyle(color: Colors.white),
          onChanged: (v) => setState(() {}),
          decoration: InputDecoration(
            hintText: "E.g., The impact of AI on education...",
            filled: true,
            fillColor: const Color(0xFF18181B),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          "STYLE",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _styles.map((s) {
            final isSelected = _style == s;
            return ChoiceChip(
              label: Text(s),
              selected: isSelected,
              onSelected: (v) => setState(() => _style = s),
              selectedColor: const Color(0xFF10B981),
              backgroundColor: const Color(0xFF18181B),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
              ),
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFF10B981)
                    : const Color(0xFF27272A),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // STEP 2: TONE & LENGTH
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "TONE",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _tones.map((t) {
            final isSelected = _tone == t;
            return ChoiceChip(
              label: Text(t),
              selected: isSelected,
              onSelected: (v) => setState(() => _tone = t),
              selectedColor: const Color(0xFF10B981),
              backgroundColor: const Color(0xFF18181B),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
              ),
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFF10B981)
                    : const Color(0xFF27272A),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        Text(
          "LENGTH: ${_length.toInt()} words",
          style: const TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        Slider(
          value: _length,
          min: 100,
          max: 1000,
          divisions: 9,
          activeColor: const Color(0xFF10B981),
          // StartThumbImage removed
          label: "${_length.toInt()}",
          onChanged: (v) => setState(() => _length = v),
        ),
        const SizedBox(height: 24),
        const Text(
          "DIFFICULTY",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: ['A1', 'A2', 'B1', 'B2', 'C1'].map((l) {
            final isSelected = _level == l;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _level = l),
                child: Container(
                  margin: const EdgeInsets.only(right: 4),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF10B981)
                        : const Color(0xFF18181B),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : const Color(0xFF27272A),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    l,
                    style: TextStyle(
                      color: isSelected ? Colors.white : Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  // STEP 3: RESULT
  Widget _buildStep3() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: const BoxDecoration(
              color: Colors.green,
              shape: BoxShape.circle,
            ),
            child: const Icon(LucideIcons.check, size: 60, color: Colors.white),
          ).animate().scale(),
          const SizedBox(height: 24),
          const Text(
            "Article Published!",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "It's now available in your library.",
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
