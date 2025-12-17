import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:auto_size_text/auto_size_text.dart';
import '../providers/vocab_provider.dart';

class FlashcardsScreen extends ConsumerStatefulWidget {
  const FlashcardsScreen({super.key});

  @override
  ConsumerState<FlashcardsScreen> createState() => _FlashcardsScreenState();
}

class _FlashcardsScreenState extends ConsumerState<FlashcardsScreen> {
  final CardSwiperController _controller = CardSwiperController();
  bool _isFinished = false;

  bool _onSwipe(
    int previousIndex,
    int? currentIndex,
    CardSwiperDirection direction,
  ) {
    final vocabState = ref.read(vocabProvider);
    if (previousIndex >= vocabState.words.length) return true;

    final word = vocabState.words[previousIndex];
    if (direction == CardSwiperDirection.right) {
      ref.read(vocabProvider.notifier).updateMastery(word.id, 20); // Known
    } else if (direction == CardSwiperDirection.left) {
      ref.read(vocabProvider.notifier).updateMastery(word.id, -10); // Hard
    }

    if (currentIndex == null) {
      setState(() => _isFinished = true);
    }
    return true;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vocabState = ref.watch(vocabProvider);
    final words = vocabState.words;

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text(
          'Flashcards',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isFinished
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    LucideIcons.trophy,
                    size: 80,
                    color: Color(0xFFF59E0B),
                  ),
                  const SizedBox(height: 24),
                  const Text(
                    'Session Complete!',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Back to Dashboard'),
                  ),
                ],
              ),
            )
          : words.isEmpty
          ? const Center(
              child: Text(
                'No words to practice',
                style: TextStyle(color: Colors.white),
              ),
            )
          : Column(
              children: [
                Expanded(
                  child: CardSwiper(
                    controller: _controller,
                    cardsCount: words.length,
                    onSwipe: _onSwipe,
                    allowedSwipeDirection:
                        const AllowedSwipeDirection.symmetric(horizontal: true),
                    numberOfCardsDisplayed: 3,
                    cardBuilder:
                        (context, index, percentThresholdX, percentThresholdY) {
                          return _Flashcard(word: words[index]);
                        },
                  ),
                ),
                const SizedBox(height: 40),
                // Controls
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 20,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _ControlButton(
                        icon: LucideIcons.x,
                        color: const Color(0xFFEF4444),
                        onTap: () =>
                            _controller.swipe(CardSwiperDirection.left),
                      ),
                      _ControlButton(
                        icon: LucideIcons.rotateCw,
                        color: const Color(0xFF3B82F6),
                        onTap: () => _controller.undo(),
                        small: true,
                      ),
                      _ControlButton(
                        icon: LucideIcons.check,
                        color: const Color(0xFF10B981),
                        onTap: () =>
                            _controller.swipe(CardSwiperDirection.right),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }
}

class _Flashcard extends StatefulWidget {
  final VocabWord word;
  const _Flashcard({required this.word});

  @override
  State<_Flashcard> createState() => _FlashcardState();
}

class _FlashcardState extends State<_Flashcard> {
  bool _showBack = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _showBack = !_showBack),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF27272A)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: !_showBack
                ? AutoSizeText(
                    widget.word.word,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 40,
                    ),
                    maxLines: 1,
                  )
                : Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.word.translation,
                        style: const TextStyle(
                          color: Color(0xFF8B5CF6),
                          fontWeight: FontWeight.bold,
                          fontSize: 32,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        widget.word.definition,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF27272A),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '"${widget.word.example}"',
                          style: const TextStyle(
                            color: Color(0xFFA1A1AA),
                            fontSize: 16,
                            fontStyle: FontStyle.italic,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

class _ControlButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool small;

  const _ControlButton({
    required this.icon,
    required this.color,
    required this.onTap,
    this.small = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: small ? 50 : 70,
        height: small ? 50 : 70,
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          shape: BoxShape.circle,
          border: Border.all(color: color.withValues(alpha: 0.5), width: 2),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.2),
              blurRadius: 15,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(icon, color: color, size: small ? 24 : 32),
      ),
    );
  }
}
