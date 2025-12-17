import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:lucide_icons/lucide_icons.dart';

class WizardLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final int currentStep;
  final int totalSteps;
  final VoidCallback? onBack;
  final VoidCallback onNext;
  final bool isNextDisabled;
  final String nextLabel;
  final bool isLoading;
  final String loadingMessage;
  final Widget child;

  const WizardLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.currentStep,
    required this.totalSteps,
    required this.onBack,
    required this.onNext,
    this.isNextDisabled = false,
    this.nextLabel = 'Next',
    this.isLoading = false,
    this.loadingMessage = 'Generating...',
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: SafeArea(
        child: Column(
          children: [
            // ===== HEADER =====
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                color: const Color(0xFF09090B).withValues(alpha: 0.8),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back Button
                  IconButton(
                    onPressed: onBack,
                    icon: const Icon(
                      LucideIcons.chevronLeft,
                      color: Color(0xFFA1A1AA),
                    ),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    style: IconButton.styleFrom(
                      hoverColor: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),

                  // Progress Indicators
                  Column(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(totalSteps, (index) {
                          final step = index + 1;
                          final isCurrent = step == currentStep;
                          final isPast = step < currentStep;

                          return AnimatedContainer(
                            duration: 300.ms,
                            margin: const EdgeInsets.symmetric(horizontal: 2),
                            height: 4,
                            width: isCurrent ? 24 : 8,
                            decoration: BoxDecoration(
                              color: isCurrent
                                  ? const Color(0xFF6366F1)
                                  : isPast
                                  ? const Color(
                                      0xFF6366F1,
                                    ).withValues(alpha: 0.5)
                                  : const Color(0xFF27272A),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          );
                        }),
                      ),
                    ],
                  ),

                  // Spacer for balance
                  const SizedBox(width: 24),
                ],
              ),
            ),

            // ===== CONTENT =====
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                          subtitle,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                          ),
                        )
                        .animate(key: ValueKey(currentStep))
                        .fadeIn(duration: 200.ms)
                        .slideX(begin: 0.1, end: 0),

                    const SizedBox(height: 16),

                    Expanded(
                      child: AnimatedSwitcher(
                        duration: 300.ms,
                        child: KeyedSubtree(
                          key: ValueKey(currentStep),
                          child: child,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // ===== FOOTER ACTION =====
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF09090B),
                border: Border(
                  top: BorderSide(color: Colors.white.withValues(alpha: 0.05)),
                ),
              ),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: (isNextDisabled || isLoading) ? null : onNext,
                  style:
                      ElevatedButton.styleFrom(
                        backgroundColor: Colors
                            .transparent, // Handled by Container decoration for gradient
                        foregroundColor: Colors.white,
                        shadowColor: Colors.transparent,
                        padding: EdgeInsets.zero,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ).copyWith(
                        backgroundColor: WidgetStateProperty.resolveWith((
                          states,
                        ) {
                          if (states.contains(WidgetState.disabled)) {
                            return const Color(0xFF27272A);
                          }
                          return null; // Transparent to show gradient
                        }),
                      ),
                  child: Ink(
                    decoration: BoxDecoration(
                      gradient: (isNextDisabled || isLoading)
                          ? null
                          : const LinearGradient(
                              colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                            ),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      height: 56,
                      alignment: Alignment.center,
                      child: isLoading
                          ? Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      LucideIcons.sparkles,
                                      size: 20,
                                    ), // Placeholder for spinner
                                    const SizedBox(width: 8),
                                    Text(loadingMessage),
                                  ],
                                )
                                .animate(onPlay: (c) => c.repeat())
                                .shimmer(duration: 1.seconds)
                          : Text(
                              nextLabel,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
