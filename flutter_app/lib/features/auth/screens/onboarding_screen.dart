import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _page = 0;

  final List<Map<String, dynamic>> _pages = [
    {
      'title': 'Unlock Your\nPotential',
      'subtitle':
          'Master new languages with the power of AI-driven context and personalized learning.',
      'icon': LucideIcons.brainCircuit,
      'color': Color(0xFF6366F1), // Indigo
    },
    {
      'title': 'Immersive\nReading',
      'subtitle':
          'Dive into stories and articles tailored exactly to your proficiency level.',
      'icon': LucideIcons.bookOpen,
      'color': Color(0xFF10B981), // Emerald
    },
    {
      'title': 'Gamified\nMastery',
      'subtitle':
          'Challenge yourself with quizzes, podcasts, and games to reinforce your knowledge.',
      'icon': LucideIcons.trophy,
      'color': Color(0xFFF59E0B), // Amber
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0F172A), // Slate 900
              Color(0xFF1E1B4B), // Indigo 950
              Color(0xFF020617), // Slate 950
            ],
          ),
        ),
        child: SafeArea(
          child: Stack(
            children: [
              // Background Ambient Glows
              Positioned(
                top: -100,
                right: -100,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: _pages[_page]['color'].withOpacity(0.2),
                    boxShadow: [
                      BoxShadow(
                        color: _pages[_page]['color'].withOpacity(0.2),
                        blurRadius: 100,
                        spreadRadius: 50,
                      ),
                    ],
                  ),
                ).animate().scale(duration: 1000.ms, curve: Curves.easeInOut),
              ),

              // Main Content
              Column(
                children: [
                  Expanded(
                    child: PageView.builder(
                      controller: _controller,
                      onPageChanged: (idx) => setState(() => _page = idx),
                      itemCount: _pages.length,
                      itemBuilder: (context, index) {
                        final page = _pages[index];
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 32),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Glassmorphic Icon Container
                              ClipRRect(
                                borderRadius: BorderRadius.circular(32),
                                child: BackdropFilter(
                                  filter: ImageFilter.blur(
                                    sigmaX: 10,
                                    sigmaY: 10,
                                  ),
                                  child: Container(
                                    padding: const EdgeInsets.all(40),
                                    decoration: BoxDecoration(
                                      color: Colors.white.withOpacity(0.05),
                                      borderRadius: BorderRadius.circular(32),
                                      border: Border.all(
                                        color: Colors.white.withOpacity(0.1),
                                      ),
                                    ),
                                    child:
                                        Icon(
                                              page['icon'],
                                              size: 80,
                                              color: page['color'],
                                            )
                                            .animate(
                                              target: _page == index ? 1 : 0,
                                            )
                                            .scale(
                                              duration: 500.ms,
                                              curve: Curves.elasticOut,
                                            )
                                            .shimmer(
                                              delay: 500.ms,
                                              duration: 1000.ms,
                                            ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 60),

                              // Typography
                              Text(
                                page['title'],
                                textAlign: TextAlign.center,
                                style: GoogleFonts.outfit(
                                  fontSize: 42,
                                  fontWeight: FontWeight.bold,
                                  height: 1.1,
                                  color: Colors.white,
                                ),
                              ).animate().fadeIn().slideY(begin: 0.3, end: 0),

                              const SizedBox(height: 24),

                              Text(
                                page['subtitle'],
                                textAlign: TextAlign.center,
                                style: GoogleFonts.inter(
                                  fontSize: 18,
                                  color: Colors.white70,
                                  height: 1.5,
                                ),
                              ).animate().fadeIn(delay: 200.ms),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // Bottom Controls (Glassmorphic)
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(30),
                    ),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.2),
                          border: Border(
                            top: BorderSide(
                              color: Colors.white.withOpacity(0.1),
                            ),
                          ),
                        ),
                        child: Column(
                          children: [
                            // Page Indicators
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                _pages.length,
                                (index) => AnimatedContainer(
                                  duration: const Duration(milliseconds: 300),
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 4,
                                  ),
                                  width: _page == index ? 32 : 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: _page == index
                                        ? _pages[_page]['color']
                                        : Colors.white24,
                                    borderRadius: BorderRadius.circular(4),
                                    boxShadow: _page == index
                                        ? [
                                            BoxShadow(
                                              color: _pages[_page]['color']
                                                  .withOpacity(0.5),
                                              blurRadius: 8,
                                            ),
                                          ]
                                        : [],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 32),

                            // Action Button
                            SizedBox(
                              width: double.infinity,
                              height: 64,
                              child:
                                  ElevatedButton(
                                        onPressed: () {
                                          if (_page < _pages.length - 1) {
                                            _controller.nextPage(
                                              duration: 500.ms,
                                              curve: Curves.fastOutSlowIn,
                                            );
                                          } else {
                                            context.go('/login');
                                          }
                                        },
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.white,
                                          foregroundColor: Colors.black,
                                          elevation: 0,
                                          shadowColor: _pages[_page]['color']
                                              .withOpacity(0.5),
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(
                                              20,
                                            ),
                                          ),
                                        ),
                                        child: Text(
                                          _page == _pages.length - 1
                                              ? 'Get Started'
                                              : 'Continue',
                                          style: GoogleFonts.outfit(
                                            fontSize: 18,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      )
                                      .animate(
                                        target: _page == _pages.length - 1
                                            ? 1
                                            : 0,
                                      )
                                      .shimmer(
                                        duration: 1500.ms,
                                        color: _pages.last['color'],
                                      ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
