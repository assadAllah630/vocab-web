import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../core/layouts/wizard_layout.dart';
import '../../shared/widgets/app_text_field.dart';
import '../providers/article_provider.dart';
import 'article_display_screen.dart';

class CreateArticleScreen extends ConsumerStatefulWidget {
  const CreateArticleScreen({super.key});

  @override
  ConsumerState<CreateArticleScreen> createState() =>
      _CreateArticleScreenState();
}

class _CreateArticleScreenState extends ConsumerState<CreateArticleScreen> {
  int _step = 1;

  // Form Data
  String _topic = '';
  String _style = 'Informative';
  String _structure = 'Standard';
  String _level = 'B1';
  int _wordCount = 400;

  final TextEditingController _topicController = TextEditingController();

  final List<Map<String, dynamic>> _styles = [
    {
      'id': 'Informative',
      'icon': '📰',
      'desc': 'Clear, factual reporting',
      'color': [0xFF3B82F6, 0xFF06B6D4],
    },
    {
      'id': 'Blog',
      'icon': '✍️',
      'desc': 'Engaging, personal tone',
      'color': [0xFFEC4899, 0xFFF43F5E],
    },
    {
      'id': 'Academic',
      'icon': '🎓',
      'desc': 'Formal, structured analysis',
      'color': [0xFFA855F7, 0xFF7C3AED],
    },
    {
      'id': 'Opinion',
      'icon': '💬',
      'desc': 'Persuasive thought',
      'color': [0xFFF97316, 0xFFF59E0B],
    },
    {
      'id': 'Educational',
      'icon': '💡',
      'desc': 'Clear explanations',
      'color': [0xFF22C55E, 0xFF10B981],
    },
    {
      'id': 'Technical',
      'icon': '📈',
      'desc': 'In-depth analysis',
      'color': [0xFF64748B, 0xFF52525B],
    },
  ];

  final List<Map<String, dynamic>> _structures = [
    {
      'id': 'Standard',
      'icon': LucideIcons.newspaper,
      'desc': 'Intro, body, conclusion',
    },
    {
      'id': 'Listicle',
      'icon': LucideIcons.list,
      'desc': 'Numbered points format',
    },
    {
      'id': 'How-to',
      'icon': LucideIcons.lightbulb,
      'desc': 'Step-by-step instructions',
    },
    {
      'id': 'Problem-Solution',
      'icon': LucideIcons.arrowUpRight,
      'desc': 'Issue and resolution',
    },
    {
      'id': 'Comparison',
      'icon': LucideIcons.scale,
      'desc': 'Compare two or more items',
    },
  ];

  final List<Map<String, String>> _topicSuggestions = [
    {'emoji': '🌍', 'topic': 'Climate change and sustainability'},
    {'emoji': '🤖', 'topic': 'Future of AI'},
    {'emoji': '📱', 'topic': 'Social media impact'},
    {'emoji': '🏥', 'topic': 'Mental health awareness'},
    {'emoji': '🚀', 'topic': 'Space exploration'},
  ];

  @override
  void dispose() {
    _topicController.dispose();
    super.dispose();
  }

  Future<void> _handleGenerate() async {
    await ref
        .read(articleProvider.notifier)
        .generateArticle(
          topic: _topic,
          style: _style,
          structure: _structure,
          level: _level,
          wordCount: _wordCount,
        );

    if (mounted && ref.read(articleProvider).generatedContent != null) {
      setState(() => _step = 4);
    }
  }

  @override
  Widget build(BuildContext context) {
    final articleState = ref.watch(articleProvider);

    String subtitle = switch (_step) {
      1 => 'Choose Topic & Style',
      2 => 'Define Structure',
      3 => 'Fine Tune Details',
      4 => 'Your Article',
      _ => '',
    };

    return WizardLayout(
      title: 'Article Writer',
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
      isNextDisabled: (_step == 1 && _topic.isEmpty),
      nextLabel: _step == 3
          ? 'Generate Article'
          : _step == 4
          ? 'Finish'
          : 'Next',
      isLoading: articleState.isLoading,
      loadingMessage: 'Writing article...',
      child: _buildStepContent(articleState),
    );
  }

  Widget _buildStepContent(ArticleState state) {
    switch (_step) {
      case 1:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _Label('TOPIC'),
              AppTextField(
                onChanged: (v) => _topic = v,
                controller: _topicController,
                hintText: 'What should the article be about?',
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: _topicSuggestions.map((s) {
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _topic = s['topic']!;
                        _topicController.text = _topic;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF27272A)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            s['emoji']!,
                            style: const TextStyle(fontSize: 14),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            s['topic']!,
                            style: const TextStyle(
                              color: Color(0xFFA1A1AA),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),
              const _Label('WRITING STYLE'),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 1.6,
                ),
                itemCount: _styles.length,
                itemBuilder: (context, index) {
                  final s = _styles[index];
                  final isSelected = _style == s['id'];
                  final List<int> colors = s['color'];

                  return GestureDetector(
                    onTap: () => setState(() => _style = s['id']),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? Colors.transparent
                              : const Color(0xFF27272A),
                        ),
                        gradient: isSelected
                            ? LinearGradient(
                                colors: [Color(colors[0]), Color(colors[1])],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              )
                            : null,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(s['icon'], style: const TextStyle(fontSize: 20)),
                          const SizedBox(height: 8),
                          Text(
                            s['id'],
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFFA1A1AA),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            s['desc'],
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.8)
                                  : const Color(0xFF71717A),
                              fontSize: 10,
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
              const _Label('ARTICLE STRUCTURE'),
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _structures.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final s = _structures[index];
                  final isSelected = _structure == s['id'];

                  return GestureDetector(
                    onTap: () => setState(() => _structure = s['id']),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.all(16),
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
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.2)
                                  : const Color(0xFF27272A),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(
                              s['icon'],
                              size: 18,
                              color: isSelected
                                  ? Colors.white
                                  : const Color(0xFFA1A1AA),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  s['id'],
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.white
                                        : const Color(0xFFA1A1AA),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                ),
                                Text(
                                  s['desc'],
                                  style: TextStyle(
                                    color: isSelected
                                        ? Colors.white.withValues(alpha: 0.7)
                                        : const Color(0xFF71717A),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
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

      case 3:
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _Label('LANGUAGE LEVEL'),
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
                  const _Label('ARTICLE LENGTH'),
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
                  min: 200,
                  max: 1000,
                  divisions: 16,
                  onChanged: (v) => setState(() => _wordCount = v.toInt()),
                ),
              ),
              const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Short (~1 min)',
                    style: TextStyle(color: Color(0xFF52525B), fontSize: 11),
                  ),
                  Text(
                    'Medium',
                    style: TextStyle(color: Color(0xFF52525B), fontSize: 11),
                  ),
                  Text(
                    'Long (~5 min)',
                    style: TextStyle(color: Color(0xFF52525B), fontSize: 11),
                  ),
                ],
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
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: _styles
                                  .firstWhere((s) => s['id'] == _style)['color']
                                  .map<Color>((c) => Color(c))
                                  .toList(),
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(
                            LucideIcons.newspaper,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Article Preview',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '$_style • $_structure',
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
                        _topic.isNotEmpty
                            ? _topic
                            : 'Your topic will appear here...',
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
        final content = state.generatedContent;
        if (content == null) {
          return const Center(child: Text("Generation Error"));
        }

        return ArticleDisplayScreen(
          content: content['content'],
          title: content['content']['title'],
          level: _level,
          topic: _topic,
        );

      default:
        return const SizedBox.shrink();
    }
  }
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
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
