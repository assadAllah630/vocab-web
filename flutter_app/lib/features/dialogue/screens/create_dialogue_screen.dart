import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/layouts/wizard_layout.dart';
import '../../shared/widgets/app_text_field.dart';
import '../providers/dialogue_provider.dart';
import 'dialogue_display_screen.dart';

class CreateDialogueScreen extends ConsumerStatefulWidget {
  const CreateDialogueScreen({super.key});

  @override
  ConsumerState<CreateDialogueScreen> createState() =>
      _CreateDialogueScreenState();
}

class _CreateDialogueScreenState extends ConsumerState<CreateDialogueScreen> {
  int _step = 1;

  // Form Data
  String _scenario = '';
  String _tone = 'Neutral';

  final List<Map<String, String>> _speakers = [];
  final TextEditingController _speakerNameCtrl = TextEditingController();
  final TextEditingController _speakerPersonalityCtrl = TextEditingController();
  bool _showSpeakerForm = false;

  String _level = 'A2';
  int _wordCount = 250;
  final TextEditingController _notesController = TextEditingController();

  final List<Map<String, dynamic>> _tones = [
    {
      'id': 'Neutral',
      'color': [0xFFA1A1AA, 0xFF71717A],
      'icon': '😐',
    },
    {
      'id': 'Formal',
      'color': [0xFF3B82F6, 0xFF4F46E5],
      'icon': '👔',
    },
    {
      'id': 'Casual',
      'color': [0xFF34D399, 0xFF10B981],
      'icon': '😎',
    },
    {
      'id': 'Humorous',
      'color': [0xFFFACC15, 0xFFF59E0B],
      'icon': '😂',
    },
    {
      'id': 'Argumentative',
      'color': [0xFFF87171, 0xFFEF4444],
      'icon': '😠',
    },
    {
      'id': 'Romantic',
      'color': [0xFFF472B6, 0xFFE11D48],
      'icon': '❤️',
    },
    {
      'id': 'Professional',
      'color': [0xFF9CA3AF, 0xFF4B5563],
      'icon': '💼',
    },
    {
      'id': 'Supportive',
      'color': [0xFF2DD4BF, 0xFF0D9488],
      'icon': '🤗',
    },
    {
      'id': 'Mysterious',
      'color': [0xFFA855F7, 0xFF7C3AED],
      'icon': '🕵️',
    },
  ];

  final List<Map<String, String>> _scenarios = [
    {
      'id': 'cafe',
      'label': 'Cafe',
      'icon': '☕',
      'desc': 'Ordering drinks and chatting',
    },
    {
      'id': 'shopping',
      'label': 'Shopping',
      'icon': '🛍️',
      'desc': 'Buying clothes or groceries',
    },
    {
      'id': 'airport',
      'label': 'Airport',
      'icon': '✈️',
      'desc': 'Check-in and boarding',
    },
    {
      'id': 'doctor',
      'label': 'Doctor',
      'icon': '👨‍⚕️',
      'desc': 'Health-related conversation',
    },
    {
      'id': 'interview',
      'label': 'Interview',
      'icon': '🤝',
      'desc': 'Professional discussion',
    },
    {
      'id': 'restaurant',
      'label': 'Restaurant',
      'icon': '🍽️',
      'desc': 'Ordering food and service',
    },
    {
      'id': 'hotel',
      'label': 'Hotel',
      'icon': '🏨',
      'desc': 'Booking and room requests',
    },
    {
      'id': 'phone',
      'label': 'Phone',
      'icon': '📞',
      'desc': 'Customer service or inquiry',
    },
  ];

