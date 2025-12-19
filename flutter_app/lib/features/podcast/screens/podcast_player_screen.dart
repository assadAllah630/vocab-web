import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../providers/podcast_provider.dart';

class PodcastPlayerScreen extends ConsumerWidget {
  const PodcastPlayerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(podcastProvider);
    final notifier = ref.read(podcastProvider.notifier);
    final episode = state.currentEpisode;

    if (episode == null) return const SizedBox.shrink();

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Ambient Background
          Positioned.fill(
            child: Opacity(
              opacity: 0.3,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF312E81), Colors.black],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Column(
              children: [
                // Header
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(
                          LucideIcons.chevronDown,
                          color: Colors.white,
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const Text(
                        'NOW PLAYING',
                        style: TextStyle(
                          color: Color(0xFF818CF8),
                          fontSize: 12,
                          letterSpacing: 2,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(
                          LucideIcons.moreHorizontal,
                          color: Colors.white,
                        ),
                        onPressed: () {},
                      ),
                    ],
                  ),
                ),

                // Transcript Area (Immersive)
                Expanded(
                  child: StreamBuilder<Duration>(
                    stream: notifier.positionStream,
                    builder: (context, snapshot) {
                      final currentPos = snapshot.data ?? Duration.zero;
                      final transcript =
                          (episode['speech_marks'] as List?) ?? [];

                      // Find active word
                      // We want the word where wordStart <= currentPos
                      int activeIndex = -1;
                      if (transcript.isNotEmpty) {
                        // Simple linear search or binary search
                        // Optimizing linear search given speech marks aren't huge
                        for (int i = 0; i < transcript.length; i++) {
                          final mark = transcript[i];
                          // 'time' is usually in ms
                          if (mark['time'] <= currentPos.inMilliseconds) {
                            activeIndex = i;
                          } else {
                            break;
                          }
                        }
                      }

                      if (transcript.isEmpty) {
                        return const Center(
                          child: Text(
                            'No transcript available',
                            style: TextStyle(color: Colors.grey),
                          ),
                        );
                      }

                      return Center(
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 40,
                          ),
                          child: Wrap(
                            alignment: WrapAlignment.center,
                            spacing: 8,
                            runSpacing: 12,
                            children: transcript.asMap().entries.map((entry) {
                              final index = entry.key;
                              final mark = entry.value;
                              final isActive = index == activeIndex;
                              final isPast = index < activeIndex;

                              return GestureDetector(
                                onTap: () {
                                  notifier.seek(
                                    Duration(milliseconds: mark['time']),
                                  );
                                },
                                child: AnimatedScale(
                                  scale: isActive ? 1.1 : 1.0,
                                  duration: 200.ms,
                                  child: AnimatedOpacity(
                                    opacity: isActive
                                        ? 1.0
                                        : (isPast ? 0.6 : 0.3),
                                    duration: 300.ms,
                                    child: Text(
                                      mark['word'],
                                      style: TextStyle(
                                        color: isActive
                                            ? Colors.white
                                            : const Color(0xFF71717A),
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                        shadows: isActive
                                            ? [
                                                const BoxShadow(
                                                  color: Color(0xFF6366F1),
                                                  blurRadius: 12,
                                                  spreadRadius: 2,
                                                ),
                                              ]
                                            : [],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      );
                    },
                  ),
                ),

                // Controls
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.transparent, Colors.black],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                  child: Column(
                    children: [
                      Text(
                        episode['title'],
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        episode['category_name'] ?? 'Podcast',
                        style: const TextStyle(
                          color: Color(0xFF818CF8),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Progress Bar
                      StreamBuilder<PositionData>(
                        stream: notifier.positionDataStream,
                        builder: (context, snapshot) {
                          final positionData = snapshot.data;
                          return ProgressBar(
                            progress: positionData?.position ?? Duration.zero,
                            buffered:
                                positionData?.bufferedPosition ?? Duration.zero,
                            total: positionData?.duration ?? Duration.zero,
                            onSeek: notifier.seek,
                            baseBarColor: Colors.white.withValues(alpha: 0.1),
                            progressBarColor: const Color(0xFF6366F1),
                            thumbColor: Colors.white,
                            thumbRadius: 6,
                            timeLabelTextStyle: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          );
                        },
                      ),

                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            icon: const Icon(
                              LucideIcons.skipBack,
                              color: Colors.white,
                            ),
                            onPressed: () {}, // -10s could be implemented
                          ),
                          Container(
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: Icon(
                                state.playerStatus ==
                                        PodcastPlayerStatus.playing
                                    ? LucideIcons.pause
                                    : LucideIcons.play,
                                color: Colors.black,
                              ),
                              onPressed: () => notifier.togglePlay(),
                              padding: const EdgeInsets.all(16),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(
                              LucideIcons.skipForward,
                              color: Colors.white,
                            ),
                            onPressed: () {}, // +10s
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
