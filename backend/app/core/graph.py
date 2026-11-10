import operator
from typing import Annotated, List, Dict, Optional, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from ..models.state import DocumentGraphState

# --- Node Implementations (Mocked for structural setup) ---

def plan_blueprint(state: DocumentGraphState):
    print("--- NODE: Architect (Planning Blueprint) ---")
    # In a real implementation, this would call an LLM to create a structured list of sections
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
    print(f"--- NODE: Drafter (Drafting {section['title']}) ---")

    # Mock drafting logic
    drafted_content = f"This is a high-fidelity draft for the {section['title']} section."

    # Update the specific section in the blueprint
    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {**section, "content": drafted_content, "status": "reviewing", "version": section["version"] + 1}

    return {
        "blueprint": new_blueprint,
        "full_text": f"\n\n{section['title']}\n{drafted_content}"
    }

def critic_audit(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Critic (Auditing {section['title']}) ---")

    # Mock critique logic: Fail if it's too short (just for demonstration)
    if len(section["content"]) < 50:
        critique = "The content is too brief and lacks substance."
        return {
            "blueprint": [
                {**s, "status": "failed" if i == idx else s["status"], "critique": critique if i == idx else s["critique"]}
                for i, s in enumerate(state["blueprint"])
            ],
            "retry_count": state["retry_count"] + 1
        }

    return {"blueprint": [
        {**s, "status": "approved" if i == idx else s["status"]}
        for i, s in enumerate(state["blueprint"])
    ]}

def refine_paragraph(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]
    print(f"--- NODE: Refiner (Fixing {section['title']}) ---")

    # Mock refinement logic
    refined_content = section["content"] + " [Refined: Added more depth and professional terminology.]"

    new_blueprint = list(state["blueprint"])
    new_blueprint[idx] = {**section, "content": refined_content, "status": "reviewing", "version": section["version"] + 1}

    return {
        "blueprint": new_blueprint
    }

# --- Graph Orchestration ---

def should_continue(state: DocumentGraphState):
    idx = state["current_section_index"]
    section = state["blueprint"][idx]

    if section["status"] == "approved":
        # Move to next section or end
        if idx + 1 < len(state["blueprint"]):
            return "next_section"
        return "end"

    if state["retry_count"] >= 2:
        print("Max retries reached. Forcing approval.")
        return "force_approve"

    return "refine"

def next_section_logic(state: DocumentGraphState):
    return {
        "current_section_index": state["current_section_index"] + 1,
        "retry_count": 0
    }

def create_document_graph():
    workflow = StateGraph(DocumentGraphState)

    # Add Nodes
    workflow.add_node("architect", plan_blueprint)
    workflow.add_node("drafter", draft_paragraph)
    workflow.add_node("critic", critic_audit)
    workflow.add_node("refiner", refine_paragraph)
    workflow.add_node("advance", next_section_logic)

    # Define Edges
    workflow.set_entry_point("architect")
    workflow.add_edge("architect", "drafter")
    workflow.add_edge("drafter", "critic")

    workflow.add_conditional_edges(
        "critic",
        should_continue,
        {
            "refine": "refiner",
            "next_section": "advance",
            "force_approve": "advance",
            "end": END
        }
    )

    workflow.add_edge("refiner", "critic")
    workflow.add_edge("advance", "drafter")

    # Memory setup
    memory = MemorySaver()

    return workflow.compile(checkpointer=memory)

# Singleton instance
document_agent = create_document_graph()
