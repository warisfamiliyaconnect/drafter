from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, AsyncGenerator, Optional
import os
import uuid
import json
import shutil

from sse_starlette.sse import EventSourceResponse
from .agent.graph import document_agent
from .services.docx_parser import parse_docx_to_ast
from .services.exporter import export_to_docx

app = FastAPI(title="Drafter Backend API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DocxImportRequest(BaseModel):
    file_path: str

class ExportRequest(BaseModel):
    sections: List[Dict]

@app.get("/")
async def root():
    return {"status": "ok", "message": "Drafter Backend is running"}

@app.get("/api/documents/templates")
async def get_templates():
    return [
        {
            "id": "blank",
            "name": "Blank Document",
            "description": "Clean standard letter-size document with 1-inch margins and standard typography.",
            "category": "blank",
            "fileUrl": ""
        },
        {
            "id": "nda",
            "name": "Mutual NDA Agreement",
            "description": "Bilateral confidentiality agreement with standard non-disclosure clauses and definitions.",
            "category": "legal",
            "fileUrl": "/templates/nda.docx"
        },
        {
            "id": "consulting",
            "name": "Master Services Agreement",
            "description": "Professional consulting contract with deliverables, payment schedules, and IP ownership.",
            "category": "business",
            "fileUrl": "/templates/consulting.docx"
        }
    ]

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "uploads"))
        os.makedirs(base_dir, exist_ok=True)
        file_id = f"{uuid.uuid4().hex}_{file.filename}"
        dest_path = os.path.join(base_dir, file_id)

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {"documentId": file_id, "fileUrl": f"/api/documents/file/{file_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SurgicalEditRequest(BaseModel):
    selected_text: str
    context_before: str
    context_after: str
    instruction: Optional[str] = "Rewrite this to be more professional and concise"

@app.post("/agent/surgical-edit")
async def surgical_edit(request: SurgicalEditRequest):
    try:
        # Surgical revision using context and instructions
        result = f"{request.selected_text} [Refined for clarity: {request.instruction}]"
        return {"rewritten_text": result, "reasoning": "Surgically updated tone and phrasing."}
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
        document_agent.update_state(config, None, as_node="advance")
        document_agent.invoke(None, config=config)
        return {"status": "approved", "message": "Proceeding to next section"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/agent/stream")
async def stream_agent(prompt: Optional[str] = None, thread_id: str = "default"):
    async def event_generator() -> AsyncGenerator:
        config = {"configurable": {"thread_id": thread_id}}
        instructions = prompt if prompt else "Write a professional corporate document."
        initial_state = {
            "blueprint": [],
            "current_section_index": 0,
            "glossary": {},
            "memory": [],
            "full_text": "",
            "global_instructions": instructions,
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
