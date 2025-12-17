import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../../core/providers/auth_provider.dart';
import '../../../../core/theme/app_theme.dart';

// --- Stats Provider ---
final statsProvider = FutureProvider<UserStats>((ref) async {
  // Mock data for now, would be API call in real implementation
  // final apiClient = ref.read(apiClientProvider);
  // final response = await apiClient.dio.get('stats/');
  // return UserStats.fromJson(response.data);

  await Future.delayed(const Duration(milliseconds: 800)); // Sim network
  return UserStats(
    totalWords: 124,
    streak: 12,
    needsReview: 5,
    todayProgress: 7,
    dailyGoal: 10,
  );
});

class UserStats {
  final int totalWords;
  final int streak;
  final int needsReview;
  final int todayProgress;
  final int dailyGoal;

  UserStats({
    required this.totalWords,
    required this.streak,
    required this.needsReview,
    required this.todayProgress,
    required this.dailyGoal,
  });
}

// --- Home Screen ---

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final statsAsync = ref.watch(statsProvider);

    return Scaffold(
      backgroundColor:
          Colors.transparent, // Let background shine through if any
      body: statsAsync.when(
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryColor),
        ),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (stats) {
          return SingleChildScrollView(
            child: Column(
              children: [
                _buildHeader(context, user),
                _buildStreakCard(context, stats),
                _buildStatsRow(context, stats),
                _buildDailyGoal(context, stats),
                if (stats.needsReview > 0) _buildReviewBanner(context, stats),
                _buildPodcastBanner(context),
                _buildQuickActions(context),
                const SizedBox(height: 24),
                _buildFooter(context),
                const SizedBox(height: 100), // Bottom padding for nav bar
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeader(BuildContext context, User? user) {
    final hour = DateTime.now().hour;
    String greeting = "Good evening";
    if (hour < 12) {
      greeting = "Good morning";
    } else if (hour < 17) {
      greeting = "Good afternoon";
    }

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$greeting 👋',
                style: const TextStyle(color: Color(0xFF71717A), fontSize: 14),
              ),
              const SizedBox(height: 2),
              Text(
                user?.username ?? 'Learner',
                style: const TextStyle(
                  color: Color(0xFFFAFAFA),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Row(
            children: [
              _buildIconButton(
                context,
                LucideIcons.bell,
                () => context.go('/notifications'),
              ),
              const SizedBox(width: 12),
              GestureDetector(
                onTap: () => context.go('/me'),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      (user?.username?[0] ?? 'U').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2, end: 0);
  }

  Widget _buildIconButton(
    BuildContext context,
    IconData icon,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: const Color(0xFF141416),
          border: Border.all(color: const Color(0xFF27272A)),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: const Color(0xFFA1A1AA), size: 20),
      ),
    );
  }

  Widget _buildStreakCard(BuildContext context, UserStats stats) {
    // Motivation logic
    String message = "Start your learning journey today!";
    String emoji = "🚀";
    if (stats.streak > 0) {
      message = "Great start! Keep the momentum!";
      emoji = "💪";
    }
    if (stats.streak >= 3) {
      message = "You're building a habit!";
      emoji = "🔥";
    }
    if (stats.streak >= 7) {
      message = "Incredible consistency!";
      emoji = "⭐";
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF3F3F46)),
          gradient: const LinearGradient(
            colors: [Color(0xFF1C1C1F), Color(0xFF27272A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(
          children: [
            // Glow effect
            Positioned(
              top: -40,
              right: -40,
              child:
                  Container(
                        width: 128,
                        height: 128,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0x66F59E0B),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0x66F59E0B,
                              ).withValues(alpha: 0.5),
                              blurRadius: 40,
                              spreadRadius: 10,
                            ),
                          ],
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(
                        begin: const Offset(1, 1),
                        end: const Offset(1.2, 1.2),
                        duration: 2.seconds,
                      ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  // Animated Flame would typically accept an image asset
                  // For now using Icon as placeholder if asset missing
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    child:
                        const Icon(
                              LucideIcons.flame,
                              color: Colors.orange,
                              size: 48,
                            )
                            .animate(onPlay: (c) => c.repeat(reverse: true))
                            .rotate(begin: -0.05, end: 0.05),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '${stats.streak}',
                              style: const TextStyle(
                                fontSize: 36,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ).animate().scale(
                              begin: const Offset(1.5, 1.5),
                              end: const Offset(1, 1),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'day streak',
                              style: TextStyle(
                                fontSize: 18,
                                color: Color(0xFFA1A1AA),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '$emoji $message',
                          style: const TextStyle(
                            color: Color(0xFF71717A),
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _buildStatsRow(BuildContext context, UserStats stats) {
    final items = [
      _StatItem(
        LucideIcons.bookOpen,
        '${stats.totalWords}',
        'Words Count',
        const Color(0xFF6366F1),
      ),
      _StatItem(
        LucideIcons.target,
        '${stats.needsReview}',
        'To Review',
        const Color(0xFFF59E0B),
      ),
      _StatItem(
        LucideIcons.trendingUp,
        '${stats.todayProgress}',
        'Today',
        const Color(0xFF22C55E),
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: items
            .map(
              (item) => Expanded(
                child: Container(
                  margin: EdgeInsets.only(right: item == items.last ? 0 : 12),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141416),
                    border: Border.all(color: const Color(0xFF27272A)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Icon(item.icon, color: item.color, size: 20),
                      const SizedBox(height: 8),
                      Text(
                        item.value,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        item.label,
                        style: const TextStyle(
                          color: Color(0xFF71717A),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms).scale(),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildDailyGoal(BuildContext context, UserStats stats) {
    final progress = (stats.todayProgress / stats.dailyGoal).clamp(0.0, 1.0);
    final isComplete = progress >= 1.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF141416),
          border: Border.all(color: const Color(0xFF27272A)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: const [
                    Icon(
                      LucideIcons.trophy,
                      color: Color(0xFFF59E0B),
                      size: 18,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'Daily Goal',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${stats.todayProgress}/${stats.dailyGoal}',
                  style: TextStyle(
                    color: isComplete
                        ? const Color(0xFF22C55E)
                        : const Color(0xFFA1A1AA),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 12,
                backgroundColor: const Color(0xFF27272A),
                valueColor: AlwaysStoppedAnimation<Color>(
                  isComplete
                      ? const Color(0xFF22C55E)
                      : const Color(0xFF6366F1),
                ),
              ),
            ),
            if (!isComplete) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${stats.dailyGoal - stats.todayProgress} more to complete',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF71717A),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _buildReviewBanner(BuildContext context, UserStats stats) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: GestureDetector(
        onTap: () => context.go('/games/flashcards'),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: const LinearGradient(
              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        LucideIcons.zap,
                        color: Colors.white,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${stats.needsReview} words ready',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Tap to start your review session',
                    style: TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
              const Icon(LucideIcons.chevronRight, color: Colors.white),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.1, end: 0);
  }

  Widget _buildPodcastBanner(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
      child: GestureDetector(
        onTap: () => context.go('/podcast'),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF1C1C1F),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF3F3F46)),
            gradient: const LinearGradient(
              colors: [Color(0xFF1C1C1F), Color(0xFF27272A)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0x33A855F7), // purple/20
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  LucideIcons.mic,
                  color: Color(0xFFA855F7),
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Podcast Studio',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Turn topics into audio shows',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    ),
                  ],
                ),
              ),
              const Icon(LucideIcons.chevronRight, color: Color(0xFF71717A)),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(delay: 450.ms).slideY(begin: 0.1, end: 0);
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _ActionItem(
        LucideIcons.plus,
        'Add',
        const Color(0xFF22C55E),
        () => context.go('/words/add'),
      ),
      _ActionItem(
        LucideIcons.play,
        'Review',
        const Color(0xFF6366F1),
        () => context.go('/games/flashcards'),
      ),
      _ActionItem(
        LucideIcons.sparkles,
        'Quiz',
        const Color(0xFFA855F7),
        () => context.go('/exams'),
      ),
      _ActionItem(
        LucideIcons.bookOpen,
        'Games',
        const Color(0xFFF59E0B),
        () => context.go('/games'),
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Quick Actions',
            style: TextStyle(
              color: Color(0xFFA1A1AA),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: actions.map((item) => _buildActionBtn(item)).toList(),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 500.ms);
  }

  Widget _buildActionBtn(_ActionItem item) {
    return GestureDetector(
      onTap: item.onTap,
      child: Container(
        width: 72,
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFF141416),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Column(
          children: [
            Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: item.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(item.icon, color: item.color, size: 20),
                )
                .animate(onPlay: (c) => c.repeat(reverse: true))
                .scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.1, 1.1),
                  duration: 1.seconds,
                ),
            const SizedBox(height: 8),
            Text(
              item.label,
              style: const TextStyle(
                color: Color(0xFFA1A1AA),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return const Center(
      child: Text(
        '"Every word counts" ✨',
        style: TextStyle(color: Color(0xFF52525B), fontSize: 13),
      ),
    ).animate().fadeIn(delay: 800.ms);
  }
}

class _StatItem {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  _StatItem(this.icon, this.value, this.label, this.color);
}

class _ActionItem {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  _ActionItem(this.icon, this.label, this.color, this.onTap);
}
