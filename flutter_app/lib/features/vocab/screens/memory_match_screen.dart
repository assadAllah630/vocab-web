import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:async';

class MemoryCard {
  final String id;
  final String content;
  final bool isWord;
  final String pairId;
  bool isFlipped;
  bool isMatched;

  MemoryCard({
    required this.id,
    required this.content,
    required this.isWord,
    required this.pairId,
    this.isFlipped = false,
    this.isMatched = false,
  });
}

class MemoryMatchScreen extends StatefulWidget {
  const MemoryMatchScreen({super.key});

  @override
  State<MemoryMatchScreen> createState() => _MemoryMatchScreenState();
}

class _MemoryMatchScreenState extends State<MemoryMatchScreen> {
  List<MemoryCard> cards = [];
  MemoryCard? firstFlipped;
  bool isProcessing = false;
  int moves = 0;
  int score = 0;

  @override
  void initState() {
    super.initState();
    _startNewGame();
  }

  void _startNewGame() {
    final pairs = [
      {'word': 'Haus', 'trans': 'House'},
      {'word': 'Katze', 'trans': 'Cat'},
      {'word': 'Hund', 'trans': 'Dog'},
      {'word': 'Auto', 'trans': 'Car'},
      {'word': 'Baum', 'trans': 'Tree'},
      {'word': 'Buch', 'trans': 'Book'},
    ];

    List<MemoryCard> newCards = [];
    for (var pair in pairs) {
      final pairId = pair['word']!;
      newCards.add(
        MemoryCard(
          id: '${pairId}_word',
          content: pair['word']!,
          isWord: true,
          pairId: pairId,
        ),
      );
      newCards.add(
        MemoryCard(
          id: '${pairId}_trans',
          content: pair['trans']!,
          isWord: false,
          pairId: pairId,
        ),
      );
    }

    newCards.shuffle();
    setState(() {
      cards = newCards;
      firstFlipped = null;
      isProcessing = false;
      moves = 0;
      score = 0;
    });
  }

  void _handleCardTap(MemoryCard card) {
    if (isProcessing || card.isFlipped || card.isMatched) return;

    setState(() {
      card.isFlipped = true;
    });

    if (firstFlipped == null) {
      firstFlipped = card;
    } else {
      moves++;
      isProcessing = true;
      if (firstFlipped!.pairId == card.pairId) {
        // Match
        setState(() {
          score += 10;
          firstFlipped!.isMatched = true;
          card.isMatched = true;
          firstFlipped = null;
          isProcessing = false;
          _checkWin();
        });
      } else {
        // No match
        Timer(const Duration(milliseconds: 1000), () {
          if (mounted) {
            setState(() {
              firstFlipped!.isFlipped = false;
              card.isFlipped = false;
              firstFlipped = null;
              isProcessing = false;
            });
          }
        });
      }
    }
  }

  void _checkWin() {
    if (cards.every((c) => c.isMatched)) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF18181B),
          title: const Text(
            'You Won! 🎉',
            style: TextStyle(color: Colors.white),
          ),
          content: Text(
            'Moves: $moves\nScore: $score',
            style: const TextStyle(color: Colors.white70),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _startNewGame();
              },
              child: const Text('Play Again'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.pop();
              },
              child: const Text('Exit', style: TextStyle(color: Colors.red)),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Memory Match',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          Center(
            child: Text(
              'Moves: $moves  ',
              style: const TextStyle(color: Colors.white70),
            ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: GridView.builder(
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.8,
          ),
          itemCount: cards.length,
          itemBuilder: (context, index) {
            final card = cards[index];
            return GestureDetector(
              onTap: () => _handleCardTap(card),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, anim) =>
                    ScaleTransition(scale: anim, child: child),
                child: card.isFlipped || card.isMatched
                    ? Container(
                        key: ValueKey('${card.id}_front'),
                        decoration: BoxDecoration(
                          color: card.isMatched
                              ? Colors.green.withOpacity(0.2)
                              : const Color(0xFF8B5CF6),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: card.isMatched
                                ? Colors.green
                                : const Color(0xFF7C3AED),
                          ),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          card.content,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      )
                    : Container(
                        key: ValueKey('${card.id}_back'),
                        decoration: BoxDecoration(
                          color: const Color(0xFF27272A),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: const Color(0xFF3F3F46)),
                        ),
                        alignment: Alignment.center,
                        child: const Icon(
                          LucideIcons.helpCircle,
                          color: Color(0xFF52525B),
                          size: 32,
                        ),
                      ),
              ),
            );
          },
        ),
      ),
    );
  }
}
