import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/dialogue_provider.dart';
import 'dialogue_display_screen.dart';

class DialogueViewerScreen extends ConsumerStatefulWidget {
  final String contentId;
  const DialogueViewerScreen({super.key, required this.contentId});

  @override
  ConsumerState<DialogueViewerScreen> createState() =>
      _DialogueViewerScreenState();
}

class _DialogueViewerScreenState extends ConsumerState<DialogueViewerScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(dialogueProvider.notifier).fetchDialogue(widget.contentId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final dialogueState = ref.watch(dialogueProvider);

    if (dialogueState.isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF09090B),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Color(0xFF6366F1)),
              SizedBox(height: 16),
              Text(
                'Loading dialogue...',
                style: TextStyle(color: Color(0xFFA1A1AA)),
              ),
            ],
          ),
        ),
      );
    }

    if (dialogueState.error != null) {
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
                'Failed to load dialogue',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                dialogueState.error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF71717A)),
              ),
            ],
          ),
        ),
      );
    }

    final dialogue = dialogueState.currentDialogue;
    if (dialogue == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: Stack(
        children: [
          DialogueDisplayScreen(
            content: dialogue['content_data'] ?? {},
            title: dialogue['content_data']?['title'],
            level: dialogue['parameters']?['level'],
            tone: dialogue['parameters']?['tone'],
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
