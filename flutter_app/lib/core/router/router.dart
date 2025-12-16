import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// App Router Configuration
/// Ported from client/src/App.jsx react-router-dom routes
final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  debugLogDiagnostics: true,
  routes: [
    // ===== MAIN SHELL =====
    ShellRoute(
      builder: (context, state, child) {
        // TODO: Replace with MainLayout widget
        return Scaffold(
          body: child,
          bottomNavigationBar: BottomNavigationBar(
            currentIndex: _calculateSelectedIndex(state.uri.path),
            onTap: (index) => _onItemTapped(index, context),
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
              BottomNavigationBarItem(icon: Icon(Icons.book), label: 'Library'),
              BottomNavigationBarItem(
                icon: Icon(Icons.quiz),
                label: 'Practice',
              ),
              BottomNavigationBarItem(
                icon: Icon(Icons.person),
                label: 'Profile',
              ),
            ],
          ),
        );
      },
      routes: [
        GoRoute(
          path: '/',
          name: 'home',
          builder: (context, state) => const _PlaceholderScreen(title: 'Home'),
        ),
        GoRoute(
          path: '/library',
          name: 'library',
          builder: (context, state) =>
              const _PlaceholderScreen(title: 'Library'),
        ),
        GoRoute(
          path: '/practice',
          name: 'practice',
          builder: (context, state) =>
              const _PlaceholderScreen(title: 'Practice'),
        ),
        GoRoute(
          path: '/profile',
          name: 'profile',
          builder: (context, state) =>
              const _PlaceholderScreen(title: 'Profile'),
        ),
      ],
    ),
    // ===== AUTH ROUTES (Outside shell) =====
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const _PlaceholderScreen(title: 'Login'),
    ),
  ],
);

int _calculateSelectedIndex(String path) {
  if (path.startsWith('/library')) return 1;
  if (path.startsWith('/practice')) return 2;
  if (path.startsWith('/profile')) return 3;
  return 0; // Home
}

void _onItemTapped(int index, BuildContext context) {
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
      context.goNamed('profile');
      break;
  }
}

/// Temporary placeholder screen for development
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          '$title Screen\n(To be implemented)',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
