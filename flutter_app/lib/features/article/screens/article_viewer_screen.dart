import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/article_provider.dart';
import 'article_display_screen.dart';

class ArticleViewerScreen extends ConsumerStatefulWidget {
  final String contentId;
  const ArticleViewerScreen({super.key, required this.contentId});

  @override
  ConsumerState<ArticleViewerScreen> createState() =>
      _ArticleViewerScreenState();
}

class _ArticleViewerScreenState extends ConsumerState<ArticleViewerScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(articleProvider.notifier).fetchArticle(widget.contentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final articleState = ref.watch(articleProvider);

    if (articleState.isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFF10B981)),
              SizedBox(height: 16),
              Text(
                'Loading article...',
                style: TextStyle(color: Color(0xFFA1A1AA)),
              ),
            ],
          ),
        ),
      );
    }

    if (articleState.error != null) {
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
              const Text(
                'Failed to load article',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                articleState.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF71717A)),
              ),
            ],
          ),
        ),
      );
    }

    final article = articleState.currentArticle;
    if (article == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: Stack(
        children: [
          ArticleDisplayScreen(
            content: article['content_data'] ?? {},
            title: article['content_data']?['title'],
            level: article['parameters']?['level'],
            topic: article['parameters']?['topic'],
          ),

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
