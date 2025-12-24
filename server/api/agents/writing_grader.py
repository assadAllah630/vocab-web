import json
from typing import TypedDict, List, Dict, Any
from langgraph.graph import StateGraph, END
from api.unified_ai import generate_ai_content
from api.models import User, WritingSubmission

class GradingState(TypedDict):
    submission_id: int
    student_text: str
    topic: str
    prompt: str
    rubric: str
    draft_analysis: str
    final_output: Dict[str, Any]
    user: Any # User object

def analyze_submission_node(state: GradingState) -> GradingState:
    """Step 1: Deep analysis of the text against rubric."""
    try:
        # Build prompt
        prompt = f"""You are an expert language teacher Grader.
        
Assignment Topic: {state['topic']}
Prompt: {state['prompt']}
Rubric/Criteria: {state['rubric']}

Student Submission:
"{state['student_text']}"

Instructions:
1. Analyze the submission against the rubric.
2. Identify specific GRAMMAR issues.
3. Identify COHERENCE/FLOW issues.
4. Identify VOCABULARY usage quality.
5. Determine a numeric score (0-100) based on the rubric.

Provide a detailed draft analysis. Be strict but constructive.
"""
        response = generate_ai_content(
            user=state.get('user'), 
            prompt=prompt, 
            quality_tier='high'
        )
        return {"draft_analysis": response.text}
    except Exception as e:
        return {"draft_analysis": f"Error during analysis: {str(e)}"}

def format_output_node(state: GradingState) -> GradingState:
    """Step 2: Convert analysis into strict JSON for frontend."""
    try:
        prompt = f"""Convert the following grading analysis into a standard JSON format.

Analysis:
{state['draft_analysis']}

Required JSON Structure:
{{
  "grammar": "Summary of grammar issues...",
  "coherence": "Summary of flow/structure...",
  "vocabulary": "Comments on vocab usage...",
  "score": 85,
  "feedback": "General overall feedback for the student..."
}}

Respond ONLY with valid JSON.
"""
        response = generate_ai_content(
            user=state.get('user'), 
            prompt=prompt, 
            json_mode=True
        )
        
        # Parse JSON
        cleaned_text = response.text.strip()
        if cleaned_text.startswith('```json'):
            cleaned_text = cleaned_text[7:-3]
            
        try:
            data = json.loads(cleaned_text)
        except:
             # Fallback if AI fails to give strict JSON
            data = {
                "grammar": "Could not parse AI response.",
                "coherence": "See draft.",
                "vocabulary": "",
                "score": 0,
                "feedback": state['draft_analysis']
            }
            
        return {"final_output": data}
        
    except Exception as e:
        return {"final_output": {"error": str(e)}}

# Build the Graph
workflow = StateGraph(GradingState)
workflow.add_node("analyze", analyze_submission_node)
workflow.add_node("format", format_output_node)

workflow.set_entry_point("analyze")
workflow.add_edge("analyze", "format")
workflow.add_edge("format", END)

writing_grader = workflow.compile()

def run_writing_grader(submission_id: int):
    """Entry point to run the grader agent."""
    try:
        submission = WritingSubmission.objects.get(id=submission_id)
        exercise = submission.exercise
        
        initial_state = {
            "submission_id": submission_id,
            "student_text": submission.content,
            "topic": exercise.topic,
            "prompt": exercise.prompt_text,
            "rubric": json.dumps(exercise.rubric),
            "draft_analysis": "",
            "final_output": {},
            "user": submission.student # Pass student for quota tracking
        }
        
        result = writing_grader.invoke(initial_state)
        return result['final_output']
        
    except WritingSubmission.DoesNotExist:
        return {"error": "Submission not found"}
    except Exception as e:
        return {"error": f"Agent failed: {str(e)}"}
