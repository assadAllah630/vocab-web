import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:rxdart/rxdart.dart';

class PodcastEpisode {
  final String id;
  final String title;
  final String author;
  final String imageUrl;
  final String audioUrl;
  final Duration duration;

  const PodcastEpisode({
    required this.id,
    required this.title,
    required this.author,
    required this.imageUrl,
    required this.audioUrl,
    required this.duration,
  });
}

class PositionData {
  final Duration position;
  final Duration bufferedPosition;
  final Duration duration;

  PositionData(this.position, this.bufferedPosition, this.duration);
}

final podcastProvider = Provider<PodcastManager>((ref) {
  final manager = PodcastManager();
  ref.onDispose(() => manager.dispose());
  return manager;
});

class PodcastManager {
  final AudioPlayer _player = AudioPlayer();

  // Mock Playlist
  final List<PodcastEpisode> playlist = [
    const PodcastEpisode(
      id: '1',
      title: 'German for Beginners: Ep 1',
      author: 'VocabMaster AI',
      imageUrl:
          'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      audioUrl:
          'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Free sample
      duration: Duration(minutes: 5),
    ),
    const PodcastEpisode(
      id: '2',
      title: 'Business German: Meeting Etiquette',
      author: 'VocabMaster AI',
      imageUrl:
          'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: Duration(minutes: 8),
    ),
    const PodcastEpisode(
      id: '3',
      title: 'Travel Vocabulary',
      author: 'VocabMaster AI',
      imageUrl:
          'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: Duration(minutes: 6),
    ),
  ];

  late Stream<PositionData> positionDataStream;

  PodcastManager() {
    _init();
  }

  void _init() async {
    // Define the playlist
    final audioSource = ConcatenatingAudioSource(
      children: playlist
          .map(
            (e) => AudioSource.uri(
              Uri.parse(e.audioUrl),
              tag: e, // Store episode object in tag
            ),
          )
          .toList(),
    );

    await _player.setAudioSource(audioSource, initialIndex: 0, preload: false);

    positionDataStream =
        Rx.combineLatest3<Duration, Duration, Duration?, PositionData>(
          _player.positionStream,
          _player.bufferedPositionStream,
          _player.durationStream,
          (position, bufferedPosition, duration) => PositionData(
            position,
            bufferedPosition,
            duration ?? Duration.zero,
          ),
        );
  }

  AudioPlayer get player => _player;

  Stream<PodcastEpisode?> get currentEpisodeStream => _player
      .sequenceStateStream
      .map((state) => state?.currentSource?.tag as PodcastEpisode?);

  void play() => _player.play();
  void pause() => _player.pause();
  void seek(Duration position) => _player.seek(position);
  void skipToNext() => _player.seekToNext();
  void skipToPrevious() => _player.seekToPrevious();

  void playEpisode(int index) {
    _player.seek(Duration.zero, index: index);
    _player.play();
  }

  Future<void> generatePodcast(String topic, String type) async {
    // TODO: Implement API call
    // await ApiClient().dio.post('podcasts/generate/', data: {'topic': topic, 'type': type});

    // Simulate latency
    await Future.delayed(const Duration(seconds: 2));

    // Mock adding new episode
    // In real app, we would fetch the new episode or reload playlist
  }

  void dispose() {
    _player.dispose();
  }
}
