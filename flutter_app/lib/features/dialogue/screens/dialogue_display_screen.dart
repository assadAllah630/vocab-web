import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons/lucide_icons.dart';

class DialogueDisplayScreen extends StatefulWidget {
  final Map<String, dynamic> content;
  final String? title;
  final String? level;
  final String? tone;

  const DialogueDisplayScreen({
    super.key,
    required this.content,
    this.title,
    this.level,
    this.tone,
  });

  @override
  State<DialogueDisplayScreen> createState() => _DialogueDisplayScreenState();
}

class _DialogueDisplayScreenState extends State<DialogueDisplayScreen> {
  final Map<int, bool> _showTranslation = {};

  // TTS
  final FlutterTts _flutterTts = FlutterTts();
  bool _isSpeaking = false;
  int? _speakingIndex;

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
          _speakingIndex = null;
        });
      }
    });
  }

  @override
  void dispose() {
    _flutterTts.stop();
    super.dispose();
  }

  Future<void> _speakMessage(int index, String text) async {
    if (_isSpeaking && _speakingIndex == index) {
      await _flutterTts.stop();
      setState(() {
        _isSpeaking = false;
        _speakingIndex = null;
      });
      return;
    }

    await _flutterTts.stop();
    // Clean text: remove markdown bold markers
    final cleanText = text.replaceAll('**', '');

    setState(() {
      _isSpeaking = true;
      _speakingIndex = index;
    });

    await _flutterTts.speak(cleanText);
  }

  // Helper to determine bubble alignment and color based on speaker
  int _getSpeakerIndex(String speaker, List<String> allSpeakers) {
    return allSpeakers.indexOf(speaker);
  }

  final List<List<Color>> _avatarColors = [
    [const Color(0xFF6366F1), const Color(0xFF4F46E5)],
    [const Color(0xFF14B8A6), const Color(0xFF0D9488)],
    [const Color(0xFF8B5CF6), const Color(0xFF7C3AED)],
    [const Color(0xFF06B6D4), const Color(0xFF0891B2)],
  ];

  @override
  Widget build(BuildContext context) {
    final messages = (widget.content['messages'] as List?) ?? [];
    final uniqueSpeakers = messages
        .map((m) => m['speaker'] as String)
        .toSet()
        .toList();
    final safeTitle = widget.title ?? widget.content['title'] ?? 'Dialogue';
    final keyPhrases = (widget.content['key_phrases'] as List?) ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFF27272A))),
                color: Color(0xFF0D0D0F),
              ),
              child: Row(
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
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            if (widget.tone != null)
                              Text(
                                widget.tone!,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFFA1A1AA),
                                ),
                              ),
                            if (widget.tone != null && widget.level != null)
                              const Text(
                                ' • ',
                                style: TextStyle(color: Color(0xFF52525B)),
                              ),
                            if (widget.level != null)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 1,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF27272A),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Text(
                                  widget.level!,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Chat Area
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: messages.length + (keyPhrases.isNotEmpty ? 1 : 0),
                itemBuilder: (context, index) {
                  // Key Phrases at the bottom
                  if (index == messages.length) {
                    return _buildKeyPhrases(keyPhrases);
                  }

                  final msg = messages[index];
                  final speaker = msg['speaker'];
                  final text = msg['text'];
                  final translation = msg['translation'];

                  final speakerIdx = _getSpeakerIndex(speaker, uniqueSpeakers);
                  final isMe = speakerIdx % 2 != 0; // Alternating sides
                  final colors =
                      _avatarColors[speakerIdx % _avatarColors.length];
                  final initial = speaker.isNotEmpty
                      ? speaker[0].toUpperCase()
                      : '?';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(
                      mainAxisAlignment: isMe
                          ? MainAxisAlignment.end
                          : MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (!isMe) ...[
                          _Avatar(initial: initial, colors: colors),
                          const SizedBox(width: 10),
                        ],

                        Flexible(
                          child: Column(
                            crossAxisAlignment: isMe
                                ? CrossAxisAlignment.end
                                : CrossAxisAlignment.start,
                            children: [
                              // Bubble
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                decoration: BoxDecoration(
                                  color: isMe
                                      ? colors[0].withValues(
                                          alpha: 0.2,
                                        ) // Tinted background for "Me"
                                      : const Color(0xFF27272A),
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: isMe
                                        ? const Radius.circular(16)
                                        : const Radius.circular(2),
                                    bottomRight: isMe
                                        ? const Radius.circular(2)
                                        : const Radius.circular(16),
                                  ),
                                  border: isMe
                                      ? Border.all(
                                          color: colors[0].withValues(
                                            alpha: 0.5,
                                          ),
                                        )
                                      : null,
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      text, // We could parse **bold** here if we want rich text
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 15,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Tools Row
                              Padding(
                                padding: const EdgeInsets.only(top: 6),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    // Listen
                                    InkWell(
                                      onTap: () => _speakMessage(index, text),
                                      child: Row(
                                        children: [
                                          Icon(
                                            _isSpeaking &&
                                                    _speakingIndex == index
                                                ? LucideIcons.square
                                                : LucideIcons.volume2,
                                            size: 12,
                                            color:
                                                _isSpeaking &&
                                                    _speakingIndex == index
                                                ? const Color(0xFFEF4444)
                                                : const Color(0xFF71717A),
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            _isSpeaking &&
                                                    _speakingIndex == index
                                                ? 'Stop'
                                                : 'Listen',
                                            style: TextStyle(
                                              fontSize: 11,
                                              color:
                                                  _isSpeaking &&
                                                      _speakingIndex == index
                                                  ? const Color(0xFFEF4444)
                                                  : const Color(0xFF71717A),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),

                                    if (translation != null) ...[
                                      const SizedBox(width: 12),
                                      InkWell(
                                        onTap: () {
                                          setState(() {
                                            _showTranslation[index] =
                                                !(_showTranslation[index] ??
                                                    false);
                                          });
                                        },
                                        child: Row(
                                          children: [
                                            const Icon(
                                              LucideIcons.languages,
                                              size: 12,
                                              color: Color(0xFF71717A),
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              (_showTranslation[index] ?? false)
                                                  ? 'Hide'
                                                  : 'Translate',
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: Color(0xFF71717A),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),

                              // Translation Box
                              AnimatedSize(
                                duration: 200.ms,
                                alignment: Alignment.topCenter,
                                child:
                                    (_showTranslation[index] ?? false) &&
                                        translation != null
                                    ? Container(
                                        margin: const EdgeInsets.only(top: 8),
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 8,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF18181B),
                                          border: Border(
                                            left: BorderSide(
                                              color: isMe
                                                  ? colors[0]
                                                  : const Color(0xFF52525B),
                                              width: 2,
                                            ),
                                          ),
                                          borderRadius: const BorderRadius.only(
                                            topRight: Radius.circular(8),
                                            bottomRight: Radius.circular(8),
                                          ),
                                        ),
                                        child: Text(
                                          translation,
                                          style: const TextStyle(
                                            color: Color(0xFFA1A1AA),
                                            fontSize: 13,
                                            fontStyle: FontStyle.italic,
                                          ),
                                        ),
                                      )
                                    : const SizedBox.shrink(),
                              ),
                            ],
                          ),
                        ),

                        if (isMe) ...[
                          const SizedBox(width: 10),
                          _Avatar(initial: initial, colors: colors),
                        ],
                      ],
                    ),
                  ).animate().fadeIn().slideY(
                    begin: 10,
                    end: 0,
                    duration: 300.ms,
                    delay: (index * 50).ms,
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildKeyPhrases(List phrases) {
    return Container(
      margin: const EdgeInsets.only(top: 24),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF27272A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(LucideIcons.sparkles, size: 16, color: Color(0xFFF59E0B)),
              SizedBox(width: 8),
              Text(
                'Key Phrases',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: phrases.map<Widget>((phrase) {
              return Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  phrase.toString(),
                  style: const TextStyle(
                    color: Color(0xFFD4D4D8),
                    fontSize: 12,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String initial;
  final List<Color> colors;

  const _Avatar({required this.initial, required this.colors});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 32,
      height: 32,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Text(
        initial,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    );
  }
}
