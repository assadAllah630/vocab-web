import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class MagneticWordsBackground extends StatelessWidget {
  const MagneticWordsBackground({super.key});

  static final List<_WordConfig> _words = [
    // Far layer - depth 3
    _WordConfig("Connect", 0.10, 0.08, 3),
    _WordConfig("Read", 0.95, 0.10, 3),
    _WordConfig("Practice", 0.08, 0.25, 3),
    _WordConfig("Explore", 0.92, 0.28, 3),
    _WordConfig("Write", 0.12, 0.45, 3),
    _WordConfig("Listen", 0.15, 0.65, 3),
    _WordConfig("Improve", 0.92, 0.68, 3),
    _WordConfig("Master", 0.90, 0.88, 3),

    // Mid layer - depth 2
    _WordConfig("Bonjour", 0.30, 0.28, 2),
    _WordConfig("Hola", 0.28, 0.48, 2),
    _WordConfig("مرحبا", 0.85, 0.48, 2),
    _WordConfig("Ciao", 0.20, 0.85, 2),
    _WordConfig("Namaste", 0.45, 0.88, 2),
    _WordConfig("Shalom", 0.70, 0.86, 2),
    _WordConfig("Привет", 0.18, 0.38, 2),
    _WordConfig("Salaam", 0.42, 0.58, 2),
    _WordConfig("Gracias", 0.78, 0.38, 2),
    _WordConfig("Merci", 0.10, 0.78, 2),
    _WordConfig("Danke", 0.85, 0.78, 2),

    // Close layer - depth 1
    _WordConfig("Hello", 0.25, 0.12, 1),
    _WordConfig("Vocabulary", 0.55, 0.10, 1),
    _WordConfig("你好", 0.85, 0.15, 1),
    _WordConfig("Learn", 0.65, 0.30, 1),
    _WordConfig("Fluency", 0.58, 0.50, 1),
    _WordConfig("こんにちは", 0.38, 0.68, 1),
    _WordConfig("Speak", 0.70, 0.70, 1),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF09090B), // Slate-950 equivalent
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.black,
            Color(0xFF111827), // Gray-900
            Color(0xFF020617), // Slate-950
          ],
        ),
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background ambient glows
          Positioned(
            top: -200,
            right: -200,
            child:
                Container(
                      width: 500,
                      height: 500,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.03),
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scaleXY(begin: 1, end: 1.2, duration: 10.seconds)
                    .fade(begin: 0.5, end: 0.8),
          ),

          Positioned(
            bottom: -200,
            left: -100,
            child:
                Container(
                      width: 400,
                      height: 400,
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.04),
                        shape: BoxShape.circle,
                      ),
                    )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .scaleXY(begin: 1.2, end: 1, duration: 12.seconds)
                    .fade(begin: 0.5, end: 0.8),
          ),

          // Words
          LayoutBuilder(
            builder: (context, constraints) {
              return Stack(
                children: _words.map((word) {
                  return Positioned(
                    left: constraints.maxWidth * word.x,
                    top: constraints.maxHeight * word.y,
                    child: Transform.translate(
                      offset: const Offset(-50, -50), // Center roughly
                      child: _AnimatedWord(word: word),
                    ),
                  );
                }).toList(),
              );
            },
          ),

          // Vignette
          Container(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: Alignment.center,
                radius: 1.0,
                colors: [
                  Colors.transparent,
                  Colors.black.withValues(alpha: 0.5),
                ],
                stops: const [0.35, 1.0],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WordConfig {
  final String text;
  final double x; // 0.0 to 1.0
  final double y; // 0.0 to 1.0
  final int depth; // 1, 2, or 3

  _WordConfig(this.text, this.x, this.y, this.depth);
}

class _AnimatedWord extends StatelessWidget {
  final _WordConfig word;

  const _AnimatedWord({required this.word});

  @override
  Widget build(BuildContext context) {
    // Style based on depth
    final double opacity = word.depth == 3
        ? 0.08
        : (word.depth == 2 ? 0.15 : 0.25);
    final double fontSize = word.depth == 3 ? 16 : (word.depth == 2 ? 24 : 36);
    final FontWeight weight = word.depth == 1
        ? FontWeight.w800
        : (word.depth == 2 ? FontWeight.bold : FontWeight.normal);
    // Animation duration variation
    final int durationBase = 4 + word.depth; // 5-7 seconds
    final int delay = Random().nextInt(2000);

    return Text(
          word.text,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: weight,
            color: Colors.white.withValues(alpha: opacity),
            fontFamily: 'Inter', // Direct string since we're inside widget
            letterSpacing: -0.5,
          ),
        )
        .animate(onPlay: (c) => c.repeat(reverse: true))
        .moveY(
          begin: -10 * (1.0 / word.depth), // Far moves less
          end: 10 * (1.0 / word.depth),
          duration: Duration(seconds: durationBase),
          delay: Duration(milliseconds: delay),
          curve: Curves.easeInOut,
        );
  }
}
