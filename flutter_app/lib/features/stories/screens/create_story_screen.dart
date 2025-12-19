import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/layouts/wizard_layout.dart';
import '../../shared/widgets/app_text_field.dart';
import '../providers/story_provider.dart';
import 'story_display_screen.dart';

class CreateStoryScreen extends ConsumerStatefulWidget {
  const CreateStoryScreen({super.key});

  @override
  ConsumerState<CreateStoryScreen> createState() => _CreateStoryScreenState();
}

class _CreateStoryScreenState extends ConsumerState<CreateStoryScreen> {
  int _step = 1;

  // Form Data
  String _genre = 'Daily Life';
  String _plotType = 'Standard';
  final TextEditingController _settingController = TextEditingController();

  final List<Map<String, String>> _characters = [];
  final TextEditingController _charNameCtrl = TextEditingController();
  final TextEditingController _charRoleCtrl = TextEditingController();
  final TextEditingController _charTraitsCtrl = TextEditingController();
  bool _showCharForm = false;

  String _level = 'B1';
  int _wordCount = 300;
  bool _generateImages = false;
  final TextEditingController _notesController = TextEditingController();

  final List<Map<String, dynamic>> _genres = [
    {
      'id': 'Daily Life',
      'bg': [0xFF10B981, 0xFF14B8A6],
      'icon': '🏠',
    },
    {
      'id': 'Adventure',
      'bg': [0xFFF97316, 0xFFF59E0B],
      'icon': '🗺️',
    },
    {
      'id': 'Sci-Fi',
      'bg': [0xFF06B6D4, 0xFF3B82F6],
      'icon': '🚀',
    },
    {
      'id': 'Fantasy',
      'bg': [0xFF8B5CF6, 0xFF7C3AED],
      'icon': '🧚',
    },
    {
      'id': 'Mystery',
      'bg': [0xFF64748B, 0xFF52525B],
      'icon': '🔍',
    },
    {
      'id': 'Romance',
      'bg': [0xFFEC4899, 0xFFF43F5E],
      'icon': '❤️',
    },
    {
      'id': 'Horror',
      'bg': [0xFF374151, 0xFF111827],
      'icon': '👻',
    },
    {
      'id': 'Comedy',
      'bg': [0xFFFACC15, 0xFFFB923C],
      'icon': '😂',
    },
  ];

  final List<String> _plotTypes = [
    'Standard',
    'Surprise Ending',
    'Moral Lesson',
    'Open Ending',
    "Hero's Journey",
    'Flashback',
    'Mystery Solve',
  ];

