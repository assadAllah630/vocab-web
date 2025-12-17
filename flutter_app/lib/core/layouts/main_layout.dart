import 'package:flutter/material.dart';
import '../../features/shared/widgets/mobile_nav.dart';

class MainLayout extends StatelessWidget {
  final Widget child;
  final int selectedIndex;
  final Function(int) onNavTap;

  const MainLayout({
    super.key,
    required this.child,
    required this.selectedIndex,
    required this.onNavTap,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      extendBody: true, // Allow body to extend behind navbar
      body: Stack(
        children: [
          // ===== BACKGROUND ORBS =====
          // Top Right Orb
          Positioned(
            top: -128,
            right: -128,
            child: Container(
              width: 320,
              height: 320,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF6366F1).withValues(alpha: 0.08),
                    const Color(0xFF6366F1).withValues(alpha: 0),
                  ],
                  stops: const [0.0, 0.7],
                ),
              ),
            ),
          ),

          // Bottom Left Orb
          Positioned(
            bottom: -160,
            left: -160,
            child: Container(
              width: 384,
              height: 384,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF8B5CF6).withValues(alpha: 0.06),
                    const Color(0xFF8B5CF6).withValues(alpha: 0),
                  ],
                  stops: const [0.0, 0.7],
                ),
              ),
            ),
          ),

          // ===== MAIN CONTENT =====
          SafeArea(
            bottom: false, // Let content scroll behind navbar
            child: child,
          ),

          // ===== NAVIGATION BAR =====
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: MobileNav(selectedIndex: selectedIndex, onTap: onNavTap),
          ),
        ],
      ),
    );
  }
}
