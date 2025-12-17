import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';

class GrammarGeneratorScreen extends StatefulWidget {
  const GrammarGeneratorScreen({super.key});

  @override
  State<GrammarGeneratorScreen> createState() => _GrammarGeneratorScreenState();
}

class _GrammarGeneratorScreenState extends State<GrammarGeneratorScreen> {
  final _topicController = TextEditingController();
  String _difficulty = 'Beginner';
  bool _isGenerating = false;

  void _generateLesson() async {
    if (_topicController.text.isEmpty) return;

    setState(() => _isGenerating = true);

    // Simulate generation
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      context.push(
        '/reader/grammar',
      ); // Should lead to a grammar viewer with the generated content
      setState(() => _isGenerating = false);
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
          'Grammar Studio',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 32),
            _buildInputSection(),
            const SizedBox(height: 40),
            _buildGenerateButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF8B5CF6).withOpacity(0.1),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            LucideIcons.sparkles,
            color: Color(0xFF8B5CF6),
            size: 32,
          ),
        ).animate().scale(duration: 500.ms),
        const SizedBox(height: 16),
        const Text(
          'Generate Lesson',
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.bold,
          ),
        ).animate().fadeIn().slideX(),
        const SizedBox(height: 8),
        const Text(
          'AI-powered grammar explanations and exercises.',
          style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 16),
        ).animate().fadeIn(delay: 200.ms),
      ],
    );
  }

  Widget _buildInputSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Topic',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _topicController,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            hintText: 'e.g., Past Tense, Dative Case...',
            hintStyle: const TextStyle(color: Color(0xFF52525B)),
            filled: true,
            fillColor: const Color(0xFF18181B),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            prefixIcon: const Icon(
              LucideIcons.bookOpen,
              color: Color(0xFF71717A),
            ),
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'Difficulty',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),
        Row(
          children: ['Beginner', 'Intermediate', 'Advanced'].map((level) {
            final isSelected = _difficulty == level;
            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _difficulty = level),
                child: Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? const Color(0xFF8B5CF6)
                        : const Color(0xFF18181B),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? Colors.transparent
                          : const Color(0xFF27272A),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    level,
                    style: TextStyle(
                      color: isSelected
                          ? Colors.white
                          : const Color(0xFFA1A1AA),
                      fontWeight: isSelected
                          ? FontWeight.bold
                          : FontWeight.normal,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    ).animate().fadeIn(delay: 400.ms);
  }

  Widget _buildGenerateButton() {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: _isGenerating ? null : _generateLesson,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF8B5CF6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
        child: _isGenerating
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(LucideIcons.zap, color: Colors.white),
                  SizedBox(width: 8),
                  Text(
                    'Generate Lesson',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
      ),
    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2);
  }
}
