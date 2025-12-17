import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/widgets/login_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/ai/screens/ai_gateway_screen.dart';
import '../../features/ai/screens/ai_generator_screen.dart';
import '../../features/ai/screens/gen_story_screen.dart';
import '../../features/ai/screens/gen_dialogue_screen.dart';
import '../../features/ai/screens/gen_article_screen.dart';
import '../../features/library/screens/library_screen.dart';
import '../../features/library/screens/content_viewers.dart';
import '../../features/reader/screens/reader_screen.dart';
import '../../features/reader/screens/reader_view_screen.dart';
import '../../features/reader/screens/grammar_screen.dart';
import '../../features/vocab/screens/vocab_dashboard_screen.dart';
import '../../features/vocab/screens/flashcards_screen.dart';
import '../../features/vocab/screens/word_builder_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/profile/screens/edit_profile_screen.dart';
import '../../features/profile/screens/settings_screen.dart';
import '../../features/settings/screens/about_screen.dart';
import '../../features/settings/screens/help_screen.dart';
import '../../features/profile/screens/language_settings_screen.dart';
import '../../features/profile/screens/api_settings_screen.dart';
import '../../features/settings/screens/security_settings_screen.dart';
import '../../features/reader/screens/grammar_generator_screen.dart';
import '../../features/auth/screens/onboarding_screen.dart';
import '../../features/profile/screens/subscription_screen.dart';
import '../widgets/error_screen.dart';
import '../../features/exams/screens/exam_dashboard_screen.dart';
import '../../features/exams/screens/exam_create_screen.dart';
import '../../features/exams/screens/exam_play_screen.dart';
import '../../features/podcast/screens/podcast_screen.dart';
import '../../features/vocab/screens/memory_match_screen.dart';
import '../../features/vocab/screens/time_challenge_screen.dart';
import '../../features/vocab/screens/add_word_screen.dart';
import '../../features/notifications/screens/notifications_screen.dart';
import '../layouts/main_layout.dart';

