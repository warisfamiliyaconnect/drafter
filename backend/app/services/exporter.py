from docx import Document
from typing import List, Dict

def export_to_docx(sections: List[Dict], output_path: str):
    doc = Document()
    for section in sections:
        doc.add_heading(section["title"], level=1)
        doc.add_paragraph(section["content"])
    doc.save(output_path)
    return output_path
