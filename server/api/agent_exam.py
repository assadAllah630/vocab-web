import os
from typing import TypedDict, List, Optional, Dict, Any
import json
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel, Field

# Define the state of the exam generation
class ExamState(TypedDict):
    topic: str
    level: str
    question_types: List[str]
    vocab_list: Optional[str]
    grammar_list: Optional[str]
    notes: Optional[str]
    target_language: str  # Target language for the exam
    
    # Internal state
    topic_analysis: Optional[str]
    exam_plan: Optional[Dict[str, Any]]
    draft_questions: Optional[List[Dict[str, Any]]]
    critique: Optional[str]
    critique_passed: bool
    revision_count: int
    
    # Final output
    final_exam: Optional[Dict[str, Any]]
    logs: List[str]

# Define the LLM
def get_llm(api_key: str):
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )

# --- Nodes ---

def analyzer_node(state: ExamState, config):
    """
    Analyzer Node: Deeply analyzes the topic to identify key concepts and misconceptions.
    """
    api_key = config['configurable'].get('api_key')
    llm = get_llm(api_key)
    
    target_lang = state.get('target_language', 'German')
    
    prompt = f"""
    You are a Senior Curriculum Developer.
    Analyze the topic "{state['topic']}" for a {state['level']} level {target_lang} language student.
    
    Identify:
    1. Key {target_lang} vocabulary themes suitable for this level.
    2. Common {target_lang} grammatical structures relevant to this topic.
    3. Potential cultural nuances or context for {target_lang} speakers.
    4. Common student misconceptions or errors to test for when learning {target_lang}.
    
    Output a concise analysis summary.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    analysis = response.content
    
    return {
        "topic_analysis": analysis,
        "logs": state.get("logs", []) + ["Topic analyzed."]
    }

def planner_node(state: ExamState, config):
    """
    Planning Node: Decides the structure of the exam based on inputs and analysis.
    """
    api_key = config['configurable'].get('api_key')
    llm = get_llm(api_key)
    
    prompt = f"""
    You are an expert language exam designer.
    Create a blueprint for a {state['level']} level exam on the topic: "{state['topic']}".
    
    Context from Analysis:
    {state['topic_analysis']}
    
    Constraints:
    - Question Types to include: {', '.join(state['question_types'])}
    - Vocabulary to include: {state.get('vocab_list', 'None')}
    - Grammar to focus on: {state.get('grammar_list', 'None')}
    - Additional Notes: {state.get('notes', 'None')}
    
    Output a JSON object with a 'sections' list. Each section should have:
    - 'type': (cloze, multiple_choice, matching, reading)
    - 'count': number of questions for this section (default 5)
    - 'focus': specific focus for this section (e.g. "Past Tense verbs", "Travel vocabulary")
    
    Do not generate the actual questions yet. Just the plan.
    """
    
    response = llm.invoke([SystemMessage(content="Return valid JSON only."), HumanMessage(content=prompt)])
    
    try:
        text = response.content.replace('```json', '').replace('```', '').strip()
        plan = json.loads(text)
        return {
            "exam_plan": plan, 
            "logs": state.get("logs", []) + ["Blueprint created."]
        }
    except Exception as e:
        return {"logs": state.get("logs", []) + [f"Planning failed: {str(e)}"]}

def generator_node(state: ExamState, config):
    """
    Generator Node: Creates the actual questions based on the plan.
    """
    api_key = config['configurable'].get('api_key')
    llm = get_llm(api_key)
    
    plan = state['exam_plan']
    
    target_lang = state.get('target_language', 'German')
    lang_name = {'de': 'German', 'en': 'English', 'ar': 'Arabic', 'ru': 'Russian'}.get(target_lang, target_lang)
    
    prompt = f"""
    You are a Senior Cambridge/Goethe Examiner. Generate a COMPLETE {lang_name} language exam with actual questions based on this plan:
    {json.dumps(plan)}
    
    Topic: {state['topic']}
    Level: {state['level']}
    Target Language: {lang_name}
    Vocab: {state.get('vocab_list')}
    Grammar: {state.get('grammar_list')}
    
    CRITICAL: You MUST generate ACTUAL QUESTIONS with REAL CONTENT in {lang_name}, not just descriptions!
    
    Generate a JSON object with this EXACT structure:
    {{
        "title": "Exam Title Here",
        "description": "Brief description of what this exam covers",
        "sections": [
            {{
                "type": "reading",
                "instruction": "Read the text below and answer the multiple-choice questions that follow.",
                "text": "Last summer, Maria and her family went to Italy for vacation. They visited Rome, Florence, and Venice. In Rome, they saw the Colosseum and the Vatican. The weather was beautiful and sunny every day. They ate delicious pasta and pizza at local restaurants. Maria's favorite city was Venice because of the beautiful canals and gondolas.",
                "questions": [
                    {{
                        "question": "Where did Maria's family go on vacation?",
                        "options": ["Spain", "France", "Italy", "Greece"],
                        "correct_index": 2,
                        "explanation": "The text states 'Maria and her family went to Italy for vacation.'"
                    }},
                    {{
                        "question": "What was the weather like?",
                        "options": ["Rainy", "Cloudy", "Sunny", "Snowy"],
                        "correct_index": 2,
                        "explanation": "The text mentions 'The weather was beautiful and sunny every day.'"
                    }}
                ]
            }},
            {{
                "type": "cloze",
                "instruction": "Complete the text with the most appropriate word from the options provided for each blank.",
                "text": "I [blank] to the airport yesterday. The flight [blank] at 3 PM. I [blank] my passport at home.",
                "blanks": [
                    {{
                        "id": 1,
                        "answer": "went",
                        "options": ["go", "went", "going", "goes"]
                    }},
                    {{
                        "id": 2,
                        "answer": "was",
                        "options": ["is", "was", "were", "be"]
                    }},
                    {{
                        "id": 3,
                        "answer": "forgot",
                        "options": ["forget", "forgot", "forgetting", "forgets"]
                    }}
                ]
            }},
            {{
                "type": "multiple_choice",
                "instruction": "Choose the correct option to complete each sentence.",
                "questions": [
                    {{
                        "question": "I _____ to Paris last year.",
                        "options": ["go", "went", "going", "goes"],
                        "correct_index": 1,
                        "explanation": "Past simple tense is used for completed actions in the past."
                    }},
                    {{
                        "question": "She _____ English every day.",
                        "options": ["study", "studies", "studying", "studied"],
                        "correct_index": 1,
                        "explanation": "Present simple third person singular requires 's'."
                    }}
                ]
            }},
            {{
                "type": "matching",
                "instruction": "Match each word on the left with its corresponding definition on the right.",
                "pairs": [
                    {{"left": "Airport", "right": "A place where planes take off and land"}},
                    {{"left": "Passport", "right": "A document for international travel"}},
                    {{"left": "Luggage", "right": "Bags and suitcases for travel"}},
                    {{"left": "Boarding pass", "right": "A ticket to get on a plane"}}
                ]
            }}
        ]
    }}
    
    IMPORTANT RULES:
    1. Generate REAL questions with ACTUAL content in {lang_name} - not placeholders or "..."
    2. For cloze: Use [blank] in the text, provide 3-4 {lang_name} options per blank
    3. For multiple_choice: Provide 4 {lang_name} options per question
    4. For reading: Include a {lang_name} passage of 80-150 words and 3-5 questions
    5. For matching: Include 4-6 pairs in {lang_name}
    6. ALL exam content (questions, answers, text) MUST be in {lang_name}
    7. Questions must be appropriate for {state['level']} level {lang_name} learners
    8. Return ONLY valid JSON - no markdown, no code blocks, no explanations
    
    Generate the exam now:
    """
    
    response = llm.invoke([SystemMessage(content="Return valid JSON only. No markdown."), HumanMessage(content=prompt)])
    
    try:
        text = response.content.replace('```json', '').replace('```', '').strip()
        exam_data = json.loads(text)
        return {
            "draft_questions": exam_data.get('sections', []),
            "final_exam": exam_data,
            "logs": state.get("logs", []) + ["Draft generated."]
        }
    except Exception as e:
        return {"logs": state.get("logs", []) + [f"Generation failed: {str(e)}"]}

def critic_node(state: ExamState, config):
    """
    Critic Node: Reviews the exam for quality and difficulty.
    """
    api_key = config['configurable'].get('api_key')
    llm = get_llm(api_key)
    
    exam = state['final_exam']
    
    prompt = f"""
    You are a Quality Assurance Specialist for Language Exams.
    Critique this exam for a {state['level']} student.
    
    Exam:
    {json.dumps(exam)}
    
    Check for:
    1. Is the difficulty appropriate for {state['level']}?
    2. Are the instructions clear?
    3. Are the distractors in multiple choice/cloze reasonable and not obvious?
    4. Does it cover the requested topic "{state['topic']}"?
    5. Is the JSON structure valid and complete?
    
    If it's good, output "PASSED".
    If it needs changes, output "FAILED: <reason>" and suggest specific fixes.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    critique = response.content
    
    passed = "PASSED" in critique
    
    return {
        "critique": critique,
        "critique_passed": passed,
        "logs": state.get("logs", []) + [f"Critique: {critique[:100]}..."]
    }

