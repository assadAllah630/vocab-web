import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/layouts/wizard_layout.dart';
import '../../../core/network/api_client.dart';

class GenDialogueScreen extends ConsumerStatefulWidget {
  const GenDialogueScreen({super.key});

  @override
  ConsumerState<GenDialogueScreen> createState() => _GenDialogueScreenState();
}

class _GenDialogueScreenState extends ConsumerState<GenDialogueScreen> {
  int _currentStep = 1;
  bool _isLoading = false;

  // Form State
  String _scenario = 'Coffee Shop';
  final _topicController = TextEditingController();
  final _roleAController = TextEditingController(text: 'Customer');
  final _roleBController = TextEditingController(text: 'Barista');
  String _level = 'B1';

  final List<Map<String, dynamic>> _scenarios = [
    {'id': 'Coffee Shop', 'icon': '☕', 'color': 0xFF78350F},
    {'id': 'Job Interview', 'icon': '💼', 'color': 0xFF1E40AF},
    {'id': 'Doctor Visit', 'icon': '🏥', 'color': 0xFFDC2626},
    {'id': 'Shopping', 'icon': '🛍️', 'color': 0xFFDB2777},
    {'id': 'Travel', 'icon': '✈️', 'color': 0xFF0891B2},
    {'id': 'Restaurant', 'icon': '🍽️', 'color': 0xFFD97706},
  ];

  @override
  Widget build(BuildContext context) {
    return WizardLayout(
      title: 'Dialogue Sim',
      subtitle: _getSubtitle(),
      currentStep: _currentStep,
      totalSteps: 3,
      onBack: _currentStep > 1 ? () => setState(() => _currentStep--) : null,
      onNext: _handleNext,
      isNextDisabled:
          _currentStep == 1 &&
          _topicController.text.isEmpty &&
          _scenario == 'Custom',
      nextLabel: _currentStep == 2
          ? 'Generate Dialogue'
          : (_currentStep == 3 ? 'Start Practice' : 'Next'),
      isLoading: _isLoading,
      loadingMessage: "Simulating conversation...",
      child: _buildStepContent(),
    );
  }

  String _getSubtitle() {
    switch (_currentStep) {
      case 1:
        return 'Choose Scenario';
      case 2:
        return 'Define Roles';
      case 3:
        return 'Ready';
      default:
        return '';
    }
  }

  Future<void> _handleNext() async {
    if (_currentStep == 2) {
      await _generateDialogue();
    } else if (_currentStep == 3) {
      context.pop(); // Or navigate to dialogue player
    } else {
      setState(() => _currentStep++);
    }
  }

  Future<void> _generateDialogue() async {
    setState(() => _isLoading = true);
    try {
      final apiClient = ref.read(apiClientProvider);

      await apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'dialogue',
          'topic': _topicController.text.isEmpty
              ? _scenario
              : _topicController.text,
          'student_level': _level,
          'scenario': _scenario,
          'role_a': _roleAController.text,
          'role_b': _roleBController.text,
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

  // STEP 1: SCENARIO
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "SCENARIO PRESETS",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 1.0,
          ),
          itemCount: _scenarios.length,
          itemBuilder: (context, index) {
            final s = _scenarios[index];
            final isSelected = _scenario == s['id'];
            return GestureDetector(
              onTap: () => setState(() => _scenario = s['id'] as String),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? Color(s['color'] as int).withValues(alpha: 0.2)
                      : const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? Color(s['color'] as int)
                        : const Color(0xFF27272A),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      s['icon'] as String,
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      s['id'] as String,
                      style: TextStyle(
                        color: isSelected ? Colors.white : Colors.grey,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 24),
        const Text(
          "CUSTOM TOPIC (OPTIONAL)",
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
          decoration: InputDecoration(
            hintText: "E.g., Negotiating a salary raise...",
            hintStyle: TextStyle(color: Colors.grey[600]),
            filled: true,
            fillColor: const Color(0xFF18181B),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  // STEP 2: ROLES & LEVEL
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "ROLES",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "You",
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _roleAController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: Color(0xFF18181B),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            const Icon(LucideIcons.arrowRightLeft, color: Colors.grey),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "AI Partner",
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _roleBController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: Color(0xFF18181B),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        const Text(
          "DIFFICULTY LEVEL",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: ['A1', 'A2', 'B1', 'B2', 'C1'].map((l) {
            final isSelected = _level == l;
            return ChoiceChip(
              label: Text(l),
              selected: isSelected,
              onSelected: (v) => setState(() => _level = l),
              selectedColor: const Color(0xFFEC4899),
              backgroundColor: const Color(0xFF18181B),
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
              ),
              side: BorderSide(
                color: isSelected
                    ? const Color(0xFFEC4899)
                    : const Color(0xFF27272A),
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
            "Dialogue Ready!",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Go to your library to start practicing.",
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
