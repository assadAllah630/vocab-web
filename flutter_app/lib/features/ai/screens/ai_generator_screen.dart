import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/app_theme.dart';

class AIGeneratorScreen extends StatelessWidget {
  const AIGeneratorScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBackgroundColor,
      appBar: AppBar(
        title: const Text("AI Studio"),
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Create & Learn",
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ).animate().fadeIn().slideX(),
            const SizedBox(height: 8),
            const Text(
              "What would you like to generate today?",
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ).animate().fadeIn().slideX(delay: 100.ms),
            const SizedBox(height: 24),
            Expanded(
              child: ListView(
                children: [
                  _GeneratorCard(
                    title: "Story Weaver",
                    description:
                        "Generate engaging stories tailored to your level with vocabulary highlighting.",
                    icon: LucideIcons.bookOpen,
                    color: const Color(0xFF8B5CF6),
                    onTap: () => context.push('/ai/story'),
                    delay: 200.ms,
                  ),
                  const SizedBox(height: 16),
                  _GeneratorCard(
                    title: "Dialogue Sim",
                    description:
                        "Practice real-world conversations with AI personas.",
                    icon: LucideIcons.messageCircle,
                    color: const Color(0xFFEC4899),
                    onTap: () =>
                        context.push('/ai/dialogue'), // Implement later
                    delay: 300.ms,
                  ),
                  const SizedBox(height: 16),
                  _GeneratorCard(
                    title: "Article Gen",
                    description:
                        "Create informative articles on any topic you love.",
                    icon: LucideIcons.fileText,
                    color: const Color(0xFF10B981),
                    onTap: () => context.push('/ai/article'), // Implement later
                    delay: 400.ms,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _GeneratorCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final Duration delay;

  const _GeneratorCard({
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
        height: 120,
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          gradient: LinearGradient(
            colors: [const Color(0xFF18181B), color.withValues(alpha: 0.05)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Row(
          children: [
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: color, size: 30),
              ),
            ),
            Expanded(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
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
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(right: 20.0),
              child: Icon(LucideIcons.chevronRight, color: Colors.grey),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideY(begin: 0.2, end: 0, delay: delay);
  }
}
