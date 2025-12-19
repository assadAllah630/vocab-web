import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ArticleDisplayScreen extends StatefulWidget {
  final Map<String, dynamic> content;
  final String? title;
  final String? level;
  final String? topic;

  const ArticleDisplayScreen({
    super.key,
    required this.content,
    this.title,
    this.level,
    this.topic,
  });

  @override
  State<ArticleDisplayScreen> createState() => _ArticleDisplayScreenState();
}

class _ArticleDisplayScreenState extends State<ArticleDisplayScreen> {
  // -1 means no section expanded
  int _expandedSection = 0;
  final Map<int, bool> _showTranslation = {};

  double _fontSize = 16.0;
  bool _showTools = false;

  // TTS
  final FlutterTts _flutterTts = FlutterTts();
  bool _isSpeaking = false;
  int? _speakingSection;

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  Future<void> _initTts() async {
    await _flutterTts.setLanguage("de-DE");
    await _flutterTts.setSpeechRate(0.85);

    _flutterTts.setCompletionHandler(() {
      if (mounted) {
        setState(() {
          _isSpeaking = false;
          _speakingSection = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _flutterTts.stop();
    super.dispose();
  }

  Future<void> _speakSection(int index, String text) async {
    if (_isSpeaking && _speakingSection == index) {
      await _flutterTts.stop();
      setState(() {
        _isSpeaking = false;
        _speakingSection = null;
      });
      return;
    }

    await _flutterTts.stop();
    // Clean text: remove markdown bold
    final cleanText = text.replaceAll('**', '');

    setState(() {
      _isSpeaking = true;
      _speakingSection = index;
    });

    await _flutterTts.speak(cleanText);
  }

  void _adjustFontSize(double delta) {
    setState(() {
      _fontSize = (_fontSize + delta).clamp(14.0, 24.0);
    });
  }

  // Render styled text with vocabulary highlights
  Widget _buildStyledText(String text, {required double fontSize}) {
    if (text.isEmpty) return const SizedBox.shrink();

    // Logic to interleave regular text and spans
    // Removing unused regexp variables
    List<InlineSpan> spans = [];

    // Logic to interleave regular text and matches
    // Note: split can behave differently, let's use a robust parser loop for **bold** highlighting

    // Simpler approach: split by ** and check index parity if the string starts with/without logic
    // But RegExp split handling in Dart is tricky. Let's do a manual scan or assume odd indices if starts with text.
    // Actually, let's use a simpler verified approach:
    List<String> splitParts = text.split('**');

    for (int i = 0; i < splitParts.length; i++) {
      if (i % 2 == 1) {
        // Highlighted part
        spans.add(
          WidgetSpan(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(4),
                border: Border(
                  bottom: BorderSide(
                    color: const Color(0xFF10B981).withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: Text(
                splitParts[i],
                style: TextStyle(
                  color: const Color(0xFF34D399),
                  fontWeight: FontWeight.bold,
                  fontSize: fontSize,
                ),
              ),
            ),
          ),
        );
      } else {
        // Normal text
        spans.add(
          TextSpan(
            text: splitParts[i],
            style: TextStyle(
              color: const Color(0xFFE4E4E7),
              fontSize: fontSize,
              height: 1.6,
            ),
          ),
        );
      }
    }

    return RichText(text: TextSpan(children: spans));
  }

  @override
  Widget build(BuildContext context) {
    // Content data usually has 'sections' or 'paragraphs'
    final rawSections =
        widget.content['sections'] ?? widget.content['paragraphs'];
    final List sections = (rawSections is List) ? rawSections : [];

    final safeTitle = widget.title ?? widget.content['title'] ?? 'Article';
    final vocabulary = (widget.content['vocabulary'] as List?) ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                border: const Border(
                  bottom: BorderSide(color: Color(0xFF27272A)),
                ),
                gradient: LinearGradient(
                  colors: [
                    const Color(0xFF10B981).withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              safeTitle,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                if (widget.level != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(
                                        0xFF10B981,
                                      ).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      widget.level!,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF34D399),
                                      ),
                                    ),
                                  ),
                                const SizedBox(width: 8),
                                Text(
                                  '${sections.length} paragraphs',
                                  style: const TextStyle(
                                    color: Color(0xFF71717A),
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () =>
                            setState(() => _showTools = !_showTools),
                        style: IconButton.styleFrom(
                          backgroundColor: _showTools
                              ? const Color(0xFF10B981)
                              : const Color(0xFF27272A),
                          foregroundColor: _showTools
                              ? Colors.white
                              : const Color(0xFFA1A1AA),
                        ),
                        icon: const Icon(
                          LucideIcons.slidersHorizontal,
                          size: 20,
                        ),
                      ),
                    ],
                  ),

                  // Tools Panel
                  AnimatedSize(
                    duration: 200.ms,
                    child: _showTools
                        ? Padding(
                            padding: const EdgeInsets.only(top: 12),
                            child: Row(
                              children: [
                                // Font Size
                                Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF18181B),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    children: [
                                      _ToolBtn(
                                        label: 'A-',
                                        onTap: () => _adjustFontSize(-1),
                                      ),
                                      SizedBox(
                                        width: 32,
                                        child: Text(
                                          _fontSize.toInt().toString(),
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            color: Color(0xFF71717A),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      _ToolBtn(
                                        label: 'A+',
                                        onTap: () => _adjustFontSize(1),
                                      ),
                                    ],
                                  ),
                                ),
                                const Spacer(),
                                // Translate All
                                GestureDetector(
                                  onTap: () {
                                    // Toggle all
                                    final allShown = sections
                                        .asMap()
                                        .keys
                                        .every(
                                          (k) => _showTranslation[k] == true,
                                        );
                                    setState(() {
                                      for (
                                        int i = 0;
                                        i < sections.length;
                                        i++
                                      ) {
                                        _showTranslation[i] = !allShown;
                                      }
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF18181B),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(
                                          LucideIcons.languages,
                                          size: 14,
                                          color: Color(0xFFA1A1AA),
                                        ),
                                        SizedBox(width: 6),
                                        Text(
                                          'Translate All',
                                          style: TextStyle(
                                            color: Color(0xFFA1A1AA),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          )
                        : const SizedBox.shrink(),
                  ),
                ],
              ),
            ),

            // Article Sections
            Expanded(
              child: Stack(
                children: [
                  ListView.builder(
                    padding: const EdgeInsets.fromLTRB(
                      0,
                      0,
                      0,
                      80,
                    ), // Padding for vocab footer
                    itemCount: sections.length,
                    itemBuilder: (context, index) {
                      final section = sections[index];
                      final isExpanded = _expandedSection == index;
                      final heading =
                          section['heading'] ??
                          section['title'] ??
                          'Paragraph ${index + 1}';
                      final contentText = section['content'] ?? '';
                      final translationText = section['translation'];

                      return Container(
                        decoration: const BoxDecoration(
                          border: Border(
                            bottom: BorderSide(color: Color(0xFF1F1F23)),
                          ),
                        ),
                        child: Column(
                          children: [
                            // Header
                            InkWell(
                              onTap: () => setState(
                                () =>
                                    _expandedSection = isExpanded ? -1 : index,
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 16,
                                ),
                                color: const Color(0xFF0D0D0F),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 28,
                                      height: 28,
                                      decoration: const BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Color(0xFF10B981),
                                            Color(0xFF059669),
                                          ],
                                        ),
                                        shape: BoxShape.circle,
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        '${index + 1}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Text(
                                        heading,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ),
                                    Icon(
                                          LucideIcons.chevronDown,
                                          size: 18,
                                          color: const Color(0xFF52525B),
                                        )
                                        .animate(target: isExpanded ? 1 : 0)
                                        .rotate(begin: 0, end: 0.5),
                                  ],
                                ),
                              ),
                            ),

                            // Content
                            AnimatedSize(
                              duration: 300.ms,
                              alignment: Alignment.topCenter,
                              child: isExpanded
                                  ? Container(
                                      color: const Color(0xFF0A0A0C),
                                      padding: const EdgeInsets.all(16),
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          // Tools
                                          Row(
                                            children: [
                                              _ActionBtn(
                                                icon:
                                                    _isSpeaking &&
                                                        _speakingSection ==
                                                            index
                                                    ? LucideIcons.square
                                                    : LucideIcons.volume2,
                                                label:
                                                    _isSpeaking &&
                                                        _speakingSection ==
                                                            index
                                                    ? 'Stop'
                                                    : 'Listen',
                                                isActive:
                                                    _isSpeaking &&
                                                    _speakingSection == index,
                                                color: const Color(
                                                  0xFFEF4444,
                                                ), // red for stop/active
                                                onTap: () => _speakSection(
                                                  index,
                                                  contentText,
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              if (translationText != null)
                                                _ActionBtn(
                                                  icon: LucideIcons.languages,
                                                  label:
                                                      (_showTranslation[index] ??
                                                          false)
                                                      ? 'Original'
                                                      : 'Translate',
                                                  isActive:
                                                      _showTranslation[index] ??
                                                      false,
                                                  color: const Color(
                                                    0xFF6366F1,
                                                  ),
                                                  onTap: () => setState(
                                                    () => _showTranslation[index] =
                                                        !(_showTranslation[index] ??
                                                            false),
                                                  ),
                                                ),
                                            ],
                                          ),
                                          const SizedBox(height: 16),

                                          // Text content
                                          if (_showTranslation[index] ?? false)
                                            Text(
                                              translationText!,
                                              style: TextStyle(
                                                color: const Color(0xFFA1A1AA),
                                                fontStyle: FontStyle.italic,
                                                fontSize: _fontSize,
                                                height: 1.6,
                                              ),
                                            )
                                          else
                                            _buildStyledText(
                                              contentText,
                                              fontSize: _fontSize,
                                            ),
                                        ],
                                      ),
                                    )
                                  : const SizedBox.shrink(),
                            ),
                          ],
                        ),
                      );
                    },
                  ),

                  // Vocabulary Footer
                  if (vocabulary.isNotEmpty)
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(
                            0xFF18181B,
                          ).withValues(alpha: 0.95),
                          border: const Border(
                            top: BorderSide(color: Color(0xFF27272A)),
                          ),
                        ),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              const Icon(
                                LucideIcons.sparkles,
                                size: 16,
                                color: Color(0xFFF59E0B),
                              ),
                              const SizedBox(width: 8),
                              ...vocabulary.map(
                                (word) => Container(
                                  margin: const EdgeInsets.only(right: 8),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF27272A),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    word.toString(),
                                    style: const TextStyle(
                                      color: Color(0xFF34D399),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ToolBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _ToolBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? color : const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(8),
          border: isActive ? null : Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? Colors.white : const Color(0xFFA1A1AA),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                color: isActive ? Colors.white : const Color(0xFFA1A1AA),
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
