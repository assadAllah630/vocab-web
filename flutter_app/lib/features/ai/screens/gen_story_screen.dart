import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/layouts/wizard_layout.dart';
import '../../../core/network/api_client.dart';

// Generates story using the AI API
class GenStoryScreen extends ConsumerStatefulWidget {
  const GenStoryScreen({super.key});

  @override
  ConsumerState<GenStoryScreen> createState() => _GenStoryScreenState();
}

class _GenStoryScreenState extends ConsumerState<GenStoryScreen> {
  int _currentStep = 1;
  bool _isLoading = false;

  // Form State
  String _genre = 'Daily Life';
  String _plotType = 'Standard';
  final _settingController = TextEditingController();
  final _wordCountController = TextEditingController(text: '300');
  String _level = 'B1';
  bool _generateImages = false;

  final List<Map<String, String>> _characters = [];

  // Character Input
  final _charNameController = TextEditingController();
  final _charRoleController = TextEditingController();
  final _charTraitsController = TextEditingController();
  bool _showCharForm = false;

  final List<Map<String, dynamic>> _genres = [
    {'id': 'Daily Life', 'icon': '🏡', 'color': 0xFF10B981},
    {
      'id': 'Adventure',
      'icon': 'hello',
      'color': 0xFFF59E0B,
    }, // Placeholder for Lottie
    {'id': 'Sci-Fi', 'icon': '🤖', 'color': 0xFF06B6D4},
    {'id': 'Fantasy', 'icon': '🐉', 'color': 0xFF8B5CF6},
    {'id': 'Mystery', 'icon': '🔍', 'color': 0xFF64748B},
    {'id': 'Romance', 'icon': '❤️', 'color': 0xFFEC4899},
  ];

  @override
  Widget build(BuildContext context) {
    return WizardLayout(
      title: 'Story Weaver',
      subtitle: _getSubtitle(),
      currentStep: _currentStep,
      totalSteps: 4,
      onBack: _currentStep > 1 ? () => setState(() => _currentStep--) : null,
      onNext: _handleNext,
      isNextDisabled: _currentStep == 1 && _settingController.text.isEmpty,
      nextLabel: _currentStep == 3
          ? 'Generate Story'
          : (_currentStep == 4 ? 'Save to Library' : 'Next'),
      isLoading: _isLoading,
      loadingMessage: "Weaving your story...",
      child: _buildStepContent(),
    );
  }

  String _getSubtitle() {
    switch (_currentStep) {
      case 1:
        return 'Choose Concept';
      case 2:
        return 'Cast Characters';
      case 3:
        return 'Fine Tune Details';
      case 4:
        return 'Your Story';
      default:
        return '';
    }
  }

  Future<void> _handleNext() async {
    if (_currentStep == 3) {
      // Generate
      await _generateStory();
    } else if (_currentStep == 4) {
      // Save/Exit
      context.pop();
    } else {
      setState(() => _currentStep++);
    }
  }

