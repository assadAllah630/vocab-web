import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';

class ArticleDisplay extends StatefulWidget {
  final Map<String, dynamic> content;
  final String? title;
  final String? level;
  final String? topic;

  const ArticleDisplay({
    super.key,
    required this.content,
    this.title,
    this.level,
    this.topic,
  });

  @override
  State<ArticleDisplay> createState() => _ArticleDisplayState();
}

class _ArticleDisplayState extends State<ArticleDisplay> {
  late FlutterTts flutterTts;
  int _expandedSection = 0;
  final Map<int, bool> _showTranslation = {};
  double _fontSize = 16;
  bool _isSpeaking = false;
  int? _speakingSection;
  bool _showTools = false;
  final Map<int, bool> _bookmarkedSections = {};

  List<dynamic> get _sections =>
      widget.content['sections'] ?? widget.content['paragraphs'] ?? [];

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  void _initTts() {
    flutterTts = FlutterTts();
    flutterTts.setLanguage("de-DE");
    flutterTts.setStartHandler(() {
      setState(() => _isSpeaking = true);
    });
    flutterTts.setCompletionHandler(() {
      setState(() {
        _isSpeaking = false;
        _speakingSection = null;
      });
    });
    flutterTts.setErrorHandler((msg) {
      setState(() {
        _isSpeaking = false;
        _speakingSection = null;
      });
    });
  }

  Future<void> _speak(int index, String text) async {
    if (_isSpeaking && _speakingSection == index) {
      await flutterTts.stop();
      setState(() {
        _isSpeaking = false;
        _speakingSection = null;
      });
      return;
    }

    String cleanText = text.replaceAll('**', '');
    await flutterTts.stop();
    setState(() => _speakingSection = index);
    await flutterTts.speak(cleanText);
  }

