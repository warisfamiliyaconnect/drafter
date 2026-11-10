import os
import pytest
from pathlib import Path
from backend.app.agent.graph import document_agent
from backend.app.services.exporter import export_to_docx

def test_document_agent_execution_and_interrupt():
    """Verify that the LangGraph document agent generates blueprint and pauses at human gate."""
    os.environ["MOCK_INFERENCE"] = "true"
    session_id = "test_unit_session"
    config = {"configurable": {"thread_id": session_id}}

    initial_state = {
        "blueprint": [],
        "current_section_index": 0,
        "glossary": {"Company": "Acme Corp"},
        "memory": [],
        "full_text": "",
        "global_instructions": "Draft a corporate test policy",
        "retry_count": 0
    }

    # Run graph until interrupt
    events = []
    for event in document_agent.stream(initial_state, config=config):
        events.append(event)

    state = document_agent.get_state(config)

    # Must pause before 'advance' node
    assert state.next == ("advance",)
    
    # Must have created blueprint
    blueprint = state.values.get("blueprint", [])
    assert len(blueprint) > 0
    assert blueprint[0]["title"] == "Introduction"
    assert blueprint[0]["status"] in ("approved", "reviewing")

def test_document_export_docx(tmp_path):
    """Verify that section blueprint serializes properly into a real docx file."""
    sections = [
        {"title": "Section 1: Intro", "content": "Paragraph 1.\n\nParagraph 2."},
        {"title": "Section 2: Analysis", "content": "Detailed content."}
    ]
    out_file = tmp_path / "test_out.docx"
    saved = export_to_docx(sections, str(out_file), document_title="Test Unit Document")

    assert Path(saved).exists()
    assert Path(saved).stat().st_size > 0
