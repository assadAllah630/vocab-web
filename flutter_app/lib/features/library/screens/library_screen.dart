import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../providers/library_provider.dart';
import 'package:intl/intl.dart';

class LibraryScreen extends ConsumerStatefulWidget {
  const LibraryScreen({super.key});

  @override
  ConsumerState<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends ConsumerState<LibraryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(libraryProvider.notifier).fetchLibrary();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final libraryState = ref.watch(libraryProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text(
          'Library',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24),
        ),
        actions: [
          IconButton(
            onPressed: () {
              ref.read(libraryProvider.notifier).fetchLibrary();
            },
            icon: const Icon(LucideIcons.refreshCw),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          dividerColor: Colors.transparent,
          indicatorColor: const Color(0xFFF59E0B),
          labelColor: const Color(0xFFF59E0B),
          unselectedLabelColor: const Color(0xFF71717A),
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Stories'),
            Tab(text: 'Dialogues'),
            Tab(text: 'Articles'),
          ],
        ),
      ),
      body: libraryState.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFF59E0B)),
            )
          : TabBarView(
              controller: _tabController,
              children: [
                _buildList(
                  context,
                  [
                    ...libraryState.stories,
                    ...libraryState.dialogues,
                    ...libraryState.articles,
                  ]..sort((a, b) => b.createdAt.compareTo(a.createdAt)),
                ),
                _buildList(context, libraryState.stories),
                _buildList(context, libraryState.dialogues),
                _buildList(context, libraryState.articles),
              ],
            ),
    );
  }

  Widget _buildList(BuildContext context, List<LibraryItem> items) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              LucideIcons.library,
              size: 64,
              color: Colors.white.withValues(alpha: 0.1),
            ),
            const SizedBox(height: 16),
            const Text(
              'No content yet',
              style: TextStyle(color: Color(0xFF71717A)),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return _LibraryContentCard(
          item: item,
        ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.1, end: 0);
      },
    );
  }
}

class _LibraryContentCard extends StatelessWidget {
  final LibraryItem item;

  const _LibraryContentCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigate based on type
        switch (item.type) {
          case 'story':
            context.push('/library/story/${item.id}');
            break;
          case 'dialogue':
            context.push('/library/dialogue/${item.id}');
            break;
          case 'article':
            context.push('/library/article/${item.id}');
            break;
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF18181B),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFF27272A)),
        ),
        child: Row(
          children: [
            _buildIcon(item.type),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      if (item.level != null)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF27272A),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            item.level!,
                            style: const TextStyle(
                              fontSize: 10,
                              color: Color(0xFFA1A1AA),
                            ),
                          ),
                        ),
                      if (item.level != null) const SizedBox(width: 8),
                      Text(
                        _formatDate(item.createdAt),
                        style: const TextStyle(
                          fontSize: 10,
                          color: Color(0xFF52525B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              LucideIcons.chevronRight,
              color: Color(0xFF52525B),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat.MMMEd().format(date);
  }

  Widget _buildIcon(String type) {
    IconData icon;
    Color color;

    switch (type) {
      case 'story':
        icon = LucideIcons.bookOpen;
        color = const Color(0xFF8B5CF6);
        break;
      case 'dialogue':
        icon = LucideIcons.messageCircle;
        color = const Color(0xFFEC4899);
        break;
      case 'article':
        icon = LucideIcons.newspaper;
        color = const Color(0xFF10B981);
        break;
      default:
        icon = LucideIcons.file;
        color = const Color(0xFFA1A1AA);
    }

    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }
}
