import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/library_provider.dart';
import '../../shared/widgets/story_display.dart';
import '../../shared/widgets/dialogue_display.dart';
import '../../shared/widgets/article_display.dart';

class StoryViewerScreen extends ConsumerWidget {
  final String id;
  const StoryViewerScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryState = ref.read(libraryProvider.notifier);
    final item = libraryState.getItem(id);

    if (item == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Text("Story not found", style: TextStyle(color: Colors.white)),
        ),
      );
    }

    return StoryDisplay(
      content: item.content,
      title: item.title,
      level: item.level,
      topic: item.topic,
    );
  }
}

class DialogueViewerScreen extends ConsumerWidget {
  final String id;
  const DialogueViewerScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryState = ref.read(libraryProvider.notifier);
    final item = libraryState.getItem(id);

    if (item == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Text(
            "Dialogue not found",
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return DialogueDisplay(
      content: item.content,
      title: item.title,
      level: item.level,
      topic: item.topic,
    );
  }
}

class ArticleViewerScreen extends ConsumerWidget {
  final String id;
  const ArticleViewerScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final libraryState = ref.read(libraryProvider.notifier);
    final item = libraryState.getItem(id);

    if (item == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Text(
            "Article not found",
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    return ArticleDisplay(
      content: item.content,
      title: item.title,
      level: item.level,
      topic: item.topic,
    );
  }
}
