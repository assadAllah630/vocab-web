import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/grammar_provider.dart';

enum GenerationStep { input, generating, preview, saving }

class GrammarGenerateScreen extends ConsumerStatefulWidget {
  final GrammarTopic? editTopic;
  const GrammarGenerateScreen({super.key, this.editTopic});

  @override
  ConsumerState<GrammarGenerateScreen> createState() =>
      _GrammarGenerateScreenState();
}

class _GrammarGenerateScreenState extends ConsumerState<GrammarGenerateScreen> {
  late GenerationStep _step;
  late TextEditingController _titleCtrl;
  late TextEditingController _contextCtrl;
  late String _level;
  GrammarTopic? _generatedTopic;
  String _error = '';

  final List<String> _levels = ['A1', 'A2', 'B1'];
  final List<String> _categories = [
    'articles',
    'plurals',
    'verbs',
    'separable_verbs',
    'modal_verbs',
    'cases',
    'prepositions',
    'sentence_structure',
    'word_order',
    'time_expressions',
    'adjective_endings',
    'comparatives',
    'uncategorized',
  ];

  @override
  void initState() {
    super.initState();
    _step = widget.editTopic != null
        ? GenerationStep.preview
        : GenerationStep.input;
    _titleCtrl = TextEditingController(text: widget.editTopic?.title ?? '');
    _contextCtrl = TextEditingController();
    _level = widget.editTopic?.level ?? 'A1';
    _generatedTopic = widget.editTopic;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _contextCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleGenerate() async {
    if (_titleCtrl.text.trim().isEmpty) return;

    setState(() {
      _step = GenerationStep.generating;
      _error = '';
    });

    try {
      final topic = await ref
          .read(grammarProvider.notifier)
          .generateTopic(
            title: _titleCtrl.text.trim(),
            level: _level,
            context: _contextCtrl.text.trim(),
          );

      if (topic != null) {
        setState(() {
          _generatedTopic = topic;
          _step = GenerationStep.preview;
        });
      } else {
        setState(() {
          _error = 'Generation failed. Please try again.';
          _step = GenerationStep.input;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _step = GenerationStep.input;
      });
    }
  }

  Future<void> _handleSave() async {
    if (_generatedTopic == null) return;

    if (widget.editTopic != null) {
      // Update
      try {
        await ref
            .read(grammarProvider.notifier)
            .updateTopic(_generatedTopic!.id, {
              'title': _titleCtrl.text,
              'level': _level,
              'content': _generatedTopic!.content,
              'category': _generatedTopic!.category,
              'examples': _generatedTopic!.examples
                  .map((e) => e.toJson())
                  .toList(),
            });
        if (mounted) context.pop();
      } catch (e) {
        setState(() => _error = 'Failed to update topic');
      }
      return;
    }

    // Save New
    setState(() => _step = GenerationStep.saving);
    try {
      await ref.read(grammarProvider.notifier).saveTopic(_generatedTopic!);
      if (mounted) context.pop();
    } catch (e) {
      setState(() {
        _error = 'Failed to save topic';
        _step = GenerationStep.preview;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _buildBody(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            onPressed: () {
              if (_step == GenerationStep.preview && widget.editTopic == null) {
                setState(() => _step = GenerationStep.input);
              } else {
                context.pop();
              }
            },
            icon: const Icon(LucideIcons.chevronLeft, color: Color(0xFFA1A1AA)),
            style: IconButton.styleFrom(
              backgroundColor: const Color(0xFF1C1C1F),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
          Text(
            widget.editTopic != null ? 'Edit Topic' : 'Generate Topic',
            style: const TextStyle(
              color: Color(0xFFFAFAFA),
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(width: 48), // Spacer
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_step) {
      case GenerationStep.input:
        return _buildInputStep();
      case GenerationStep.generating:
        return _buildGeneratingStep();
      case GenerationStep.preview:
        return _buildPreviewStep();
      case GenerationStep.saving:
        return _buildSavingStep();
    }
  }

  Widget _buildInputStep() {
    return SingleChildScrollView(
      key: const ValueKey('input_step'),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildLabel('Topic'),
          _buildTextField(_titleCtrl, 'e.g., Two-Way Prepositions'),
          const SizedBox(height: 24),
          _buildLabel('Level'),
          _buildLevelSelector(),
          const SizedBox(height: 24),
          _buildLabel('Context / Notes (Optional)'),
          _buildTextField(
            _contextCtrl,
            'Any specific focus or examples...',
            maxLines: 5,
          ),
          const SizedBox(height: 24),
          if (_error.isNotEmpty) _buildError(),
          const SizedBox(height: 32),
          _buildPrimaryButton(
            label: 'Generate with AI',
            icon: LucideIcons.sparkles,
            onPressed: _handleGenerate,
            gradient: const [Color(0xFF6366F1), Color(0xFF8B5CF6)],
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: -0.1, end: 0);
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFA1A1AA),
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController ctrl,
    String hint, {
    int maxLines = 1,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1F),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: TextField(
        controller: ctrl,
        maxLines: maxLines,
        style: const TextStyle(color: Color(0xFFFAFAFA)),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: Color(0xFF71717A)),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildLevelSelector() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1F),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: _levels.map((l) {
          final isSelected = _level == l;
          return Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _level = l),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF27272A)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    l,
                    style: TextStyle(
                      color: isSelected
                          ? const Color(0xFFFAFAFA)
                          : const Color(0xFF71717A),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildGeneratingStep() {
    return Column(
      key: const ValueKey('generating_step'),
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 100,
              height: 100,
              child: CircularProgressIndicator(
                strokeWidth: 4,
                valueColor: AlwaysStoppedAnimation<Color>(
                  const Color(0xFF6366F1),
                ),
                backgroundColor: const Color(0xFF27272A),
              ),
            ),
            const Icon(
              LucideIcons.sparkles,
              color: Color(0xFF6366F1),
              size: 40,
            ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 1500.ms),
          ],
        ),
        const SizedBox(height: 32),
        const Text(
          'Generating Content',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Consulting grammar rules...',
          style: TextStyle(color: Color(0xFFA1A1AA)),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildPreviewStep() {
    if (_generatedTopic == null) return const SizedBox();

    return Padding(
      key: const ValueKey('preview_step'),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFF141416),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel('Title'),
                    _buildTextField(_titleCtrl, 'Title'),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Category'),
                              _buildCategoryDropdown(),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildLabel('Level'),
                              _buildLevelSelector(),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Draft Preview'.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFF71717A),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _generatedTopic!.content,
                      style: const TextStyle(
                        color: Color(0xFFA1A1AA),
                        fontSize: 13,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _buildSecondaryButton(
                  label: 'Retry',
                  icon: LucideIcons.refreshCw,
                  onPressed: () => setState(() => _step = GenerationStep.input),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 2,
                child: _buildPrimaryButton(
                  label: widget.editTopic != null
                      ? 'Update Topic'
                      : 'Save Topic',
                  icon: LucideIcons.save,
                  onPressed: _handleSave,
                  gradient: const [Color(0xFF22C55E), Color(0xFF14B8A6)],
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideX(begin: 0.1, end: 0);
  }

  Widget _buildCategoryDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1F),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: DropdownButton<String>(
        value: _generatedTopic?.category ?? 'uncategorized',
        isExpanded: true,
        underline: const SizedBox(),
        dropdownColor: const Color(0xFF1C1C1F),
        style: const TextStyle(
          color: Color(0xFFA1A1AA),
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
        items: _categories
            .map(
              (cat) =>
                  DropdownMenuItem(value: cat, child: Text(cat.toUpperCase())),
            )
            .toList(),
        onChanged: (val) {
          if (val != null) {
            setState(() {
              _generatedTopic = GrammarTopic(
                id: _generatedTopic!.id,
                title: _generatedTopic!.title,
                level: _generatedTopic!.level,
                category: val,
                content: _generatedTopic!.content,
                examples: _generatedTopic!.examples,
              );
            });
          }
        },
      ),
    );
  }

  Widget _buildSavingStep() {
    return Column(
      key: const ValueKey('saving_step'),
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const CircularProgressIndicator(color: Color(0xFF22C55E)),
        const SizedBox(height: 20),
        const Text(
          'Saving to library...',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
      ],
    ).animate().fadeIn();
  }

  Widget _buildError() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withAlpha(25),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.red.withAlpha(76)),
      ),
      child: Text(
        _error,
        style: const TextStyle(color: Color(0xFFEF4444), fontSize: 13),
      ),
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
    required List<Color> gradient,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: gradient,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: gradient[0].withAlpha(76),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSecondaryButton({
    required String label,
    required IconData icon,
    required VoidCallback onPressed,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFF1C1C1F),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: const Color(0xFFA1A1AA), size: 18),
            const SizedBox(width: 8),
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFFA1A1AA),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
