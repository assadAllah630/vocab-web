# Podcasts Feature Index

## Overview
All context files related to Podcasts (External RSS & AI-generated).

---

## Backend
| Context | Purpose |
|---------|---------|
| [podcast.context.md](file:///e:/vocab_web/.context/modules/backend/podcast.context.md) | RSS + AI podcast models, views |
| [podcast_exam.context.md](file:///e:/vocab_web/.context/modules/backend/podcast_exam.context.md) | Podcast-based exams |
| [tts.context.md](file:///e:/vocab_web/.context/modules/backend/tts.context.md) | Audio synthesis |

## Frontend Desktop
| Page | Purpose |
|------|---------|
| `PodcastCreator.jsx` | AI podcast creation |
| `MyPodcasts.jsx` | Podcast library |

## Mobile React
| Page | Purpose |
|------|---------|
| `MobilePodcastStudio.jsx` | Podcast creation |
| `MobileExternalPodcastLibrary.jsx` | RSS podcast browser |
| `MobileExternalPodcastDetail.jsx` | Show details |
| `MobileExternalEpisodePlayer.jsx` | Audio player |

## Flutter
| Screen | Purpose |
|--------|---------|
| `podcast_screen.dart` | Podcast list |
| `podcast_player_screen.dart` | Audio player |
| `podcast_studio_screen.dart` | Creation |

---

## Key Models
- `Podcast`, `PodcastCategory` (AI-generated)
- `ExternalPodcast`, `ExternalEpisode`, `ExternalPodcastSubscription`
- `PodcastExam`, `PodcastExamAttempt`

---

*Feature Index v1.0*
