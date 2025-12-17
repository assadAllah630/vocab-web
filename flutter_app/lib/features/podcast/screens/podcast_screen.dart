import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:just_audio/just_audio.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/podcast_provider.dart';

class PodcastScreen extends ConsumerWidget {
  const PodcastScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manager = ref.watch(podcastProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: const Text(
          'Podcast Studio',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus, color: Colors.white),
            tooltip: 'Generate Podcast',
            onPressed: () => _showGenerateModal(context, manager),
          ),
          IconButton(
            icon: const Icon(LucideIcons.listMusic, color: Colors.white),
            onPressed: () => _showPlaylist(context, manager),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: StreamBuilder<PodcastEpisode?>(
          stream: manager.currentEpisodeStream,
          builder: (context, snapshot) {
            final episode = snapshot.data;
            if (episode == null) {
              return const Center(child: CircularProgressIndicator());
            }

            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Album Art
                Container(
                  width: 280,
                  height: 280,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF8B5CF6).withOpacity(0.3),
                        blurRadius: 40,
                        offset: const Offset(0, 20),
                      ),
                    ],
                    image: DecorationImage(
                      image: NetworkImage(episode.imageUrl),
                      fit: BoxFit.cover,
                    ),
                  ),
                ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),

                const SizedBox(height: 40),

                // Info
                Text(
                  episode.title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  episode.author,
                  style: const TextStyle(
                    color: Color(0xFFA1A1AA),
                    fontSize: 16,
                  ),
                ),

                const SizedBox(height: 40),

                // Progress Bar
                StreamBuilder<PositionData>(
                  stream: manager.positionDataStream,
                  builder: (context, snapshot) {
                    final positionData = snapshot.data;
                    return ProgressBar(
                      progress: positionData?.position ?? Duration.zero,
                      buffered: positionData?.bufferedPosition ?? Duration.zero,
                      total: positionData?.duration ?? Duration.zero,
                      onSeek: manager.seek,
                      baseBarColor: const Color(0xFF27272A),
                      progressBarColor: const Color(0xFF8B5CF6),
                      bufferedBarColor: const Color(0xFF3F3F46),
                      thumbColor: Colors.white,
                      barHeight: 6.0,
                      thumbRadius: 8.0,
                      timeLabelTextStyle: const TextStyle(
                        color: Color(0xFFA1A1AA),
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  },
                ),

                const SizedBox(height: 40),

                // Controls
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconButton(
                      icon: const Icon(
                        LucideIcons.skipBack,
                        color: Colors.white,
                        size: 32,
                      ),
                      onPressed: manager.skipToPrevious,
                    ),
                    const SizedBox(width: 32),
                    StreamBuilder<PlayerState>(
                      stream: manager.player.playerStateStream,
                      builder: (context, snapshot) {
                        final playerState = snapshot.data;
                        final processingState = playerState?.processingState;
                        final playing = playerState?.playing;

                        if (processingState == ProcessingState.loading ||
                            processingState == ProcessingState.buffering) {
                          return const SizedBox(
                            width: 64,
                            height: 64,
                            child: CircularProgressIndicator(
                              color: Color(0xFF8B5CF6),
                            ),
                          );
                        } else if (playing != true) {
                          return Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(
                                LucideIcons.play,
                                color: Colors.black,
                                size: 32,
                              ),
                              onPressed: manager.play,
                            ),
                          );
                        } else {
                          return Container(
                            width: 64,
                            height: 64,
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(
                                LucideIcons.pause,
                                color: Colors.black,
                                size: 32,
                              ),
                              onPressed: manager.pause,
                            ),
                          );
                        }
                      },
                    ),
                    const SizedBox(width: 32),
                    IconButton(
                      icon: const Icon(
                        LucideIcons.skipForward,
                        color: Colors.white,
                        size: 32,
                      ),
                      onPressed: manager.skipToNext,
                    ),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  void _showGenerateModal(BuildContext context, PodcastManager manager) {
    final topicController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Generate Podcast',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(LucideIcons.x, color: Colors.grey),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              TextField(
                controller: topicController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'Topic',
                  labelStyle: const TextStyle(color: Colors.grey),
                  filled: true,
                  fillColor: const Color(0xFF27272A),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    if (topicController.text.isNotEmpty) {
                      manager.generatePodcast(
                        topicController.text,
                        'Monologue',
                      );
                      Navigator.pop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF8B5CF6),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text(
                    'Generate',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  void _showPlaylist(BuildContext context, PodcastManager manager) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF18181B),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Up Next',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: manager.playlist.length,
                  itemBuilder: (context, index) {
                    final episode = manager.playlist[index];
                    return ListTile(
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          episode.imageUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                        ),
                      ),
                      title: Text(
                        episode.title,
                        style: const TextStyle(color: Colors.white),
                      ),
                      subtitle: Text(
                        episode.author,
                        style: const TextStyle(color: Color(0xFFA1A1AA)),
                      ),
                      onTap: () {
                        manager.playEpisode(index);
                        Navigator.pop(context);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
