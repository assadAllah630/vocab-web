---
description: Create LangGraph agent for generating exams from podcast scripts
---

# Podcast Exam Agent Workflow

This workflow creates the LangGraph agent that generates exams from podcast transcripts.

## Prerequisites

- Models created via `/podcast-exam-models`
- Plan file: `.context/plans/podcast-exam-plan.md`
- Context: `.context/modules/backend/ai_gateway.context.md`

## Steps

### 1. Read the plan and existing exam agent for reference

// turbo
```bash
cat server/api/agent_exam.py | head -100
```

### 2. Create agent_podcast_exam.py

Create `server/api/agent_podcast_exam.py` with the following structure:

```python
import os
from typing import TypedDict, List, Optional, Dict, Any
import json
try:
    import json_repair
except ImportError:
    json_repair = None
from langgraph.graph import StateGraph, END


class PodcastExamState(TypedDict):
    # Input
    podcast_id: int
    user_id: int
    
    # Context (loaded from DB)
    script: List[Dict]
    audio_url: Optional[str]
    target_level: str
    language: str
    podcast_title: str
    podcast_summary: str
    
    # User preferences
    question_count: int
    question_types: List[str]
    focus: Optional[str]
    difficulty_adjustment: int
    
    # Internal state
    content_analysis: Optional[Dict]
    extracted_vocabulary: Optional[List[Dict]]
    formatted_transcript: Optional[str]
    exam_plan: Optional[Dict]
    draft_questions: Optional[List]
    listening_questions: Optional[List]
    critique: Optional[str]
    critique_passed: bool
    revision_count: int
    is_valid_structure: bool
    
    # Output
    final_exam: Optional[Dict]
    adjusted_level: Optional[str]
    logs: List[str]


# Level constants
LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


def get_adjusted_level(base_level: str, adjustment: int) -> str:
    """Adjust difficulty level by -1, 0, or +1."""
    idx = LEVELS.index(base_level)
    new_idx = max(0, min(5, idx + adjustment))
    return LEVELS[new_idx]


def call_ai(user, prompt: str) -> str:
    """Call AI through unified_ai Gateway."""
    from .unified_ai import generate_ai_content
    response = generate_ai_content(user, prompt, max_tokens=4096, temperature=0.7)
    return response.text
```

### 3. Implement nodes (11 nodes)

#### Node 1: Script Extractor
```python
def script_extractor_node(state: PodcastExamState, config):
    """Load podcast and extract script with timestamps."""
    from .models import Podcast
    
    user = config['configurable'].get('user')
    podcast = Podcast.objects.get(id=state['podcast_id'], user=user)
    
    # Extract script from speech_marks or text_content
    script = podcast.speech_marks or []
    if not script and podcast.text_content:
        # Fallback: parse text_content as simple script
        script = [{"speaker": "Host", "text": podcast.text_content}]
    
    audio_url = podcast.audio_file.url if podcast.audio_file else None
    category = podcast.category
    target_level = category.target_audience if category else 'B1'
    
    return {
        "script": script,
        "audio_url": audio_url,
        "target_level": target_level,
        "language": user.profile.target_language,
        "podcast_title": podcast.title,
        "podcast_summary": podcast.summary or "",
        "logs": ["Script extracted from podcast."]
    }
```

#### Node 2: Content Analyzer
```python
def content_analyzer_node(state: PodcastExamState, config):
    """Analyze script for themes, vocabulary, grammar patterns."""
    user = config['configurable'].get('user')
    script_text = "\n".join([f"{s.get('speaker', 'Host')}: {s.get('text', '')}" for s in state['script']])
    
    prompt = f"""
    Analyze this podcast transcript for a {state['target_level']} level language learner.
    
    Transcript:
    {script_text[:3000]}
    
    Identify:
    1. Main themes and topics
    2. Key grammar patterns used
    3. Important cultural references
    4. Difficulty level assessment
    
    Output JSON: {{"themes": [...], "grammar_patterns": [...], "cultural_refs": [...], "assessed_level": "..."}}
    """
    
    response = call_ai(user, prompt)
    # Parse response...
    
    return {
        "content_analysis": {"raw": response},
        "logs": state.get("logs", []) + ["Content analyzed."]
    }
```