  @override
  void dispose() {
    _settingController.dispose();
    _charNameCtrl.dispose();
    _charRoleCtrl.dispose();
    _charTraitsCtrl.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addCharacter() {
    if (_charNameCtrl.text.isNotEmpty && _charRoleCtrl.text.isNotEmpty) {
      setState(() {
        _characters.add({
          'name': _charNameCtrl.text,
          'role': _charRoleCtrl.text,
          'traits': _charTraitsCtrl.text,
        });
        _charNameCtrl.clear();
        _charRoleCtrl.clear();
        _charTraitsCtrl.clear();
        _showCharForm = false;
      });
    }
  }

  void _removeCharacter(int index) {
    setState(() {
      _characters.removeAt(index);
    });
  }

  Future<void> _handleGenerate() async {
    await ref
        .read(storyProvider.notifier)
        .generateStory(
          genre: _genre,
          plotType: _plotType,
          setting: _settingController.text,
          characters: _characters,
          level: _level,
          wordCount: _wordCount,
          generateImages: _generateImages,
          instructorNotes: _notesController.text.isNotEmpty
              ? _notesController.text
              : null,
        );

    if (mounted && ref.read(storyProvider).generatedContent != null) {
      setState(() => _step = 4);
    }
  }

  @override
  Widget build(BuildContext context) {
    final storyState = ref.watch(storyProvider);

    // Step Titles
    String title = 'Story Weaver';
    String subtitle = switch (_step) {
      1 => 'Choose Concept',
      2 => 'Cast Characters',
      3 => 'Fine Tune Details',
      4 => 'Your Story',
      _ => '',
    };

    return WizardLayout(
      title: title,
      subtitle: subtitle,
      currentStep: _step,
      totalSteps: 4,
      onBack: _step > 1
          ? () {
              if (_step == 4) {
                context.pop(); // Leave if finished
              } else {
                setState(() => _step -= 1);
              }
            }
          : () => context.pop(),
      onNext: () {
        if (_step == 3) {
          _handleGenerate();
        } else if (_step == 4) {
          context.pop(); // TODO: Save to library logic?
        } else {
          setState(() => _step += 1);
        }
      },
      isNextDisabled: _step == 1 && _settingController.text.isEmpty,
      nextLabel: _step == 3
          ? 'Generate Story'
          : _step == 4
          ? 'Finish'
          : 'Next',
      isLoading: storyState.isLoading,
      loadingMessage: 'Weaving your story...',
      child: _buildStepContent(),
    );
  }

  Widget _buildStepContent() {
    switch (_step) {
      case 1:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionLabel('GENRE'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.9,
                ),
                itemCount: _genres.length,
                itemBuilder: (context, index) {
                  final g = _genres[index];
                  final isSelected = _genre == g['id'];
                  final List<int> colors = g['bg'];

                  return GestureDetector(
                    onTap: () => setState(() => _genre = g['id']),
                    child: AnimatedContainer(
                      duration: 200.ms,
                      decoration: BoxDecoration(
                        color: isSelected ? null : const Color(0xFF18181B),
                        gradient: isSelected
                            ? LinearGradient(
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                                colors: [Color(colors[0]), Color(colors[1])],
                              )
                            : null,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? Colors.transparent
                              : const Color(0xFF27272A),
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(g['icon'], style: const TextStyle(fontSize: 32)),
                          const SizedBox(height: 8),
                          Text(
                            g['id'],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFFA1A1AA),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 24),

              _SectionLabel('PLOT TYPE'),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _plotTypes.map((p) {
                  final isSelected = _plotType == p;
                  return GestureDetector(
                    onTap: () => setState(() => _plotType = p),
                    child: AnimatedContainer(
                      duration: 200.ms,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFF6366F1)
                            : const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF6366F1)
                              : const Color(0xFF27272A),
                        ),
                      ),
                      child: Text(
                        p,
                        style: TextStyle(
                          color: isSelected
                              ? Colors.white
                              : const Color(0xFFA1A1AA),
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),
              _SectionLabel('SETTING'),
              AppTextField(
                controller: _settingController,
                hintText: 'e.g., A futuristic space station...',
              ),
            ],
          ),
        );

      case 2:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add characters to make your story come alive.',
                style: TextStyle(color: Color(0xFF71717A), fontSize: 14),
              ),
              const SizedBox(height: 16),

              if (_characters.isNotEmpty)
                ..._characters.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final char = entry.value;
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
                        Container(
                          width: 40,
                          height: 40,
                          alignment: Alignment.center,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            char['name']![0].toUpperCase(),
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                char['name']!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${char['role']} ${char['traits']!.isNotEmpty ? '• ${char['traits']}' : ''}',
                                style: const TextStyle(
                                  color: Color(0xFFA1A1AA),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => _removeCharacter(idx),
                          icon: const Icon(
                            LucideIcons.trash2,
                            color: Color(0xFFF87171),
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  );
                }),

              if (_showCharForm)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF18181B),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF6366F1)),
                  ),
                  child: Column(
                    children: [
                      AppTextField(
                        controller: _charNameCtrl,
                        hintText: 'Character Name',
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _charRoleCtrl,
                        hintText: 'Role (e.g. Hero, Villain)',
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _charTraitsCtrl,
                        hintText: 'Traits (Optional)',
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () =>
                                  setState(() => _showCharForm = false),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                  color: Color(0xFF27272A),
                                ),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                              child: const Text(
                                'Cancel',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _addCharacter,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF6366F1),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 12,
                                ),
                              ),
                              child: const Text(
                                'Add',
                                style: TextStyle(color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              else
                GestureDetector(
                  onTap: () => setState(() => _showCharForm = true),
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFF27272A),
                        style: BorderStyle.solid,
                      ), // Dashed hard in native, using solid
                      borderRadius: BorderRadius.circular(12),
                    ),
                    alignment: Alignment.center,
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.userPlus,
                          color: Color(0xFFA1A1AA),
                          size: 18,
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Add Character',
                          style: TextStyle(
                            color: Color(0xFFA1A1AA),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );

      case 3:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _SectionLabel('LEVEL'),
              Row(
                children: ['A1', 'A2', 'B1', 'B2', 'C1'].map((l) {
                  final isSelected = _level == l;
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _level = l),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF6366F1)
                              : const Color(0xFF18181B),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected
                                ? const Color(0xFF6366F1)
                                : const Color(0xFF27272A),
                          ),
                        ),
                        child: Text(
                          l,
                          style: TextStyle(
                            color: isSelected
                                ? Colors.white
                                : const Color(0xFFA1A1AA),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _SectionLabel('STORY LENGTH'),
                  Text(
                    '$_wordCount words',
                    style: const TextStyle(
                      color: Color(0xFF6366F1),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: const Color(0xFF6366F1),
                  thumbColor: Colors.white,
                ),
                child: Slider(
                  value: _wordCount.toDouble(),
                  min: 150,
                  max: 800,
                  divisions: 13,
                  onChanged: (v) => setState(() => _wordCount = v.toInt()),
                ),
              ),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Short',
                      style: TextStyle(color: Color(0xFF52525B), fontSize: 12),
                    ),
                    Text(
                      'Medium',
                      style: TextStyle(color: Color(0xFF52525B), fontSize: 12),
                    ),
                    Text(
                      'Long',
                      style: TextStyle(color: Color(0xFF52525B), fontSize: 12),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF18181B), Color(0xFF1F1F23)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF27272A)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFA855F7).withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        LucideIcons.image,
                        color: Color(0xFFA855F7),
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI Illustrations',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'Generate scenes for your story',
                            style: TextStyle(
                              color: Color(0xFF71717A),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: _generateImages,
                      onChanged: (v) => setState(() => _generateImages = v),
                      activeThumbColor: const Color(0xFF6366F1),
                      activeTrackColor: const Color(
                        0xFF6366F1,
                      ).withValues(alpha: 0.5),
                      inactiveTrackColor: const Color(0xFF27272A),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );

      case 4:
        final content = ref.read(storyProvider).generatedContent;
        if (content == null) {
          return const Center(child: Text("Generation Error"));
        }

        // Render step 4 is essentially the full display screen embedded
        return StoryDisplayScreen(
          content: content,
          title: content['content']['title'],
          level: _level,
        );

      default:
        return const SizedBox.shrink();
    }
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFA1A1AA),
          fontSize: 12,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
