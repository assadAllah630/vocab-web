# AI Agents Context

## Purpose
LangGraph-based agents for complex AI tasks. Located in `server/api/agents/` and root.

---

## Agent Files

### Root Level Agents
| File | Size | Purpose |
|------|------|---------|
| `agent_exam.py` | 14KB | Exam question generation |
| `agent_podcast.py` | 14KB | Podcast script writing |
| `grammar_agent.py` | 10KB | Grammar exercise generation |
| `advanced_text_agent.py` | 22KB | Story/Article generation |
| `text_converter_agent.py` | 20KB | Text formatting/conversion |
| `image_generation_agent.py` | 12KB | Image generation for stories |

### agents/ Directory
| File | Purpose |
|------|---------|
| `recommendation_agent.py` | Personalized content recommendations |
| `student_insights.py` | Learning analytics & insights |
| `vocabulary_agent.py` | Vocabulary enrichment |
| `writing_grader.py` | AI essay/writing grading |

---

## Architecture Pattern

All agents follow LangGraph structure:
```python
from langgraph.graph import StateGraph

class AgentState(TypedDict):
    input: str
    output: str
    # ... state fields

def agent_node(state: AgentState) -> AgentState:
    # Process step
    return updated_state

graph = StateGraph(AgentState)
graph.add_node("step1", agent_node)
# ... build graph
```

---

## Integration with unified_ai

Agents use `unified_ai.generate_ai_content()` for LLM calls:
```python
from api.unified_ai import generate_ai_content

response = generate_ai_content(
    user=request.user,
    prompt="Generate 5 exam questions about...",
    json_mode=True
)
```

---

*Version: 1.0 | Created: 2025-12-24*
