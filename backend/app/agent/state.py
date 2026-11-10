from typing import TypedDict, List, Dict, Annotated, Optional
import operator

class SectionStatus(TypedDict):
    title: str
    content: str
    status: str  # "pending", "drafting", "reviewing", "approved"
    version: int
    critique: Optional[str]

class DocumentGraphState(TypedDict):
    # The master blueprint of the document
    blueprint: List[SectionStatus]

    # Current section index being processed
    current_section_index: int

    # Global glossary to maintain terminology consistency
    glossary: Dict[str, str]

    # Distilled memory from previous sections for context
    memory: List[str]

    # The full accumulated document content
    full_text: Annotated[str, operator.add]

    # Any global settings or user instructions
    global_instructions: str

    # Track current loop iteration for self-correction
    retry_count: int
