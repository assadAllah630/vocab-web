import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:lucide_icons/lucide_icons.dart';

class DialogueDisplay extends StatefulWidget {
  final Map<String, dynamic> content;
  final String? title;
  final String? level;
  final String? topic;

  const DialogueDisplay({
    super.key,
    required this.content,
    this.title,
    this.level,
    this.topic,
  });

  @override
  State<DialogueDisplay> createState() => _DialogueDisplayState();
}

class _DialogueDisplayState extends State<DialogueDisplay> {
  late FlutterTts flutterTts;
  final Map<int, bool> _showTranslation = {};
  bool _isSpeaking = false;
  int? _speakingIndex;

  List<dynamic> get _messages =>
      widget.content['dialogue'] ?? widget.content['messages'] ?? [];

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
        _speakingIndex = null;
      });
    });
    flutterTts.setErrorHandler((msg) {
      setState(() {
        _isSpeaking = false;
        _speakingIndex = null;
      });
    });
  }

  Future<void> _speak(int index, String text, String speaker) async {
    if (_isSpeaking && _speakingIndex == index) {
      await flutterTts.stop();
      setState(() {
        _isSpeaking = false;
        _speakingIndex = null;
      });
      return;
    }

    // Attempt to set voice based on speaker (basic gender guess or random)
    // This is a simplification; real app would map speakers to voices
    await flutterTts.stop();
    setState(() => _speakingIndex = index);
    await flutterTts.speak(text);
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
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageBubble(index, message);
              },
            ),
          ),
          if (widget.content['vocabulary'] != null)
            _buildVocabularyFooter(widget.content['vocabulary']),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildHeader() {
    return PreferredSize(
      preferredSize: const Size.fromHeight(70),
      child: Container(
        padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top),
        decoration: BoxDecoration(
          color: const Color(0xFF09090B),
          border: Border(
            bottom: BorderSide(color: Colors.white.withValues(alpha: 0.1)),
          ),
          gradient: LinearGradient(
            colors: [
              const Color(
                0xFFEC4899,
              ).withValues(alpha: 0.1), // Pink for dialogue
              Colors.transparent,
            ],
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title ?? widget.content['title'] ?? 'Dialogue',
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
                        if (widget.level != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(
                                0xFFEC4899,
                              ).withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              widget.level!,
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFF472B6),
                              ),
                            ),
                          ),
                        const SizedBox(width: 8),
                        Text(
                          '${_messages.length} exchanges',
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
                onPressed: () {
                  final allShown = _messages.asMap().keys.every(
                    (i) => _showTranslation[i] ?? false,
                  );
                  setState(() {
                    for (var i = 0; i < _messages.length; i++) {
                      _showTranslation[i] = !allShown;
                    }
                  });
                },
                icon: const Icon(LucideIcons.languages),
                color: const Color(0xFFEC4899),
                style: IconButton.styleFrom(
                  backgroundColor: const Color(
                    0xFFEC4899,
                  ).withValues(alpha: 0.2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(int index, dynamic message) {
    final speaker = message['speaker'] ?? 'Unknown';
    final isUser =
        speaker.toString().toLowerCase() == 'you' ||
        speaker.toString().toLowerCase() == 'me';

    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child:
          Column(
                crossAxisAlignment: isUser
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: isUser
                        ? MainAxisAlignment.end
                        : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      if (!isUser) ...[
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFF27272A),
                          child: Text(
                            speaker[0].toUpperCase(),
                            style: const TextStyle(
                              color: Color(0xFFEC4899),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],

                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: isUser
                                ? const Color(0xFFEC4899).withValues(alpha: 0.2)
                                : const Color(0xFF18181B),
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(20),
                              topRight: const Radius.circular(20),
                              bottomLeft: isUser
                                  ? const Radius.circular(20)
                                  : const Radius.circular(4),
                              bottomRight: isUser
                                  ? const Radius.circular(4)
                                  : const Radius.circular(20),
                            ),
                            border: Border.all(
                              color: isUser
                                  ? const Color(
                                      0xFFEC4899,
                                    ).withValues(alpha: 0.3)
                                  : const Color(0xFF27272A),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isUser)
                                Padding(
                                  padding: const EdgeInsets.only(bottom: 4),
                                  child: Text(
                                    speaker,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFFF472B6),
                                    ),
                                  ),
                                ),
                              Text(
                                message['text'] ?? message['content'] ?? '',
                                style: const TextStyle(
                                  fontSize: 16,
                                  color: Colors.white,
                                  height: 1.5,
                                ),
                              ),
                              if (_showTranslation[index] == true) ...[
                                const SizedBox(height: 8),
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.black.withValues(alpha: 0.3),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    message['translation'] ?? 'No translation',
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFFA1A1AA),
                                      fontStyle: FontStyle.italic,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),

                      if (isUser) ...[
                        const SizedBox(width: 8),
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: const Color(0xFFEC4899),
                          child: const Icon(
                            LucideIcons.user,
                            size: 14,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: EdgeInsets.only(
                      left: isUser ? 0 : 40,
                      right: isUser ? 40 : 0,
                    ),
                    child: Row(
                      mainAxisAlignment: isUser
                          ? MainAxisAlignment.end
                          : MainAxisAlignment.start,
                      children: [
                        _buildTinyAction(
                          icon: _isSpeaking && _speakingIndex == index
                              ? LucideIcons.stopCircle
                              : LucideIcons.volume2,
                          isActive: _isSpeaking && _speakingIndex == index,
                          onTap: () => _speak(
                            index,
                            message['text'] ?? message['content'],
                            speaker,
                          ),
                        ),
                        const SizedBox(width: 12),
                        _buildTinyAction(
                          icon: LucideIcons.languages,
                          isActive: _showTranslation[index] == true,
                          onTap: () {
                            setState(() {
                              _showTranslation[index] =
                                  !(_showTranslation[index] ?? false);
                            });
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              )
              .animate()
              .fadeIn(duration: 400.ms, delay: (index * 100).ms)
              .slideX(begin: isUser ? 0.2 : -0.2, end: 0),
    );
  }

  Widget _buildTinyAction({
    required IconData icon,
    required VoidCallback onTap,
    bool isActive = false,
  }) {
    return InkWell(
      onTap: onTap,
      child: Icon(
        icon,
        size: 16,
        color: isActive ? const Color(0xFFEC4899) : const Color(0xFF52525B),
      ),
    );
  }

  Widget _buildVocabularyFooter(List<dynamic> vocabulary) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B),
        border: const Border(top: BorderSide(color: Color(0xFF27272A))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Key Vocabulary'.toUpperCase(),
            style: const TextStyle(
              color: Color(0xFFA1A1AA),
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: vocabulary.map<Widget>((word) {
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF27272A),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: const Color(0xFF3F3F46)),
                  ),
                  child: Text(
                    word.toString(),
                    style: const TextStyle(
                      fontSize: 13,
                      color: Color(0xFFF472B6),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}
