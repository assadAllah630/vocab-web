# Semantic Search Module Context

## Purpose
Vector-based similarity search for vocabulary and content using embeddings.

---

## Key Files

| File | Size | Purpose |
|------|------|---------|
| `semantic_search_views.py` | 6KB | Search endpoints |
| `embedding_service.py` | 5KB | Embedding generation |

---

## Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/vocab/semantic-search/` | POST | Find similar words |
| `/vocab/generate-embeddings/` | POST | Generate embeddings for vocab |
| `/vocab/validate-openrouter/` | POST | Validate embedding API key |

---

## How It Works

1. **Embedding Generation**
   - Uses OpenAI-compatible embedding APIs
   - Stores vectors in `SavedText.embedding` (PostgreSQL array)

2. **Similarity Search**
   - Cosine similarity calculation
   - Returns ranked results

---

## Usage Example

```python
# Search for semantically similar words
response = await api.post('/vocab/semantic-search/', {
    'query': 'transportation',
    'limit': 10
})
# Returns words related to "transportation" by meaning
```

---

## Integration

- `Vocabulary.related_concepts` uses semantic similarity
- Smart Reader uses embeddings for content matching
- Recommendation engine uses for content discovery

---

*Version: 1.1 | Updated: 2025-12-24*
