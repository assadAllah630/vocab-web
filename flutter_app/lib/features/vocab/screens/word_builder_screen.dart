import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:confetti/confetti.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/vocab_provider.dart';
import '../../shared/widgets/primary_button.dart';

class WordBuilderScreen extends ConsumerStatefulWidget {
  const WordBuilderScreen({super.key});

  @override
  ConsumerState<WordBuilderScreen> createState() => _WordBuilderScreenState();
}

class _WordBuilderScreenState extends ConsumerState<WordBuilderScreen> {
  late ConfettiController _confettiController;
  final TextEditingController _inputController = TextEditingController();

  VocabWord? _currentWord;
  bool _isSuccess = false;
  String _hint = '';

  @override
  void initState() {
    super.initState();
    _confettiController = ConfettiController(
      duration: const Duration(seconds: 2),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _nextWord();
    });
  }

  void _nextWord() {
    final words = ref.read(vocabProvider).words;
    if (words.isNotEmpty) {
      final random = (words.toList()..shuffle()).first;
      setState(() {
        _currentWord = random;
        _isSuccess = false;
        _inputController.clear();
        _hint = _scramble(random.word);
      });
    }
  }

  String _scramble(String input) {
    List<String> chars = input.split('');
    chars.shuffle();
    return chars.join();
  }

  void _checkAnswer() {
    if (_currentWord == null) return;

    if (_inputController.text.trim().toLowerCase() ==
        _currentWord!.word.toLowerCase()) {
      setState(() {
        _isSuccess = true;
      });
      _confettiController.play();
      Future.delayed(const Duration(seconds: 2), _nextWord);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Try again!'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _confettiController.dispose();
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_currentWord == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        title: const Text(
          'Word Builder',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: Stack(
        alignment: Alignment.topCenter,
        children: [
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  LucideIcons.gamepad2,
                  size: 64,
                  color: Color(0xFFF59E0B),
                ),
                const SizedBox(height: 40),
                const Text(
                  'Unscramble the word:',
                  style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 18),
                ),
                const SizedBox(height: 16),
                Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFF27272A),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _hint,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          letterSpacing: 4,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                    .animate(target: _isSuccess ? 1 : 0)
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.2, 1.2),
                    ),
                const SizedBox(height: 16),
                Text(
                  _currentWord!.definition,
                  style: const TextStyle(
                    color: Color(0xFF71717A),
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                TextField(
                  controller: _inputController,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.white, fontSize: 24),
                  decoration: InputDecoration(
                    hintText: 'Type answer...',
                    hintStyle: TextStyle(
                      color: Colors.white.withValues(alpha: 0.3),
                    ),
                    filled: true,
                    fillColor: const Color(0xFF18181B),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFF27272A)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: Color(0xFF8B5CF6)),
                    ),
                  ),
                  onSubmitted: (_) => _checkAnswer(),
                ),
                const SizedBox(height: 24),
                PrimaryButton(
                  label: 'Check Answer',
                  icon: const Icon(
                    LucideIcons.check,
                    size: 20,
                    color: Colors.white,
                  ),
                  onPressed: _checkAnswer,
                ),
              ],
            ),
          ),
          ConfettiWidget(
            confettiController: _confettiController,
            blastDirectionality: BlastDirectionality.explosive,
            shouldLoop: false,
            colors: const [
              Colors.green,
              Colors.blue,
              Colors.pink,
              Colors.orange,
              Colors.purple,
            ],
          ),
        ],
      ),
    );
  }
}