#### Node 3: Vocabulary Extractor
```python
def vocabulary_extractor_node(state: PodcastExamState, config):
    """Extract vocabulary with translations and examples."""
    user = config['configurable'].get('user')
    native_lang = user.profile.native_language
    target_lang = state['language']
    
    script_text = "\n".join([s.get('text', '') for s in state['script']])
    
    prompt = f"""
    Extract 10-15 key vocabulary words from this {target_lang} podcast transcript.
    For each word, provide:
    - word: the word in {target_lang}
    - translation: translation in {native_lang}
    - type: noun, verb, adjective, etc.
    - example: example sentence from the transcript
    
    Transcript:
    {script_text[:2000]}
    
    Output JSON: [{{"word": "...", "translation": "...", "type": "...", "example": "..."}}]
    """
    
    response = call_ai(user, prompt)
    # Parse response...
    
    return {
        "extracted_vocabulary": [],  # Parsed vocabulary
        "logs": state.get("logs", []) + ["Vocabulary extracted."]
    }
```

#### Node 4: Transcript Formatter
```python
def transcript_formatter_node(state: PodcastExamState, config):
    """Format transcript for readable display with speaker labels."""
    formatted_lines = []
    for entry in state['script']:
        speaker = entry.get('speaker', 'Host')
        text = entry.get('text', '')
        formatted_lines.append(f"**{speaker}:** {text}")
    
    formatted_transcript = "\n\n".join(formatted_lines)
    
    return {
        "formatted_transcript": formatted_transcript,
        "logs": state.get("logs", []) + ["Transcript formatted."]
    }
```

#### Node 5: Planner
```python
def planner_node(state: PodcastExamState, config):
    """Plan question distribution based on focus and types."""
    focus = state.get('focus', 'mixed')
    question_count = state.get('question_count', 10)
    question_types = state.get('question_types', ['cloze', 'multiple_choice', 'matching', 'reading', 'listening'])
    
    # Distribution logic based on focus...
    
    return {
        "exam_plan": {...},
        "logs": state.get("logs", []) + ["Exam plan created."]
    }
```

#### Nodes 6-11: Generator, Listening, Calibrator, Validator, Repair, Critic

See full implementation in agent_podcast_exam.py

### 4. Build the graph

```python
def build_podcast_exam_graph():
    workflow = StateGraph(PodcastExamState)
    
    # Add nodes
    workflow.add_node("script_extractor", script_extractor_node)
    workflow.add_node("content_analyzer", content_analyzer_node)
    workflow.add_node("vocabulary_extractor", vocabulary_extractor_node)
    workflow.add_node("transcript_formatter", transcript_formatter_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("generator", generator_node)
    workflow.add_node("listening_generator", listening_generator_node)
    workflow.add_node("level_calibrator", level_calibrator_node)
    workflow.add_node("validator", validator_node)
    workflow.add_node("repair", repair_node)
    workflow.add_node("critic", critic_node)
    
    # Set entry point
    workflow.set_entry_point("script_extractor")
    
    # Add edges
    workflow.add_edge("script_extractor", "content_analyzer")
    workflow.add_edge("content_analyzer", "vocabulary_extractor")
    workflow.add_edge("vocabulary_extractor", "transcript_formatter")
    workflow.add_edge("transcript_formatter", "planner")
    workflow.add_edge("planner", "generator")
    workflow.add_edge("generator", "listening_generator")
    workflow.add_edge("listening_generator", "level_calibrator")
    workflow.add_edge("level_calibrator", "validator")
    
    # Conditional edges for validation
    def check_validity(state):
        if state.get('is_valid_structure', False):
            return "critic"
        if state.get('revision_count', 0) >= 2:
            return "critic"
        return "repair"
    
    workflow.add_conditional_edges("validator", check_validity, {
        "critic": "critic",
        "repair": "repair"
    })
    
    workflow.add_edge("repair", "validator")
    
    # Conditional edges for critic
    def check_critique(state):
        if state['critique_passed'] or state.get('revision_count', 0) >= 2:
            return END
        return "generator"
    
    workflow.add_conditional_edges("critic", check_critique, {
        END: END,
        "generator": "generator"
    })
    
    return workflow.compile()
```

### 5. Test the agent

// turbo
```bash
cd server && python -c "from api.agent_podcast_exam import build_podcast_exam_graph; print('Agent builds successfully')"
```

## Verification

// turbo
```bash
cd server && python manage.py check
```

---

*Workflow version: 1.0*
