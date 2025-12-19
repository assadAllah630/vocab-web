import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/story_provider.dart';
import 'story_display_screen.dart';

class StoryViewerScreen extends ConsumerStatefulWidget {
  final String contentId;
  const StoryViewerScreen({super.key, required this.contentId});

  @override
  ConsumerState<StoryViewerScreen> createState() => _StoryViewerScreenState();
}

class _StoryViewerScreenState extends ConsumerState<StoryViewerScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(storyProvider.notifier).fetchStory(widget.contentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final storyState = ref.watch(storyProvider);

    if (storyState.isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFF6366F1)),
              SizedBox(height: 16),
              Text(
                'Loading story...',
                style: TextStyle(color: Color(0xFFA1A1AA)),
              ),
            ],
          ),
        ),
      );
    }

    if (storyState.error != null) {
      return Scaffold(
        backgroundColor: const Color(0xFF09090B),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          leading: IconButton(
            icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
            onPressed: () => context.pop(),
          ),
        ),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                LucideIcons.alertTriangle,
                size: 48,
                color: Color(0xFFEF4444),
              ),
              const SizedBox(height: 16),
              Text(
                'Failed to load story',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                storyState.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF71717A)),
              ),
            ],
          ),
        ),
      );
    }

    final story = storyState.currentStory;
    if (story == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: Stack(
        children: [
          StoryDisplayScreen(
            content: story['content_data'] ?? {},
            title: story['content_data']?['title'],
            level: story['parameters']?['level'],
          ),

          // Back button overlay if needed, though StoryDisplayScreen has its own header.
          // Since StoryDisplayScreen is meant to be full screen in the wizard too,
          // we might want a back button here if not in wizard.
          Positioned(
            top: 12,
            left: 12,
            child: SafeArea(
              child: CircleAvatar(
                backgroundColor: Colors.black45,
                child: IconButton(
                  icon: const Icon(
                    LucideIcons.chevronLeft,
                    color: Colors.white,
                    size: 20,
                  ),
                  onPressed: () => context.pop(),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
