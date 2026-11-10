import os
from pathlib import Path
from typing import List, Dict, Any
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def export_to_docx(sections: List[Dict[str, Any]], output_path: str, document_title: str = "Drafter Executive Document") -> str:
    """
    Exports structured document sections to a clean, professionally formatted Microsoft Word (.docx) file.
    """
    parent_dir = Path(output_path).parent
    parent_dir.mkdir(parents=True, exist_ok=True)

    doc = Document()

    # Set standard 1-inch margins
    sections_layout = doc.sections
    for s in sections_layout:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)

    # Document Header Title
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_run = title_p.add_run(document_title)
    title_run.font.size = Pt(24)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(0x1E, 0x29, 0x3B) # Slate-800

    doc.add_paragraph() # Spacing

    for section in sections:
        title = section.get("title", "Untitled Section")
        content = section.get("content", "")

        # Section Heading (Level 1)
        h = doc.add_heading(title, level=1)
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)

        # Split multiple paragraphs
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
        if not paragraphs:
            p = doc.add_paragraph(content)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_after = Pt(8)
        else:
            for para_text in paragraphs:
                p = doc.add_paragraph(para_text)
                p.paragraph_format.line_spacing = 1.15
                p.paragraph_format.space_after = Pt(8)

    doc.save(output_path)
    return str(output_path)
