import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/reader_provider.dart';
import '../../shared/widgets/app_text_field.dart';
import '../../shared/widgets/primary_button.dart';

class ReaderScreen extends ConsumerWidget {
  const ReaderScreen({super.key});

  void _showInputSheet(BuildContext context, WidgetRef ref, String type) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => _ReaderInputSheet(type: type),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.go('/home'),
        ),
        title: const Text(
          'Reader',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox.shrink(), // Spacer for alignment if needed
                GestureDetector(
                  onTap: () => context.push('/library'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF27272A),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFF3F3F46)),
                    ),
                    child: const Row(
                      children: [
                        Icon(
                          LucideIcons.library,
                          size: 16,
                          color: Color(0xFF8B5CF6),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'Library',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Text(
              'Read & Learn',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.bold,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Import content and build your vocabulary.',
              style: TextStyle(color: Color(0xFFA1A1AA), fontSize: 16),
            ),
            const SizedBox(height: 32),
            _buildOptionCard(
              context,
              ref,
              title: 'Web Article',
              subtitle: 'Extract text from any website.',
              icon: LucideIcons.globe,
              color: const Color(0xFF3B82F6),
              onTap: () => _showInputSheet(context, ref, 'url'),
              delay: 0,
            ),
            _buildOptionCard(
              context,
              ref,
              title: 'YouTube Video',
              subtitle: 'Get transcripts from videos.',
              icon: LucideIcons.youtube,
              color: const Color(0xFFEF4444),
              onTap: () => _showInputSheet(context, ref, 'youtube'),
              delay: 100,
            ),
            _buildOptionCard(
              context,
              ref,
              title: 'Upload Document',
              subtitle: 'Import PDF, Word, or images.',
              icon: LucideIcons.fileUp,
              color: const Color(0xFF10B981),
              onTap: () {
                // Trigger file picker simulation immediately
                ref.read(readerProvider.notifier).importFile().then((_) {
                  if (context.mounted &&
                      ref.read(readerProvider).error == null) {
                    context.push('/reader/view');
                  }
                });
              },
              delay: 200,
            ),
            _buildOptionCard(
              context,
              ref,
              title: 'Paste Text',
              subtitle: 'Paste text from clipboard.',
              icon: LucideIcons.clipboard,
              color: const Color(0xFFF59E0B),
              onTap: () => _showInputSheet(context, ref, 'text'),
              delay: 300,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionCard(
    BuildContext context,
    WidgetRef ref, {
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
    required int delay,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: Color(0xFFA1A1AA),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(LucideIcons.chevronRight, color: Color(0xFF52525B)),
          ],
        ),
      ),
    ).animate().fadeIn(delay: delay.ms).slideX(begin: 0.1, end: 0);
  }
}

class _ReaderInputSheet extends ConsumerStatefulWidget {
  final String type; // 'url', 'youtube', 'text'

  const _ReaderInputSheet({required this.type});

  @override
  ConsumerState<_ReaderInputSheet> createState() => _ReaderInputSheetState();
}

class _ReaderInputSheetState extends ConsumerState<_ReaderInputSheet> {
  final TextEditingController _controller = TextEditingController();

  Future<void> _handleSubmit() async {
    final notifier = ref.read(readerProvider.notifier);
    final func = switch (widget.type) {
      'url' => () => notifier.importUrl(_controller.text),
      'youtube' => () => notifier.importYoutube(_controller.text),
      'text' => () => notifier.importText(_controller.text),
      _ => () async {},
    };

    await func();

    if (mounted && ref.read(readerProvider).error == null) {
      context.pop(); // Close sheet
      context.push('/reader/view'); // Navigate
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = ref.watch(readerProvider).isLoading;
    final title = switch (widget.type) {
      'url' => 'Web Article URL',
      'youtube' => 'YouTube Video URL',
      'text' => 'Paste Text',
      _ => '',
    };
    final hint = switch (widget.type) {
      'url' => 'https://example.com/article',
      'youtube' => 'https://youtube.com/watch?v=...',
      'text' => 'Paste your content here...',
      _ => '',
    };
    final icon = switch (widget.type) {
      'url' => LucideIcons.globe,
      'youtube' => LucideIcons.youtube,
      'text' => LucideIcons.type,
      _ => LucideIcons.file,
    };

    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF8B5CF6)),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          AppTextField(
            controller: _controller,
            hintText: hint,
            maxLines: widget.type == 'text' ? 8 : 1,
            autofocus: true,
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            label: 'Import Content',
            isLoading: isLoading,
            onPressed: _handleSubmit,
            icon: const Icon(
              LucideIcons.arrowRight,
              size: 20,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
