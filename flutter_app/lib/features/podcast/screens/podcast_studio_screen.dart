import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/podcast_provider.dart';
import 'podcast_player_screen.dart'; // We will create this next

class PodcastStudioScreen extends ConsumerStatefulWidget {
  const PodcastStudioScreen({super.key});

  @override
  ConsumerState<PodcastStudioScreen> createState() =>
      _PodcastStudioScreenState();
}

class _PodcastStudioScreenState extends ConsumerState<PodcastStudioScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
      () => ref.read(podcastProvider.notifier).fetchCategories(),
    );
  }

  void _showCreateCategoryModal() {
    // Basic modal for creation
    // For brevity in MVP, implementation can be expanded.
    // I will implement a simplified dialog here.
    final nameController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text(
          'New Podcast Series',
          style: TextStyle(color: Colors.white),
        ),
        content: TextField(
          controller: nameController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            hintText: 'Series Name (e.g. Daily Tech)',
            hintStyle: TextStyle(color: Colors.grey),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.grey),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                ref.read(podcastProvider.notifier).createCategory({
                  'name': nameController.text,
                  'style': 'Conversational',
                  'tone': 'Casual',
                });
                Navigator.pop(ctx);
              }
            },
            child: const Text(
              'Create',
              style: TextStyle(color: Color(0xFF6366F1)),
            ),
          ),
        ],
      ),
    );
  }

  void _showGenerateModal() {
    final state = ref.read(podcastProvider);
    if (state.selectedCategory == null) return;

    final topicController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF18181B),
        title: const Text(
          'Generate Episode',
          style: TextStyle(color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: topicController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Topic (Optional)',
                hintStyle: TextStyle(color: Colors.grey),
                filled: true,
                fillColor: Color(0xFF27272A),
                border: OutlineInputBorder(borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              ref
                  .read(podcastProvider.notifier)
                  .generatePodcast(
                    categoryId: state.selectedCategory!['id'],
                    topic: topicController.text.isEmpty
                        ? null
                        : topicController.text,
                  );
              Navigator.pop(ctx);
            },
            child: const Text(
              'Generate',
              style: TextStyle(color: Color(0xFF6366F1)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(podcastProvider);
    final notifier = ref.read(podcastProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: Stack(
        children: [
          SafeArea(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(
                              LucideIcons.chevronLeft,
                              color: Colors.grey,
                            ),
                            onPressed: () => context.pop(),
                          ),
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Podcast Studio',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                'Create & Listen',
                                style: TextStyle(
                                  color: Colors.grey,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: _showCreateCategoryModal,
                        icon: const Icon(LucideIcons.plus, color: Colors.white),
                        style: IconButton.styleFrom(
                          backgroundColor: const Color(0xFF6366F1),
                          padding: const EdgeInsets.all(8),
                        ),
                      ),
                    ],
                  ),
                ),

                // Categories (Horizontal)
                SizedBox(
                  height: 100,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount:
                        state.categories.length + (state.isLoading ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= state.categories.length) {
                        return const Center(child: CircularProgressIndicator());
                      }
                      final cat = state.categories[index];
                      final isSelected =
                          state.selectedCategory?['id'] == cat['id'];

                      return GestureDetector(
                        onTap: () => notifier.selectCategory(cat),
                        child: Container(
                          width: 200,
                          margin: const EdgeInsets.only(right: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected
                                ? const Color(0xFF6366F1).withValues(alpha: 0.1)
                                : const Color(0xFF18181B),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected
                                  ? const Color(0xFF6366F1)
                                  : const Color(0xFF27272A),
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? const Color(0xFF6366F1)
                                      : const Color(0xFF27272A),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  LucideIcons.headphones,
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      cat['name'],
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      cat['style'] ?? 'Podcast',
                                      style: const TextStyle(
                                        color: Colors.grey,
                                        fontSize: 10,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),

                const SizedBox(height: 24),

                // Generation Status
                if (state.isGenerating)
                  Container(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF18181B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              state.generationMessage ?? 'Generating...',
                              style: const TextStyle(
                                color: Color(0xFF818CF8),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${state.generationEstimatedTime}s',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontFamily: 'monospace',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: state.generationProgress / 100,
                          backgroundColor: const Color(0xFF27272A),
                          valueColor: const AlwaysStoppedAnimation(
                            Color(0xFF6366F1),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Actions Bar
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Episodes',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => notifier.deleteCategory(),
                            icon: const Icon(
                              LucideIcons.trash2,
                              size: 18,
                              color: Color(0xFFEF4444),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton.icon(
                            onPressed: state.isGenerating
                                ? null
                                : _showGenerateModal,
                            icon: const Icon(LucideIcons.sparkles, size: 16),
                            label: const Text('Generate New'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF6366F1),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Episode List (Vertical)
                Expanded(
                  child: state.episodes.isEmpty
                      ? const Center(
                          child: Text(
                            'No episodes yet.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(
                            16,
                            16,
                            16,
                            100,
                          ), // Bottom padding for mini player
                          itemCount: state.episodes.length,
                          itemBuilder: (context, index) {
                            final ep = state.episodes[index];
                            final isPlayingThis =
                                state.currentEpisode?['id'] == ep['id'];

                            return GestureDetector(
                              onTap: () => notifier.playEpisode(ep),
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 12),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: isPlayingThis
                                      ? const Color(
                                          0xFF6366F1,
                                        ).withValues(alpha: 0.1)
                                      : const Color(0xFF18181B),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: isPlayingThis
                                        ? const Color(0xFF6366F1)
                                        : const Color(0xFF27272A),
                                  ),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                      horizontal: 6,
                                                      vertical: 2,
                                                    ),
                                                decoration: BoxDecoration(
                                                  color: const Color(
                                                    0xFF27272A,
                                                  ),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  'EP ${ep['episode_number']}',
                                                  style: const TextStyle(
                                                    color: Colors.grey,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 8),
                                              const Icon(
                                                LucideIcons.clock,
                                                size: 12,
                                                color: Colors.grey,
                                              ),
                                              const SizedBox(width: 4),
                                              Text(
                                                '${((ep['duration'] ?? 0) / 60).round()}m',
                                                style: const TextStyle(
                                                  color: Colors.grey,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            ep['title'],
                                            style: TextStyle(
                                              color: isPlayingThis
                                                  ? const Color(0xFF818CF8)
                                                  : Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            ep['summary'] ?? '',
                                            style: const TextStyle(
                                              color: Colors.grey,
                                              fontSize: 12,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    CircleAvatar(
                                      backgroundColor: isPlayingThis
                                          ? const Color(0xFF6366F1)
                                          : const Color(0xFF27272A),
                                      child: Icon(
                                        (isPlayingThis &&
                                                state.playerStatus ==
                                                    PodcastPlayerStatus.playing)
                                            ? LucideIcons.pause
                                            : LucideIcons.play,
                                        color: isPlayingThis
                                            ? Colors.white
                                            : Colors.grey,
                                        size: 20,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),

          // Mini Player Overlay
          if (state.currentEpisode != null)
            Positioned(
              bottom: 20,
              left: 16,
              right: 16,
              child: GestureDetector(
                onTap: () {
                  // Open Full Player
                  showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (context) => const PodcastPlayerScreen(),
                  );
                },
                child:
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF18181B).withValues(alpha: 0.95),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF27272A)),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.5),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF6366F1), Color(0xFF818CF8)],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              LucideIcons.headphones,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  state.currentEpisode?['title'] ??
                                      'Playing...',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const Text(
                                  'Tap for Transcript',
                                  style: TextStyle(
                                    color: Color(0xFF6366F1),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: Icon(
                              state.playerStatus == PodcastPlayerStatus.playing
                                  ? LucideIcons.pause
                                  : LucideIcons.play,
                              color: Colors.white,
                            ),
                            onPressed: () => notifier.togglePlay(),
                          ),
                        ],
                      ),
                    ).animate().slide(
                      begin: const Offset(0, 1),
                      end: const Offset(0, 0),
                      duration: 300.ms,
                    ),
              ),
            ),
        ],
      ),
    );
  }
}