  Future<void> _generateStory() async {
    setState(() => _isLoading = true);
    try {
      final apiClient = ref.read(apiClientProvider);

      // Call API
      await apiClient.post(
        'ai/generate-advanced-text/',
        data: {
          'content_type': 'story',
          'topic': _settingController.text,
          'student_level': _level,
          'genre': _genre,
          'plot_type': _plotType,
          'characters': _characters,
          'word_count': int.tryParse(_wordCountController.text) ?? 300,
          'generate_images': _generateImages,
        },
      );

      // Handle success - Move to result step with data
      if (mounted) {
        setState(() {
          _currentStep = 4;
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
      case 4:
        return _buildStep4();
      default:
        return const SizedBox();
    }
  }

  // STEP 1: CONCEPT
  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "GENRE",
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
          itemCount: _genres.length,
          itemBuilder: (context, index) {
            final g = _genres[index];
            final isSelected = _genre == g['id'];
            return GestureDetector(
              onTap: () => setState(() => _genre = g['id'] as String),
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? Color(g['color'] as int).withValues(alpha: 0.2)
                      : const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isSelected
                        ? Color(g['color'] as int)
                        : const Color(0xFF27272A),
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      g['icon'] as String,
                      style: const TextStyle(fontSize: 24),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      g['id'] as String,
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
          "SETTING",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _settingController,
          style: const TextStyle(color: Colors.white),
          onChanged: (v) =>
              setState(() {}), // Trigger rebuild for button validation
          decoration: InputDecoration(
            hintText: "E.g., A futuristic city in 2050...",
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

  // STEP 2: CHARACTERS
  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (_characters.isNotEmpty) ...[
          ..._characters.asMap().entries.map((entry) {
            final i = entry.key;
            final c = entry.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(
                      0xFF6366F1,
                    ).withValues(alpha: 0.2),
                    child: Text(
                      c['name']![0],
                      style: const TextStyle(color: Color(0xFF6366F1)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          c['name']!,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          "${c['role']} • ${c['traits']}",
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(
                      LucideIcons.trash2,
                      color: Colors.red,
                      size: 18,
                    ),
                    onPressed: () => setState(() => _characters.removeAt(i)),
                  ),
                ],
              ),
            ).animate().fadeIn();
          }),
          const SizedBox(height: 16),
        ],

        if (_showCharForm)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF6366F1)),
            ),
            child: Column(
              children: [
                TextField(
                  controller: _charNameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Name',
                    filled: true,
                    fillColor: Color(0xFF09090B),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _charRoleController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Role',
                    filled: true,
                    fillColor: Color(0xFF09090B),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _charTraitsController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Traits',
                    filled: true,
                    fillColor: Color(0xFF09090B),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: TextButton(
                        onPressed: () => setState(() => _showCharForm = false),
                        child: const Text('Cancel'),
                      ),
                    ),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                        ),
                        onPressed: () {
                          if (_charNameController.text.isNotEmpty) {
                            setState(() {
                              _characters.add({
                                'name': _charNameController.text,
                                'role': _charRoleController.text,
                                'traits': _charTraitsController.text,
                              });
                              _charNameController.clear();
                              _charRoleController.clear();
                              _charTraitsController.clear();
                              _showCharForm = false;
                            });
                          }
                        },
                        child: const Text('Add'),
                      ),
                    ),
                  ],
                ),
              ],
            ).animate().slideY(begin: 0.1, end: 0),
          )
        else
          GestureDetector(
            onTap: () => setState(() => _showCharForm = true),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                border: Border.all(
                  color: const Color(0xFF27272A),
                  style: BorderStyle.solid,
                ), // Dashed border tricky in standard
                borderRadius: BorderRadius.circular(12),
                color: Colors.transparent,
              ),
              child: const Column(
                children: [
                  Icon(LucideIcons.userPlus, color: Colors.grey),
                  SizedBox(height: 8),
                  Text(
                    "Add Character",
                    style: TextStyle(
                      color: Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }

  // STEP 3: DETAILS
  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "LEVEL",
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
                        ? const Color(0xFF6366F1)
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
        const SizedBox(height: 24),
        const Text(
          "WORD COUNT",
          style: TextStyle(
            color: Colors.grey,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _wordCountController,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF18181B),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 24),
        SwitchListTile(
          title: const Text(
            "AI Illustrations",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
          subtitle: const Text(
            "Generate images for scene",
            style: TextStyle(color: Colors.grey),
          ),
          value: _generateImages,
          onChanged: (v) => setState(() => _generateImages = v),
          activeTrackColor: const Color(0xFF6366F1),
          contentPadding: EdgeInsets.zero,
        ),
      ],
    );
  }

  // STEP 4: RESULT
  Widget _buildStep4() {
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
            "Story Generated!",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Your story has been saved to the library.",
            style: TextStyle(color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
