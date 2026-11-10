from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, AsyncGenerator, Optional
import os
import uuid
import json

from sse_starlette.sse import EventSourceResponse
from .agent.graph import document_agent
from .services.docx_parser import parse_docx_to_ast
from .services.exporter import export_to_docx

app = FastAPI(title="Drafter Backend API")

class DocxImportRequest(BaseModel):
    file_path: str

class ExportRequest(BaseModel):
    sections: List[Dict]

@app.get("/")
async def root():
    return {"status": "ok", "message": "Drafter Backend is running"}

class SurgicalEditRequest(BaseModel):
    selected_text: str
    context_before: str
    context_after: str
    instruction: Optional[str] = "Rewrite this to be more professional and concise"

@app.post("/agent/surgical-edit")
async def surgical_edit(request: SurgicalEditRequest):
    try:
        # In a real production app, this would be a specific LangGraph node
        # For the MVP, we call the LLM directly with the surgical prompt
        from .agent.prompts import SYSTEM_PROMPTS

        prompt = f"""
        CONTEXT BEFORE: {request.context_before}
        ---
        TARGET TEXT: {request.selected_text}
        ---
        CONTEXT AFTER: {request.context_after}

        INSTRUCTION: {request.instruction}
        """

        # Mocking the LLM call for now
        # In production: result = llm.invoke([SystemMessage(SYSTEM_PROMPTS['surgical_refiner']), HumanMessage(prompt)])
        result = f"REWRITTEN: {request.selected_text} (Surgically refined for professional clarity and impact)."

        return {"rewritten_text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import")
async def import_docx(request: DocxImportRequest):
    try:
        ast = parse_docx_to_ast(request.file_path)
        return {"ast": ast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export")
async def export_docx(request: ExportRequest):
    try:
        filename = f"exported_{uuid.uuid4().hex}.docx"
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
        os.makedirs(base_dir, exist_ok=True)
        output_path = os.path.join(base_dir, filename)
        export_to_docx(request.sections, output_path)
        return {"file_path": output_path, "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent/approve")
async def approve_section(thread_id: str = "default"):
    config = {"configurable": {"thread_id": thread_id}}
    try:
        # Tell LangGraph to resume from the interrupt
        document_agent.update_state(config, None, as_node="advance")
        # Run it again to move to the next section
        document_agent.invoke(None, config=config)
        return {"status": "approved", "message": "Proceeding to next section"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/stream")
async def stream_agent(thread_id: str = "default"):
    async def event_generator() -> AsyncGenerator:
        config = {"configurable": {"thread_id": thread_id}}
        initial_state = {
            "blueprint": [],
            "current_section_index": 0,
            "glossary": {},
            "memory": [],
            "full_text": "",
            "global_instructions": "Write a professional corporate document.",
            "retry_count": 0
        }

        async for event in document_agent.astream(initial_state, config=config, stream_mode="updates"):
            yield {
                "event": "update",
                "data": json.dumps(event)
            }

        yield {
            "event": "end",
            "data": json.dumps({"status": "completed"})
        }

    return EventSourceResponse(event_generator())

@app.post("/agent/run")
async def run_agent(thread_id: str = "default"):
    config = {"configurable": {"thread_id": thread_id}}
    initial_state = {
        "blueprint": [],
        "current_section_index": 0,
        "glossary": {},
        "memory": [],
        "full_text": "",
        "global_instructions": "Write a professional corporate document.",
        "retry_count": 0
    }
    final_state = document_agent.invoke(initial_state, config=config)
    return {
        "blueprint": final_state["blueprint"],
        "full_text": final_state["full_text"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