  @override
  void dispose() {
    _speakerNameCtrl.dispose();
    _speakerPersonalityCtrl.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _addSpeaker() {
    if (_speakerNameCtrl.text.isNotEmpty) {
      setState(() {
        _speakers.add({
          'name': _speakerNameCtrl.text,
          'personality': _speakerPersonalityCtrl.text,
        });
        _speakerNameCtrl.clear();
        _speakerPersonalityCtrl.clear();
        _showSpeakerForm = false;
      });
    }
  }

  void _removeSpeaker(int index) {
    setState(() {
      _speakers.removeAt(index);
    });
  }

  Future<void> _handleGenerate() async {
    await ref
        .read(dialogueProvider.notifier)
        .generateDialogue(
          scenario: _scenario,
          tone: _tone,
          speakers: _speakers,
          level: _level,
          wordCount: _wordCount,
          instructorNotes: _notesController.text.isNotEmpty
              ? _notesController.text
              : null,
        );

    if (mounted && ref.read(dialogueProvider).generatedContent != null) {
      setState(() => _step = 4);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dialogueState = ref.watch(dialogueProvider);

    // Steps
    String title = 'Dialogue Master';
    String subtitle = switch (_step) {
      1 => 'Set the Scene',
      2 => "Who's Talking?",
      3 => 'Fine Tune Details',
      4 => 'Your Dialogue',
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
                context.pop();
              } else {
                setState(() => _step -= 1);
              }
            }
          : () => context.pop(),
      onNext: () {
        if (_step == 3) {
          _handleGenerate();
        } else if (_step == 4) {
          context.pop();
        } else {
          setState(() => _step += 1);
        }
      },
      isNextDisabled:
          (_step == 1 && _scenario.isEmpty) ||
          (_step == 2 && _speakers.length < 2),
      nextLabel: _step == 3
          ? 'Generate Dialogue'
          : _step == 4
          ? 'Finish'
          : 'Next',
      isLoading: dialogueState.isLoading,
      loadingMessage: 'Writing script...',
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
              _SectionLabel('QUICK SCENARIOS'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 1.0,
                ),
                itemCount: _scenarios.length,
                itemBuilder: (context, index) {
                  final s = _scenarios[index];
                  return GestureDetector(
                    onTap: () => setState(() => _scenario = s['desc']!),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF27272A)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            s['icon']!,
                            style: const TextStyle(fontSize: 24),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            s['label']!,
                            style: const TextStyle(
                              fontSize: 10,
                              color: Color(0xFFA1A1AA),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 16),
              AppTextField(
                onChanged: (v) => _scenario = v,
                controller: TextEditingController(
                  text: _scenario,
                ), // Note: this recreates controller, minimal issue for this simple form
                hintText: 'Describe your scenario...',
                maxLines: 3,
              ),

              const SizedBox(height: 24),
              _SectionLabel('CONVERSATION TONE'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 1.1,
                ),
                itemCount: _tones.length,
                itemBuilder: (context, index) {
                  final t = _tones[index];
                  final isSelected = _tone == t['id'];
                  final List<int> colors = t['color'];

                  return GestureDetector(
                    onTap: () => setState(() => _tone = t['id']),
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
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? Colors.transparent
                              : const Color(0xFF27272A),
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(t['icon'], style: const TextStyle(fontSize: 20)),
                          const SizedBox(height: 4),
                          Text(
                            t['id'],
                            style: TextStyle(
                              fontSize: 11,
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
            ],
          ),
        );

      case 2:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add at least 2 speakers.',
                style: TextStyle(color: Color(0xFF71717A), fontSize: 14),
              ),
              const SizedBox(height: 16),

              if (_speakers.isNotEmpty)
                ..._speakers.asMap().entries.map((entry) {
                  final idx = entry.key;
                  final speaker = entry.value;
                  final colors = idx % 2 == 0
                      ? [const Color(0xFF6366F1), const Color(0xFF4F46E5)]
                      : [const Color(0xFF14B8A6), const Color(0xFF0D9488)];

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
                          decoration: BoxDecoration(
                            gradient: LinearGradient(colors: colors),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            speaker['name']![0].toUpperCase(),
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
                                speaker['name']!,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (speaker['personality']!.isNotEmpty)
                                Text(
                                  speaker['personality']!,
                                  style: const TextStyle(
                                    color: Color(0xFFA1A1AA),
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => _removeSpeaker(idx),
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

              if (_showSpeakerForm)
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
                        controller: _speakerNameCtrl,
                        hintText: 'Speaker Name',
                      ),
                      const SizedBox(height: 12),
                      AppTextField(
                        controller: _speakerPersonalityCtrl,
                        hintText: 'Personality (Optional)',
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () =>
                                  setState(() => _showSpeakerForm = false),
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
                              onPressed: _addSpeaker,
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
                  onTap: () => setState(() => _showSpeakerForm = true),
                  child: Container(
                    height: 56,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFF27272A),
                        style: BorderStyle.solid,
                      ),
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
                          'Add Speaker',
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
              _SectionLabel('LANGUAGE LEVEL'),
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
                  _SectionLabel('LENGTH'),
                  Text(
                    '~${(_wordCount / 15).floor()} exchanges',
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
                  min: 100,
                  max: 500,
                  divisions: 16,
                  onChanged: (v) => setState(() => _wordCount = v.toInt()),
                ),
              ),

              const SizedBox(height: 24),
              // Preview
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF18181B), Color(0xFF1F1F23)],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF27272A)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(
                          LucideIcons.messageSquare,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Dialogue Preview',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '$_tone conversation',
                              style: const TextStyle(
                                color: Color(0xFF71717A),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF09090B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        _scenario.isNotEmpty
                            ? _scenario
                            : 'Your scenario will appear here...',
                        style: const TextStyle(
                          color: Color(0xFFA1A1AA),
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );

      case 4:
        final content = ref.read(dialogueProvider).generatedContent;
        if (content == null) {
          return const Center(child: Text("Generation Error"));
        }

        return DialogueDisplayScreen(
          content: content['content'],
          title: content['content']['title'],
          level: _level,
          tone: _tone,
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
