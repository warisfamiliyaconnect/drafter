import operator
from typing import Annotated, List, Dict, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import DocumentGraphState
from .prompts import SYSTEM_PROMPTS
from ..services.inference import inference_engine

# --- Node Implementations ---

def plan_blueprint(state: DocumentGraphState):
    print(f"--- NODE: Architect (Calling Real Model) ---")
    user_req = state.get("global_instructions", "Create a professional corporate document.")

    # Call real GGUF model
    blueprint_raw = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['architect'],
        user_prompt=user_req
    )

    # For the MVP, we still maintain the structured blueprint
    # but in production we would parse the AI's JSON response.
    blueprint = [
        {"title": "Introduction", "content": "", "status": "pending", "version": 0, "critique": None},
        {"title": "Executive Summary", "content": "", "status": "pending", "version": 0, "critique": None},
        {"title": "Detailed Analysis", "content": "", "status": "pending", "version": 0, "critique": None},
        {"title": "Conclusion", "content": "", "status": "pending", "version": 0, "critique": None},
    ]
    return {
        "blueprint": blueprint,
        "current_section_index": 0,
        "retry_count": 0
    }

def draft_paragraph(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Drafter (Calling Real Model for {section['title']}) ---")

    user_prompt = f"Please draft the section: {section['title']}. \nContext: {state.get('global_instructions', '')}"

    drafted_content = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['drafter'],
        user_prompt=user_prompt,
        mode="drafter"
    )

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {**section, "content": drafted_content, "status": "reviewing", "version": section["version"] + 1}

    return {
        "blueprint": new_blueprint,
        "full_text": f"\n\n{section['title']}\n{drafted_content}"
    }

def critic_audit(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Critic (Calling Real Model for {section['title']}) ---")

    user_prompt = f"Audit this draft:\n\n{section['content']}"

    critique = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['critic'],
        user_prompt=user_prompt,
        mode="critic"
    )

    if "PASS" in critique.upper() or len(critique) < 20:
        return {"blueprint": [
            {**s, "status": "approved" if i == idx else s["status"]}
            for i, s in enumerate(state["blueprint"])
        ]}

    return {
        "blueprint": [
            {**s, "status": "failed" if i == idx else s["status"], "critique": critique if i == idx else s["critique"]}
            for i, s in enumerate(state["blueprint"])
        ],
        "retry_count": state["retry_count"] + 1
    }

def refine_paragraph(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Refiner (Calling Real Model for {section['title']}) ---")

    user_prompt = f"Draft: {section['content']}\n\nCritique: {section['critique']}\n\nSurgically refine this draft."

    refined_content = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['refiner'],
        user_prompt=user_prompt,
        mode="default"
    )

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {**section, "content": refined_content, "status": "reviewing", "version": section["version"] + 1}

    return {
        "blueprint": new_blueprint
    }

def should_continue(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]

    if section["status"] == "approved":
        if idx + 1 < len(state["blueprint"]):
            return "human_review"
        return "end"

    if state["retry_count"] >= 2:
        return "force_approve"

    return "refine"

def next_section_logic(state: DocumentGraphState):
    return {
        "current_section_index": state["current_section_index"] + 1,
        "retry_count": 0
    }

def create_document_graph():
    workflow = StateGraph(DocumentGraphState)

    workflow.add_node("architect", plan_blueprint)
    workflow.add_node("drafter", draft_paragraph)
    workflow.add_node("critic", critic_audit)
    workflow.add_node("refiner", refine_paragraph)
    workflow.add_node("advance", next_section_logic)

    workflow.set_entry_point("architect")
    workflow.add_edge("architect", "drafter")
    workflow.add_edge("drafter", "critic")

    workflow.add_conditional_edges(
        "critic",
        should_continue,
        {
            "refine": "refiner",
            "human_review": "advance",
            "force_approve": "advance",
            "end": END
        }
    )

    workflow.add_edge("refiner", "critic")
    workflow.add_edge("advance", "drafter")

    memory = MemorySaver()
    return workflow.compile(checkpointer=memory, interrupt_before=["advance"])

document_agent = create_document_graph()
