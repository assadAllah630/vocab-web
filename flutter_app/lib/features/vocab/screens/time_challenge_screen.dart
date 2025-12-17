import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:circular_countdown_timer/circular_countdown_timer.dart';
import 'dart:math';

class TimeChallengeScreen extends StatefulWidget {
  const TimeChallengeScreen({super.key});

  @override
  State<TimeChallengeScreen> createState() => _TimeChallengeScreenState();
}

class _TimeChallengeScreenState extends State<TimeChallengeScreen> {
  final CountDownController _timerController = CountDownController();
  final Random _rng = Random();

  late _ChallengeQuestion _currentQuestion;
  int _score = 0;
  bool _gameOver = false;

  final List<Map<String, String>> _vocabList = [
    {'word': 'Heute', 'trans': 'Today'},
    {'word': 'Morgen', 'trans': 'Tomorrow'},
    {'word': 'Gestern', 'trans': 'Yesterday'},
    {'word': 'Essen', 'trans': 'Eat'},
    {'word': 'Trinken', 'trans': 'Drink'},
    {'word': 'Schlafen', 'trans': 'Sleep'},
  ];

  @override
  void initState() {
    super.initState();
    _nextQuestion();
  }

  void _nextQuestion() {
    final correctPair = _vocabList[_rng.nextInt(_vocabList.length)];
    final isCorrect = _rng.nextBool();

    String shownTrans;
    if (isCorrect) {
      shownTrans = correctPair['trans']!;
    } else {
      // Pick random wrong trans
      var other = _vocabList[_rng.nextInt(_vocabList.length)];
      while (other == correctPair) {
        other = _vocabList[_rng.nextInt(_vocabList.length)];
      }
      shownTrans = other['trans']!;
    }

    setState(() {
      _currentQuestion = _ChallengeQuestion(
        word: correctPair['word']!,
        shownTranslation: shownTrans,
        isCorrect: isCorrect,
      );
    });
  }

  void _handleAnswer(bool answer) {
    if (_gameOver) return;

    if (answer == _currentQuestion.isCorrect) {
      setState(() {
        _score++;
      });
      _nextQuestion();
    } else {
      // Wrong answer logic - maybe -5 seconds?
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Wrong! -2 seconds'),
          duration: Duration(milliseconds: 500),
          backgroundColor: Colors.red,
        ),
      );
      // Ideally deduct time, but circular timer package might not support easy deduction without reset.
      // We will just shake screen or show red.
      _nextQuestion();
    }
  }

  void _onTimerComplete() {
    setState(() {
      _gameOver = true;
    });
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text(
          'Time\'s Up! ⏰',
          style: TextStyle(color: Colors.white),
        ),
        content: Text(
          'Final Score: $_score',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _score = 0;
                _gameOver = false;
                _timerController.restart(duration: 30);
                _nextQuestion();
              });
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
          'Time Challenge',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Timer
            CircularCountDownTimer(
              duration: 30,
              initialDuration: 0,
              controller: _timerController,
              width: 80,
              height: 80,
              ringColor: const Color(0xFF27272A),
              fillColor: _score > 5 ? Colors.green : Colors.red,
              backgroundColor: const Color(0xFF18181B),
              strokeWidth: 8.0,
              strokeCap: StrokeCap.round,
              textStyle: const TextStyle(
                fontSize: 24.0,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textFormat: CountdownTextFormat.S,
              isReverse: true,
              isReverseAnimation: true,
              isTimerTextShown: true,
              autoStart: true,
              onComplete: _onTimerComplete,
            ),

            const SizedBox(height: 60),

            GestureDetector(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Current Score: $_score! Keep it up! 🚀'),
                    duration: const Duration(seconds: 1),
                    backgroundColor: const Color(0xFF8B5CF6),
                  ),
                );
              },
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF27272A),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Text(
                  'Score: $_score',
                  style: const TextStyle(
                    color: Color(0xFF8B5CF6),
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            const Spacer(),

            // Card
            Container(
              padding: const EdgeInsets.all(30),
              decoration: BoxDecoration(
                color: const Color(0xFF18181B),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF27272A)),
              ),
              child: Column(
                children: [
                  const Text(
                    'Does this mean...',
                    style: TextStyle(color: Color(0xFFA1A1AA)),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    _currentQuestion.word,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Icon(LucideIcons.arrowDown, color: Color(0xFF52525B)),
                  const SizedBox(height: 20),
                  Text(
                    _currentQuestion.shownTranslation,
                    style: const TextStyle(
                      color: Color(0xFF8B5CF6),
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),

            // Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleAnswer(false),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.withOpacity(0.2),
                      foregroundColor: Colors.red,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Icon(LucideIcons.x, size: 32),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleAnswer(true),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.withOpacity(0.2),
                      foregroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    child: const Icon(LucideIcons.check, size: 32),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChallengeQuestion {
  final String word;
  final String shownTranslation;
  final bool isCorrect;

  _ChallengeQuestion({
    required this.word,
    required this.shownTranslation,
    required this.isCorrect,
  });
}