/// App Router Configuration
final GoRouter appRouter = GoRouter(
  initialLocation: '/onboarding', // Start with onboarding flow
  debugLogDiagnostics: true,
  routes: [
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    // ===== MAIN SHELL =====
    ShellRoute(
      builder: (context, state, child) {
        return _ScaffoldWithNavbar(child: child);
      },
      routes: [
        GoRoute(
          path: '/home',
          name: 'home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/library',
          name: 'library',
          builder: (context, state) => const LibraryScreen(),
          routes: [
            GoRoute(
              path: 'story/:id',
              name: 'story_viewer',
              builder: (context, state) =>
                  StoryViewerScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: 'dialogue/:id',
              name: 'dialogue_viewer',
              builder: (context, state) =>
                  DialogueViewerScreen(id: state.pathParameters['id']!),
            ),
            GoRoute(
              path: 'article/:id',
              name: 'article_viewer',
              builder: (context, state) =>
                  ArticleViewerScreen(id: state.pathParameters['id']!),
            ),
          ],
        ),
        GoRoute(
          path: '/practice',
          name: 'practice',
          // Mapping "Practice" tab to ReaderDashboard as it's the main learning tool
          builder: (context, state) => const ReaderScreen(),
          routes: [
            GoRoute(
              path: 'view',
              name: 'reader_view',
              parentNavigatorKey:
                  null, // Use root navigator to hide bottom nav if desired, or keep it.
              // Taking standard approach
              builder: (context, state) => const ReaderViewScreen(),
            ),
            GoRoute(
              path: 'grammar',
              name: 'grammar',
              builder: (context, state) => const GrammarScreen(),
              routes: [
                GoRoute(
                  path: 'generate',
                  name: 'grammar_generate',
                  parentNavigatorKey: null,
                  builder: (context, state) => const GrammarGeneratorScreen(),
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/games',
          name: 'vocab',
          builder: (context, state) => const VocabDashboardScreen(),
          routes: [
            GoRoute(
              path: 'flashcards',
              name: 'flashcards',
              parentNavigatorKey: null,
              builder: (context, state) => const FlashcardsScreen(),
            ),
            GoRoute(
              path: 'builder',
              name: 'word_builder',
              parentNavigatorKey: null,
              builder: (context, state) => const WordBuilderScreen(),
            ),
            GoRoute(
              path: 'memory',
              name: 'memory_match',
              parentNavigatorKey: null,
              builder: (context, state) => const MemoryMatchScreen(),
            ),
            GoRoute(
              path: 'challenge',
              name: 'time_challenge',
              parentNavigatorKey: null,
              builder: (context, state) => const TimeChallengeScreen(),
            ),
          ],
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) => const ProfileScreen(),
          routes: [
            GoRoute(
              path: 'edit',
              name: 'edit_profile',
              parentNavigatorKey: null,
              builder: (context, state) => const EditProfileScreen(),
            ),
            GoRoute(
              path: 'settings',
              name: 'settings',
              parentNavigatorKey: null,
              builder: (context, state) => const SettingsScreen(),
              routes: [
                GoRoute(
                  path: 'language',
                  name: 'language_settings',
                  parentNavigatorKey: null,
                  builder: (context, state) => const LanguageSettingsScreen(),
                ),
                GoRoute(
                  path: 'api',
                  name: 'api_settings',
                  parentNavigatorKey: null,
                  builder: (context, state) => const APISettingsScreen(),
                ),
                GoRoute(
                  path: 'about',
                  name: 'about',
                  parentNavigatorKey: null,
                  builder: (context, state) => const AboutScreen(),
                ),
                GoRoute(
                  path: 'security',
                  name: 'security_settings',
                  parentNavigatorKey: null,
                  builder: (context, state) => const SecuritySettingsScreen(),
                ),
                GoRoute(
                  path: 'help',
                  name: 'help',
                  parentNavigatorKey: null,
                  builder: (context, state) => const HelpScreen(),
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/exams',
          name: 'exams',
          builder: (context, state) => const ExamDashboardScreen(),
          routes: [
            GoRoute(
              path: 'create',
              name: 'create_exam',
              parentNavigatorKey: null,
              builder: (context, state) => const ExamCreateScreen(),
            ),
            GoRoute(
              path: 'play/:id',
              name: 'play_exam',
              parentNavigatorKey: null,
              builder: (context, state) =>
                  ExamPlayScreen(examId: state.pathParameters['id']!),
            ),
          ],
        ),

        GoRoute(
          path: '/podcast',
          name: 'podcast',
          builder: (context, state) => const PodcastScreen(),
        ),
        GoRoute(
          path: '/words/add',
          name: 'add_word',
          builder: (context, state) => const AddWordScreen(),
        ),
        GoRoute(
          path: '/notifications',
          name: 'notifications',
          builder: (context, state) => const NotificationsScreen(),
        ),
        // AI Routes
        GoRoute(
          path: '/ai',
          name: 'ai_studio',
          builder: (context, state) => const AIGeneratorScreen(),
        ),
        GoRoute(
          path: '/ai/gateway',
          name: 'ai_gateway',
          builder: (context, state) => const AIGatewayScreen(),
        ),
        GoRoute(
          path: '/ai/story',
          name: 'gen_story',
          builder: (context, state) => const GenStoryScreen(),
        ),
        GoRoute(
          path: '/ai/dialogue',
          name: 'gen_dialogue',
          builder: (context, state) => const GenDialogueScreen(),
        ),
        GoRoute(
          path: '/ai/article',
          name: 'gen_article',
          builder: (context, state) => const GenArticleScreen(),
        ),
        // Aliases for navigation items if paths differ
        GoRoute(path: '/me', redirect: (context, state) => '/profile'),
      ],
    ),
    // === TOP LEVEL ROUTES (No Bottom Nav) ===
    GoRoute(
      path: '/onboarding',
      name: 'onboarding',
      builder: (context, state) => const OnboardingScreen(),
    ),
    GoRoute(
      path: '/subscription',
      name: 'subscription',
      builder: (context, state) => const SubscriptionScreen(),
    ),
  ],
  errorBuilder: (context, state) =>
      ErrorScreen(message: state.error.toString()),
);

class _ScaffoldWithNavbar extends StatelessWidget {
  final Widget child;

  const _ScaffoldWithNavbar({required this.child});

  @override
  Widget build(BuildContext context) {
    // Determine selected index based on route
    final String location = GoRouterState.of(context).uri.path;
    int selectedIndex = 0;

    if (location.startsWith('/home')) {
      selectedIndex = 0;
    } else if (location.startsWith('/library')) {
      selectedIndex = 1;
    } else if (location.startsWith('/practice')) {
      selectedIndex = 2;
    } else if (location.startsWith('/games')) {
      selectedIndex = 3;
    } else if (location.startsWith('/profile') || location.startsWith('/me')) {
      selectedIndex = 4;
    }

    return MainLayout(
      selectedIndex: selectedIndex,
      onNavTap: (index) {
        switch (index) {
          case 0:
            context.goNamed('home');
            break;
          case 1:
            context.goNamed('library');
            break;
          case 2:
            context.goNamed('practice');
            break;
          case 3:
            context.goNamed(
              'profile',
            ); // Profile is 3/4 depending on index logic?
            // MobileNav has 4 items: Home(0), Library(1), Practice(2), Profile(3).
            // But previous code mapped games to something?
            // MobileNav: Home, Library, Practice, Profile.
            // router has path '/games' ?
            // Let's stick to MobileNav structure: 0=Home, 1=Library, 2=Practice, 3=Profile.
            context.goNamed('profile');
            break;
        }
      },
      child: child,
    );
  }
}
