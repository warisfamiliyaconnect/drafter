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
from .agent.graph import document_agent, document_agent_manual, get_document_agent
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

class ApproveRequest(BaseModel):
    thread_id: str = "default"

@app.get("/")
async def root():
    return {"status": "ok", "message": "Drafter Backend is running with GPU Inference Engine"}

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
        from .services.inference import inference_engine
        prompt = f"Refine this text to be more professional and concise:\n\n{request.selected_text}\n\nInstruction: {request.instruction}"
        result = inference_engine.generate("You are an expert legal document editor.", prompt)
        return {"rewritten_text": result, "reasoning": "Surgically refined tone using real GPU model."}
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
async def approve_section(request: Optional[ApproveRequest] = None, thread_id: Optional[str] = None):
    tid = (request.thread_id if request else None) or thread_id or "default"
    config = {"configurable": {"thread_id": tid}}
    try:
        # Resume the interrupted manual workflow
        document_agent_manual.invoke(None, config=config)
        return {"status": "approved", "message": "Section approved. Resuming next section."}
    except Exception as e:
        print(f"[Approve notice] {e}")
        return {"status": "approved", "message": "Section approved."}

@app.get("/agent/stream")
async def stream_agent(
    prompt: Optional[str] = None,
    thread_id: Optional[str] = None,
    mode: Optional[str] = "automatic"
):
    async def event_generator() -> AsyncGenerator:
        tid = thread_id if (thread_id and thread_id != "default") else str(uuid.uuid4())
        config = {"configurable": {"thread_id": tid}}
        instructions = prompt if prompt else "Write a professional corporate document."
        gen_mode = mode if mode in ("automatic", "manual") else "automatic"
        agent = get_document_agent(gen_mode)

        initial_state = {
            "blueprint": [],
            "current_section_index": 0,
            "glossary": {},
            "memory": [],
            "full_text": "",
            "global_instructions": instructions,
            "retry_count": 0,
            "generation_mode": gen_mode,
            "staged_paragraph": None
        }

        print(f"[Stream Agent] Starting run for thread={tid}, mode={gen_mode}, prompt={instructions[:40]}...")

        async for event in agent.astream(initial_state, config=config, stream_mode="updates"):
            yield {
                "event": "update",
                "data": json.dumps(event)
            }

        yield {
            "event": "end",
            "data": json.dumps({"status": "completed", "thread_id": tid})
        }

    return EventSourceResponse(event_generator())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
