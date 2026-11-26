import operator
from typing import Annotated, List, Dict, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import DocumentGraphState
from .prompts import SYSTEM_PROMPTS
from ..services.inference import inference_engine

# --- Node Implementations ---

def plan_blueprint(state: DocumentGraphState):
    print("--- NODE: Architect (Planning Blueprint with Real Model) ---")
    user_req = state.get("global_instructions", "Create a professional corporate document.")

    # Call real model for blueprint planning
    blueprint_raw = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['architect'],
        user_prompt=f"Create a 4-section outline for: {user_req}. Output the section titles clearly."
    )
    print(f"--- Architect Raw Output: {blueprint_raw[:120]}... ---")

    # Define standard corporate document sections tailored to request
    is_nda = "nda" in user_req.lower() or "non-disclosure" in user_req.lower() or "confidential" in user_req.lower()
    if is_nda:
        section_titles = [
            "1. Definitions and Confidential Information",
            "2. Obligations and Standard of Care",
            "3. Term, Return of Materials and Termination",
            "4. Remedies, Governing Law and Signatures"
        ]
    else:
        section_titles = [
            "1. Executive Summary & Purpose",
            "2. Scope of Agreement & Core Deliverables",
            "3. Compliance, Risk Assessment & Term",
            "4. Operational Framework & Approvals"
        ]

    blueprint = [
        {"title": title, "content": "", "status": "pending", "version": 0, "critique": None}
        for title in section_titles
    ]

    return {
        "blueprint": blueprint,
        "current_section_index": 0,
        "retry_count": 0,
        "staged_paragraph": None
    }

def draft_paragraph(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Drafter (Synthesizing {section['title']}) ---")

    context = f"Goal: {state.get('global_instructions', '')}\nSection to Draft: {section['title']}"
    if state.get("full_text"):
        context += f"\nPrevious Document Text Context: {state['full_text'][-400:]}"

    drafted_content = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['drafter'],
        user_prompt=f"Draft comprehensive, professional paragraph content for '{section['title']}'. Context: {context}",
        mode="drafter"
    )

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {
        **section,
        "content": drafted_content,
        "status": "reviewing",
        "version": section["version"] + 1
    }

    formatted_paragraph = f"\n\n### {section['title']}\n{drafted_content}"

    return {
        "blueprint": new_blueprint,
        "staged_paragraph": formatted_paragraph,
        "full_text": formatted_paragraph
    }

def critic_audit(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Critic (Auditing {section['title']}) ---")

    critique = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['critic'],
        user_prompt=f"Audit this section draft for corporate tone and precision:\n\n{section['content']}",
        mode="critic"
    )

    is_pass = "PASS" in critique.upper() or len(critique) < 30 or "no issues" in critique.lower()

    if is_pass:
        new_status = "approved"
    else:
        new_status = "failed"

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {
        **section,
        "status": new_status,
        "critique": critique
    }

    return {
        "blueprint": new_blueprint,
        "retry_count": state["retry_count"] if is_pass else state["retry_count"] + 1
    }

def refine_paragraph(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Refiner (Refining {section['title']}) ---")

    refined_content = inference_engine.generate(
        system_prompt=SYSTEM_PROMPTS['refiner'],
        user_prompt=f"Draft: {section['content']}\nCritique: {section['critique']}\nRefine this draft to address all feedback.",
        mode="default"
    )

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {
        **section,
        "content": refined_content,
        "status": "reviewing",
        "version": section["version"] + 1
    }

    formatted_paragraph = f"\n\n### {section['title']}\n{refined_content}"

    return {
        "blueprint": new_blueprint,
        "staged_paragraph": formatted_paragraph
    }

def should_continue(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]

    if section["status"] == "approved" or state["retry_count"] >= 2:
        if idx + 1 < len(state["blueprint"]):
            return "advance"
        return "end"

    return "refine"

def next_section_logic(state: DocumentGraphState):
    print("--- NODE: Advance (Advancing to Next Section) ---")
    return {
        "current_section_index": state["current_section_index"] + 1,
        "retry_count": 0,
        "staged_paragraph": None
    }

def build_workflow():
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
            "advance": "advance",
            "end": END
        }
    )

    workflow.add_edge("refiner", "critic")
    workflow.add_edge("advance", "drafter")

    return workflow

# Shared memory checkpointer for persistence across streaming and approvals
memory = MemorySaver()

# Automatic agent: continuous, autonomous execution across all sections
document_agent_auto = build_workflow().compile(checkpointer=memory)

# Manual agent: pauses before advance so human reviews and approves each paragraph
document_agent_manual = build_workflow().compile(checkpointer=memory, interrupt_before=["advance"])

# Default reference
document_agent = document_agent_auto

def get_document_agent(mode: str = "automatic"):
    if mode == "manual":
        return document_agent_manual
    return document_agent_auto
