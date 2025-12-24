# Vocabulary Feature Index

## Overview
All context files related to Vocabulary management and SRS.

---

## Backend
| Context | Purpose |
|---------|---------|
| [vocabulary.context.md](file:///e:/vocab_web/.context/modules/backend/vocabulary.context.md) | Words, SM-2 SRS, UserProgress |
| [semantic_search.context.md](file:///e:/vocab_web/.context/modules/backend/semantic_search.context.md) | Vector search |

## Frontend Desktop
| Page | Purpose |
|------|---------|
| `VocabList.jsx` | Word list (32KB) |
| `AddWord.jsx` | Add vocabulary |
| `QuizSelector.jsx` | Quiz mode |
| `QuizPlay.jsx` | Quiz runner |
| `SharedBank.jsx` | Community bank |

## Mobile React
| Page | Purpose |
|------|---------|
| `MobileWords.jsx` | Word list |
| `MobileAddWord.jsx` | Add word |
| `MobileFlashcard.jsx` | Flashcards |
| `MobileVocabPractice.jsx` | Practice |
| `MobileWordBuilder.jsx` | Word building |
| `MobileMemoryMatch.jsx` | Memory game |

## Flutter
| Screen | Purpose |
|--------|---------|
| `vocab/` folder | 7 files: list, add, flashcard, practice |

---

## Key Models
- `Vocabulary` (word, translation, language, level)
- `UserProgress` (SRS: repetitions, EF, interval, next_review)

## Key Logic
- `srs.py` - SuperMemo-2 algorithm

---

*Feature Index v1.0*
