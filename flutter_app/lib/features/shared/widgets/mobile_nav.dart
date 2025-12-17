import 'dart:ui';
import 'package:flutter/material.dart';

import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/theme/app_theme.dart';

class MobileNav extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onTap;

  const MobileNav({
    super.key,
    required this.selectedIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
          margin: const EdgeInsets.only(left: 20, right: 20, bottom: 20),
          // Glassmorphism effect
          decoration: BoxDecoration(
            color: const Color(0xFF18181B).withValues(alpha: 0.9),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.06)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 32,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
              child: Container(
                height: 68,
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _NavTab(
                      index: 0,
                      isSelected: selectedIndex == 0,
                      icon: LucideIcons.home,
                      activeIcon: LucideIcons
                          .home, // Lucide doesn't always have filled variants easily accessible without suffix, using same or similar
                      label: 'Home',
                      onTap: () => onTap(0),
                    ),
                    _NavTab(
                      index: 1,
                      isSelected: selectedIndex == 1,
                      icon: LucideIcons.book,
                      activeIcon: LucideIcons.bookOpen,
                      label: 'Library',
                      onTap: () => onTap(1),
                    ),
                    _NavTab(
                      index: 2,
                      isSelected: selectedIndex == 2,
                      icon: LucideIcons.graduationCap,
                      activeIcon: LucideIcons.sparkles,
                      label: 'Practice',
                      onTap: () => onTap(2),
                    ),
                    _NavTab(
                      index: 3,
                      isSelected: selectedIndex == 3,
                      icon: LucideIcons.userCircle,
                      activeIcon: LucideIcons.user,
                      label: 'Profile',
                      onTap: () => onTap(3),
                    ),
                  ],
                ),
              ),
            ),
          ),
        )
        .animate()
        .slideY(begin: 1.0, end: 0, duration: 600.ms, curve: Curves.easeOutBack)
        .fadeIn();
  }
}

class _NavTab extends StatelessWidget {
  final int index;
  final bool isSelected;
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final VoidCallback onTap;

  const _NavTab({
    required this.index,
    required this.isSelected,
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Active Pill Background
          if (isSelected)
            Positioned.fill(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppTheme.primary500.withValues(alpha: 0.2),
                      AppTheme.primary400.withValues(alpha: 0.15),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.primary500.withValues(alpha: 0.2),
                  ),
                ),
              ).animate().scale(duration: 200.ms, curve: Curves.easeOut),
            ),

          SizedBox(
            width: 70, // Fixed width for touch target
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Icon
                Icon(
                      isSelected ? activeIcon : icon,
                      color: isSelected
                          ? const Color(0xFFA5B4FC)
                          : const Color(0xFF6B7280),
                      size: 24,
                    )
                    .animate(target: isSelected ? 1 : 0)
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.1, 1.1),
                      duration: 200.ms,
                    )
                    .moveY(begin: 0, end: -3, duration: 200.ms),

                const SizedBox(height: 4),

                // Label
                AnimatedOpacity(
                  opacity: isSelected ? 1.0 : 0.5,
                  duration: const Duration(milliseconds: 200),
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: isSelected
                          ? const Color(0xFFC7D2FE)
                          : const Color(0xFF6B7280),
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Active Dot Indicator
          if (isSelected)
            Positioned(
              bottom: 8,
              child:
                  Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: Color(0xFF818CF8),
                      shape: BoxShape.circle,
                    ),
                  ).animate().scale(
                    begin: const Offset(0, 0),
                    end: const Offset(1, 1),
                    duration: 200.ms,
                  ),
            ),
        ],
      ),
    );
  }
}
