import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/theme/app_theme.dart';

class GamesScreen extends StatelessWidget {
  const GamesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text("Games"),
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            _GameCard(
              title: "Word Builder",
              description: "Build words from letters to improve spelling.",
              icon: LucideIcons.hammer,
              color: Colors.orange,
              onTap: () => context.push('/words/builder'),
              delay: 100.ms,
            ),
            const SizedBox(height: 16),
            _GameCard(
              title: "Memory Match",
              description: "Match word pairs to test your memory.",
              icon: LucideIcons.copy,
              color: Colors.blue,
              onTap: () => context.push('/words/memory'),
              delay: 200.ms,
            ),
            const SizedBox(height: 16),
            _GameCard(
              title: "Time Challenge",
              description: "Race against the clock to identify words.",
              icon: LucideIcons.timer,
              color: Colors.red,
              onTap: () => context.push('/words/challenge'),
              delay: 300.ms,
            ),
          ],
        ),
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final Duration delay;

  const _GameCard({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
    required this.onTap,
    required this.delay,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: const TextStyle(
                      color: Color(0xFFA1A1AA),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, color: Color(0xFF52525B)),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(delay: delay);
  }
}
