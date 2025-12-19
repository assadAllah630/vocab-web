import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_tts/flutter_tts.dart';
import '../../shared/widgets/markdown_renderer.dart';

class StoryDisplayScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> content;
  final String? title;
  final String? level;

  const StoryDisplayScreen({
    super.key,
    required this.content,
    this.title,
    this.level,
  });

  @override
  ConsumerState<StoryDisplayScreen> createState() => _StoryDisplayScreenState();
}

class _StoryDisplayScreenState extends ConsumerState<StoryDisplayScreen> {
  int _expandedEvent = 0;
  final Map<int, bool> _showTranslation = {};
  final Map<int, bool> _bookmarkedEvents = {};
  double _fontSize = 16.0;

  // TTS
  final FlutterTts _flutterTts = FlutterTts();
  bool _isSpeaking = false;
  int? _speakingEvent;

  bool _showTools = false;

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  Future<void> _initTts() async {
    await _flutterTts.setLanguage("de-DE");
    await _flutterTts.setSpeechRate(0.85); // Match React's 0.85

    _flutterTts.setCompletionHandler(() {
      if (mounted) {
        setState(() {
          _isSpeaking = false;
          _speakingEvent = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _flutterTts.stop();
    super.dispose();
  }

  Future<void> _speakEvent(int index, String text) async {
    if (_isSpeaking && _speakingEvent == index) {
      await _flutterTts.stop();
      setState(() {
        _isSpeaking = false;
        _speakingEvent = null;
      });
      return;
    }

    await _flutterTts.stop();
    // Clean text: remove markdown bold markers
    final cleanText = text.replaceAll('**', '');

    setState(() {
      _isSpeaking = true;
      _speakingEvent = index;
    });

    await _flutterTts.speak(cleanText);
  }

  void _toggleTranslation(int index) {
    setState(() {
      _showTranslation[index] = !(_showTranslation[index] ?? false);
    });
  }

  void _toggleBookmark(int index) {
    setState(() {
      _bookmarkedEvents[index] = !(_bookmarkedEvents[index] ?? false);
    });
  }

  @override
  Widget build(BuildContext context) {
    // Support both 'events' and 'chapters' field keys
    final List events =
        widget.content['events'] ?? widget.content['chapters'] ?? [];
    final safeTitle =
        widget.title ?? widget.content['title'] ?? 'Untitled Story';

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
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    const Color(0xFF8B5CF6).withValues(alpha: 0.1),
                    Colors.transparent,
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                                height: 1.2,
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
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    margin: const EdgeInsets.only(right: 8),
                                    decoration: BoxDecoration(
                                      color: const Color(
                                        0xFF8B5CF6,
                                      ).withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(100),
                                    ),
                                    child: Text(
                                      widget.level!,
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFA78BFA),
                                      ),
                                    ),
                                  ),
                                Text(
                                  '${events.length} chapters',
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
                        onPressed: () =>
                            setState(() => _showTools = !_showTools),
                        icon: const Icon(LucideIcons.settings2),
                        style: IconButton.styleFrom(
                          backgroundColor: _showTools
                              ? const Color(0xFF8B5CF6)
                              : const Color(0xFF27272A),
                          foregroundColor: _showTools
                              ? Colors.white
                              : const Color(0xFFA1A1AA),
                          padding: const EdgeInsets.all(8),
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ],
                  ),

                  // Tools Panel
                  AnimatedSize(
                    duration: 300.ms,
                    child: _showTools
                        ? Padding(
                            padding: const EdgeInsets.only(top: 12),
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
                                      _ToolBtn(
                                        'A-',
                                        () => setState(() {
                                          if (_fontSize > 12) _fontSize -= 1;
                                        }),
                                      ),
                                      SizedBox(
                                        width: 32,
                                        child: Text(
                                          '${_fontSize.toInt()}',
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(
                                            color: Color(0xFF71717A),
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                      _ToolBtn(
                                        'A+',
                                        () => setState(() {
                                          if (_fontSize < 24) _fontSize += 1;
                                        }),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: () {
                                    final allShown = events.asMap().keys.every(
                                      (i) => _showTranslation[i] ?? false,
                                    );
                                    setState(() {
                                      for (var i = 0; i < events.length; i++) {
                                        _showTranslation[i] = !allShown;
                                      }
                                    });
                                  },
                                  icon: const Icon(
                                    LucideIcons.languages,
                                    size: 16,
                                  ),
                                  label: const Text('Translate All'),
                                  style: TextButton.styleFrom(
                                    backgroundColor: const Color(0xFF18181B),
                                    foregroundColor: const Color(0xFFA1A1AA),
                                    textStyle: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(8),
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

            // Content
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.only(bottom: 100),
                itemCount: events.length,
                itemBuilder: (context, index) {
                  final event = events[index];
                  final isExpanded = _expandedEvent == index;
                  final showTrans = _showTranslation[index] ?? false;
                  final isBookmarked = _bookmarkedEvents[index] ?? false;
                  final isCurrentlySpeaking =
                      _isSpeaking && _speakingEvent == index;

                  return Container(
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(color: Color(0xFF1F1F23)),
                      ),
                    ),
                    child: Column(
                      children: [
                        // Chapter Header
                        InkWell(
                          onTap: () => setState(() {
                            _expandedEvent = (_expandedEvent == index)
                                ? -1
                                : index;
                          }),
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
                                      colors: [
                                        Color(0xFF8B5CF6),
                                        Color(0xFF7C3AED),
                                      ],
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
                                    event['title'] ??
                                        event['heading'] ??
                                        'Chapter ${index + 1}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                ),
                                if (isBookmarked)
                                  const Padding(
                                    padding: EdgeInsets.only(right: 8),
                                    child: Icon(
                                      Icons.bookmark,
                                      size: 16,
                                      color: Color(0xFFF59E0B),
                                    ),
                                  ),
                                Icon(
                                      LucideIcons.chevronDown,
                                      size: 20,
                                      color: const Color(0xFF52525B),
                                    )
                                    .animate(target: isExpanded ? 1 : 0)
                                    .rotate(begin: 0, end: 0.5),
                              ],
                            ),
                          ),
                        ),

                        // Chapter Content
                        AnimatedSize(
                          duration: 300.ms,
                          alignment: Alignment.topCenter,
                          child: isExpanded
                              ? Container(
                                  color: const Color(0xFF0A0A0C),
                                  padding: const EdgeInsets.fromLTRB(
                                    16,
                                    8,
                                    16,
                                    16,
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Action Bar
                                      Padding(
                                        padding: const EdgeInsets.only(
                                          bottom: 16,
                                        ),
                                        child: Row(
                                          children: [
                                            _ActionChip(
                                              icon: isCurrentlySpeaking
                                                  ? LucideIcons.square
                                                  : LucideIcons.volume2,
                                              label: isCurrentlySpeaking
                                                  ? 'Stop'
                                                  : 'Listen',
                                              isActive: isCurrentlySpeaking,
                                              activeColor: const Color(
                                                0xFFEF4444,
                                              ),
                                              onTap: () => _speakEvent(
                                                index,
                                                event['content'],
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            _ActionChip(
                                              icon: LucideIcons.languages,
                                              label: showTrans
                                                  ? 'Original'
                                                  : 'Translate',
                                              isActive: showTrans,
                                              activeColor: const Color(
                                                0xFF6366F1,
                                              ),
                                              onTap: () =>
                                                  _toggleTranslation(index),
                                            ),
                                            const Spacer(),
                                            IconButton(
                                              icon: Icon(
                                                isBookmarked
                                                    ? Icons.bookmark
                                                    : Icons.bookmark_border,
                                                size: 20,
                                                color: isBookmarked
                                                    ? const Color(0xFFF59E0B)
                                                    : const Color(0xFFA1A1AA),
                                              ),
                                              onPressed: () =>
                                                  _toggleBookmark(index),
                                              constraints:
                                                  const BoxConstraints(),
                                              padding: const EdgeInsets.all(8),
                                              style: IconButton.styleFrom(
                                                backgroundColor: isBookmarked
                                                    ? const Color(
                                                        0xFFF59E0B,
                                                      ).withValues(alpha: 0.2)
                                                    : const Color(0xFF18181B),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Image
                                      if (event['image_status'] != null &&
                                          event['image_status'] != 'none')
                                        Container(
                                          margin: const EdgeInsets.only(
                                            bottom: 16,
                                          ),
                                          width: double.infinity,
                                          height: 192,
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF1F1F23),
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          clipBehavior: Clip.antiAlias,
                                          child: _buildImage(event),
                                        ),

                                      // Text Content
                                      if (showTrans)
                                        Text(
                                          event['translation'] ??
                                              'Translation not available',
                                          style: TextStyle(
                                            fontSize: _fontSize,
                                            color: const Color(0xFFA1A1AA),
                                            fontStyle: FontStyle.italic,
                                            height: 1.6,
                                          ),
                                        )
                                      else
                                        MarkdownRenderer(
                                          content: event['content'] ?? '',
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
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(Map event) {
    switch (event['image_status']) {
      case 'completed':
        if (event['image_base64'] != null) {
          return Image.memory(
            base64Decode(event['image_base64']),
            fit: BoxFit.cover,
          );
        }
        return const Center(
          child: Icon(LucideIcons.imageOff, color: Color(0xFF52525B)),
        );
      case 'generating':
      case 'pending':
        return Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFF8B5CF6),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Generating image...',
                style: TextStyle(fontSize: 12, color: const Color(0xFF71717A)),
              ),
            ],
          ),
        );
      case 'failed':
        return const Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(LucideIcons.alertTriangle, color: Color(0xFFEF4444)),
              SizedBox(height: 4),
              Text(
                'Image generation failed',
                style: TextStyle(color: Color(0xFFEF4444), fontSize: 12),
              ),
            ],
          ),
        );
      default:
        return const SizedBox.shrink();
    }
  }
}

class _ToolBtn extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  const _ToolBtn(this.label, this.onTap);
  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 28,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: const Color(0xFF27272A),
          borderRadius: BorderRadius.circular(4),
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

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final Color activeColor;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.activeColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? activeColor : const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(8),
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
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isActive ? Colors.white : const Color(0xFFA1A1AA),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
