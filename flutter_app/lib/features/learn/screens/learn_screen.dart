import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';

class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              // Header
              const Text(
                'Practice',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ).animate().fadeIn().slideX(),
              const SizedBox(height: 4),
              const Text(
                'Select a Game',
                style: TextStyle(color: Color(0xFF71717A), fontSize: 14),
              ).animate().fadeIn().slideX(delay: 100.ms),

              const SizedBox(height: 24),

              // Main Modes
              Column(
                children: [
                  _PracticeCard(
                    title: 'Flashcards',
                    description: 'Review',
                    icon: LucideIcons.layers,
                    onTap: () => context.push('/words/flashcards'),
                    delay: 200.ms,
                  ),
                  const SizedBox(height: 12),
                  _PracticeCard(
                    title: 'Quiz',
                    description: 'Exams',
                    icon: LucideIcons.brain,
                    onTap: () => context.push('/exams'),
                    delay: 300.ms,
                  ),
                  const SizedBox(height: 12),
                  _PracticeCard(
                    title: 'Games',
                    description: 'Play Now',
                    icon: LucideIcons.gamepad2,
                    onTap: () => context.push('/games'),
                    delay: 400.ms,
                  ),
                  const SizedBox(height: 12),
                  _PracticeCard(
                    title: 'Grammar',
                    description: 'Generate Lesson',
                    icon: LucideIcons.bookOpen,
                    onTap: () => context.push('/practice/grammar'),
                    delay: 500.ms,
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // More Section
              const Text(
                'More',
                style: TextStyle(
                  color: Color(0xFFA1A1AA),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ).animate().fadeIn(delay: 600.ms),
              const SizedBox(height: 12),
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF141416),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF27272A)),
                ),
                child: Column(
                  children: [
                    _MoreItem(
                      title: 'Reader',
                      icon: LucideIcons.fileText,
                      onTap: () =>
                          context.push('/practice'), // Maps to ReaderScreen
                      isFirst: true,
                    ),
                    _Divider(),
                    _MoreItem(
                      title: 'Podcasts',
                      icon: LucideIcons.headphones,
                      onTap: () => context.push('/podcast'),
                    ),
                    _Divider(),
                    _MoreItem(
                      title: 'Generate',
                      icon: LucideIcons.sparkles,
                      onTap: () =>
                          context.push('/ai'), // Maps to AIGeneratorScreen
                      isLast: true,
                    ),
                  ],
                ),
              ).animate().fadeIn().slideY(begin: 0.2, end: 0, delay: 600.ms),
              const SizedBox(height: 100), // Bottom padding for nav bar
            ],
          ),
        ),
      ),
    );
  }
}

class _PracticeCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final VoidCallback onTap;
  final Duration delay;

  const _PracticeCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.onTap,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF141416),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFF1C1C1F),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: const Color(0xFFA1A1AA), size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Color(0xFFFAFAFA),
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    description,
                    style: const TextStyle(
                      color: Color(0xFF71717A),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF71717A),
              size: 20,
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(delay: delay);
  }
}

class _MoreItem extends StatelessWidget {
  final String title;
  final IconData icon;
  final VoidCallback onTap;
  final bool isFirst;
  final bool isLast;

  const _MoreItem({
    required this.title,
    required this.icon,
    required this.onTap,
    this.isFirst = false,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(icon, size: 18, color: const Color(0xFF71717A)),
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Color(0xFFFAFAFA),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              size: 16,
              color: Color(0xFF71717A),
            ),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 1,
      color: const Color(0xFF1C1C1F),
      margin: const EdgeInsets.only(left: 50), // Indent to match text start
    );
  }
}
