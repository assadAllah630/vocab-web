# Vocabulary Module Context

## Purpose
The **Vocabulary Module** is the core of the spaced repetition system (SRS). It manages words, translations, and user progress using the SuperMemo-2 algorithm.

## Key Models
See `server/api/models.py`.

- **Vocabulary**: The base word entity.
  - `word`, `translation`, `example`.
  - `type`: Part of speech (noun, verb, etc.).
  - `related_concepts`: Abstract semantic links (e.g., "Transportation" -> "Car").
  - `related_words`: Direct lexical links.
- **UserProgress**: Tracks individual learning state per word.
  - `repetition_stage`, `easiness_factor` (EF), `interval` (days).
  - `next_review_date`: When the word is due.

## Logic: Spaced Repetition (SRS)
Implemented in `server/api/srs.py`.
- **Algorithm**: SuperMemo-2 (SM-2).
- **Inputs**: User grade (0-5).
- **Outputs**: New interval, new EF.
- **Rules**:
  - Grade >= 3: Success (Interval increases).
  - Grade < 3: Failure (Interval reset to 1 day).

## Core Features
1. **CRUD**: `VocabularyViewSet` handles standard operations.
2. **Review Session**: `GET /api/vocab/by-status/?status=review` fetches words due for review (`next_review_date <= now`).
3. **Practice Recording**: `POST /api/progress/update/` applies the SRS algorithm and updates `UserProgress`.
4. **Semantic Search**: `POST /api/vocab/semantic-search/` uses vector embeddings to find similar words (see `semantic_search.context.md`).

## Key Files
- `server/api/views/vocab_views.py`: Main ViewSet.
- `server/api/srs.py`: Algorithm implementation.
- `server/api/models.py`: Database schema.

## Usage Examples

### srs_update
```python
# Apply SM-2 algorithm
from api.srs import calculate_srs
result = calculate_srs(
    grade=5, 
    repetitions=3, 
    easiness_factor=2.5, 
    interval=6
)
# result = {'repetitions': 4, 'easiness_factor': 2.6, 'interval': 16}
```