def refiner_node(state: ExamState, config):
    """
    Refiner Node: Fixes the exam based on the critique.
    """
    api_key = config['configurable'].get('api_key')
    llm = get_llm(api_key)
    
    prompt = f"""
    You are a Senior Editor. Fix the following exam based on the critique.
    
    Critique: {state['critique']}
    
    Current Exam:
    {json.dumps(state['final_exam'])}
    
    Output the corrected JSON object for the full exam.
    """
    
    response = llm.invoke([SystemMessage(content="Return valid JSON only."), HumanMessage(content=prompt)])
    
    try:
        text = response.content.replace('```json', '').replace('```', '').strip()
        exam_data = json.loads(text)
        return {
            "final_exam": exam_data,
            "revision_count": state.get("revision_count", 0) + 1,
            "logs": state.get("logs", []) + ["Exam refined."]
        }
    except Exception as e:
        return {"logs": state.get("logs", []) + [f"Refinement failed: {str(e)}"]}

# --- Graph Construction ---

def build_exam_graph():
    workflow = StateGraph(ExamState)
    
    workflow.add_node("analyzer", analyzer_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("generator", generator_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("refiner", refiner_node)
    
    workflow.set_entry_point("analyzer")
    
    workflow.add_edge("analyzer", "planner")
    workflow.add_edge("planner", "generator")
    workflow.add_edge("generator", "critic")
    
    def check_critique(state):
        if state['critique_passed'] or state.get('revision_count', 0) >= 2:
            return END
        return "refiner"
    
    workflow.add_conditional_edges(
        "critic",
        check_critique,
        {END: END, "refiner": "refiner"}
    )
    
    workflow.add_edge("refiner", "critic")
    
    return workflow.compile()