  @override
  void dispose() {
    flutterTts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: _buildHeader(),
      body: Stack(
        children: [
          ListView.builder(
            padding: const EdgeInsets.only(bottom: 100),
            itemCount: _sections.length,
            itemBuilder: (context, index) {
              final section = _sections[index];
              return _buildSectionItem(index, section);
            },
          ),
          if (widget.content['vocabulary'] != null)
            _buildVocabularyFooter(widget.content['vocabulary']),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    return PreferredSize(
      preferredSize: Size.fromHeight(_showTools ? 120 : 70),
      child: Container(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        decoration: BoxDecoration(
          color: const Color(0xFF09090B),
          border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          gradient: LinearGradient(
            colors: [
              const Color(0xFF10B981).withValues(alpha: 0.1),
              Colors.transparent,
            ],
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.title ?? widget.content['title'] ?? 'Article',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (widget.level != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(
                                    0xFF10B981,
                                  ).withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
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
                              '${_sections.length} paragraphs',
                              style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF71717A),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => setState(() => _showTools = !_showTools),
                    icon: Icon(
                      LucideIcons.sliders,
                      color: _showTools
                          ? const Color(0xFF10B981)
                          : const Color(0xFFA1A1AA),
                    ),
                    style: IconButton.styleFrom(
                      backgroundColor: _showTools
                          ? const Color(0xFF10B981).withValues(alpha: 0.2)
                          : const Color(0xFF27272A),
                      padding: const EdgeInsets.all(8),
                    ),
                  ),
                ],
              ),
            ),
            if (_showTools)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          _buildFontButton(false),
                          Container(
                            width: 30,
                            alignment: Alignment.center,
                            child: Text(
                              _fontSize.toInt().toString(),
                              style: const TextStyle(
                                color: Color(0xFF71717A),
                                fontSize: 12,
                              ),
                            ),
                          ),
                          _buildFontButton(true),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    TextButton.icon(
                      onPressed: () {
                        final allShown = _sections.asMap().keys.every(
                          (i) => _showTranslation[i] ?? false,
                        );
                        setState(() {
                          for (var i = 0; i < _sections.length; i++) {
                            _showTranslation[i] = !allShown;
                          }
                        });
                      },
                      icon: const Icon(LucideIcons.languages, size: 16),
                      label: const Text(
                        'Translate All',
                        style: TextStyle(fontSize: 12),
                      ),
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFFA1A1AA),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn().scaleXY(
                begin: 1,
                end: 1,
                alignment: Alignment.topCenter,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFontButton(bool increase) {
    return InkWell(
      onTap: () {
        setState(() {
          _fontSize = (_fontSize + (increase ? 1 : -1)).clamp(14.0, 24.0);
        });
      },
      child: Container(
        width: 28,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(4),
        ),
        child: Text(
          increase ? 'A+' : 'A-',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildSectionItem(int index, dynamic section) {
    final isExpanded = _expandedSection == index;

    return Container(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFF1F1F23))),
      ),
      child: Column(
        children: [
          // Header
          InkWell(
            onTap: () {
              setState(() {
                _expandedSection = _expandedSection == index ? -1 : index;
              });
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              color: const Color(0xFF0D0D0F),
              child: Row(
                children: [
                  Container(
                    width: 28,
                    height: 28,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: LinearGradient(
                        colors: [Color(0xFF10B981), Color(0xFF059669)],
                      ),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      section['heading'] ??
                          section['title'] ??
                          'Paragraph ${index + 1}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                      ),
                    ),
                  ),
                  if (_bookmarkedSections[index] == true)
                    const Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: Icon(
                        Icons.bookmark,
                        color: Color(0xFFF59E0B),
                        size: 16,
                      ),
                    ),
                  Icon(
                        LucideIcons.chevronDown,
                        color: const Color(0xFF52525B),
                        size: 20,
                      )
                      .animate(target: isExpanded ? 1 : 0)
                      .rotate(begin: 0, end: 0.5),
                ],
              ),
            ),
          ),

          // Expanded Content
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Container(
              color: const Color(0xFF0A0A0C),
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Action Bar
                  Row(
                    children: [
                      _buildActionButton(
                        icon: _isSpeaking && _speakingSection == index
                            ? LucideIcons.stopCircle
                            : LucideIcons.volume2,
                        label: _isSpeaking && _speakingSection == index
                            ? 'Stop'
                            : 'Listen',
                        isActive: _isSpeaking && _speakingSection == index,
                        activeColor: const Color(0xFFEF4444),
                        onTap: () => _speak(index, section['content']),
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: LucideIcons.languages,
                        label: _showTranslation[index] == true
                            ? 'Original'
                            : 'Translate',
                        isActive: _showTranslation[index] == true,
                        activeColor: const Color(0xFF10B981),
                        onTap: () {
                          setState(() {
                            _showTranslation[index] =
                                !(_showTranslation[index] ?? false);
                          });
                        },
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: _bookmarkedSections[index] == true
                            ? Icons.bookmark
                            : LucideIcons.bookmark,
                        label: '',
                        isActive: _bookmarkedSections[index] == true,
                        activeColor: const Color(0xFFF59E0B),
                        onTap: () {
                          setState(() {
                            _bookmarkedSections[index] =
                                !(_bookmarkedSections[index] ?? false);
                          });
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Text Content
                  _showTranslation[index] == true
                      ? Text(
                          section['translation'] ?? 'Translation not available',
                          style: TextStyle(
                            fontSize: _fontSize,
                            color: const Color(0xFFA1A1AA),
                            fontStyle: FontStyle.italic,
                            height: 1.85,
                          ),
                        )
                      : _renderStyledText(section['content'] ?? ''),
                ],
              ),
            ),
            crossFadeState: isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 300),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    bool isActive = false,
    Color activeColor = Colors.blue,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive
              ? activeColor.withValues(alpha: 0.1)
              : const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(8),
          border: isActive
              ? Border.all(color: activeColor.withValues(alpha: 0.3))
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isActive ? activeColor : const Color(0xFFA1A1AA),
            ),
            if (label.isNotEmpty) ...[
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: isActive ? activeColor : const Color(0xFFA1A1AA),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _renderStyledText(String text) {
    if (text.isEmpty) return const SizedBox.shrink();

    final spans = <InlineSpan>[];
    final parts = text.split(RegExp(r'(\*\*.+?\*\*)'));

    for (var part in parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        spans.add(
          TextSpan(
            text: part.substring(2, part.length - 2),
            style: TextStyle(
              color: const Color(0xFF34D399),
              fontWeight: FontWeight.w600,
              backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
            ),
          ),
        );
      } else {
        spans.add(TextSpan(text: part));
      }
    }

    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: _fontSize,
          color: const Color(0xFFE4E4E7),
          height: 1.85,
          fontFamily: AppTheme.fontFamily,
        ),
        children: spans,
      ),
    );
  }

  Widget _buildVocabularyFooter(List<dynamic> vocabulary) {
    return Positioned(
      bottom: 20,
      left: 0,
      right: 0,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B).withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.2),
              blurRadius: 10,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(
              LucideIcons.sparkles,
              size: 16,
              color: Color(0xFFF59E0B),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: vocabulary.map<Widget>((word) {
                    return Container(
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF27272A),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        word.toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF34D399),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
