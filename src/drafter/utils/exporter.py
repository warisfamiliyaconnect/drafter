"""
Utilities for exporting content to professional document formats.
"""
import os
import re
from typing import Optional
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from drafter.config import settings
from drafter.utils.logging import logger

def _apply_inline_formatting(paragraph, text: str) -> None:
    """
    Parses basic inline Markdown (bold, italic, inline code) and appends runs.

    Args:
        paragraph: The docx paragraph object to modify.
        text (str): The text containing markdown formatting.
    """
    pattern = re.compile(r'(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)')
    parts = pattern.split(text)

    for part in parts:
        if not part:
            continue
        if part.startswith('**') and part.endswith('**') and len(part) >= 4:
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith('*') and part.endswith('*') and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.italic = True
        elif part.startswith('`') and part.endswith('`') and len(part) >= 2:
            run = paragraph.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(160, 60, 60)
        else:
            paragraph.add_run(part)

def convert_markdown_to_docx(
    markdown_text: str,
    output_path: Optional[str] = None,
    title: Optional[str] = None
) -> str:
    """
    Converts a Markdown string to a clean, professionally styled Word .docx document.

    Args:
        markdown_text (str): The markdown source string.
        output_path (str, optional): Target path. Defaults to settings.EXPORTS_DIR.
        title (str, optional): Optional document title.

    Returns:
        str: The absolute path of the generated .docx file.

    Raises:
        OSError: If the directory cannot be created or file cannot be saved.
    """
    if output_path is None:
        output_path = os.path.join(settings.EXPORTS_DIR, "document.docx")

    # Clean thinking tags if present
    cleaned_text = re.sub(r'<think>.*?</think>', '', markdown_text, flags=re.DOTALL).strip()

    # Ensure output directory exists
    dir_name = os.path.dirname(output_path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name, exist_ok=True)

    if not output_path.lower().endswith(".docx"):
        output_path += ".docx"

    logger.info(f"Generating docx at {output_path}...")
    doc = Document()

    # Configure 1-inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Base styling
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(30, 30, 30)

    # Optional Title
    if title:
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(title)
        title_run.font.name = 'Calibri'
        title_run.font.size = Pt(22)
        title_run.bold = True
        title_run.font.color.rgb = RGBColor(20, 50, 90)
        title_para.paragraph_format.space_after = Pt(14)

    lines = cleaned_text.splitlines()
    in_code_block = False
    code_block_lines = []

    for line in lines:
        stripped = line.strip()

        # Handle Code Blocks
        if stripped.startswith("```"):
            if in_code_block:
                code_text = "\n".join(code_block_lines)
                code_para = doc.add_paragraph()
                code_para.paragraph_format.left_indent = Inches(0.4)
                code_para.paragraph_format.space_before = Pt(4)
                code_para.paragraph_format.space_after = Pt(4)
                run = code_para.add_run(code_text)
                run.font.name = 'Consolas'
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(50, 50, 50)
                code_block_lines = []
                in_code_block = False
            else:
                in_code_block = True
                code_block_lines = []
            continue

        if in_code_block:
            code_block_lines.append(line)
            continue

        if not stripped:
            continue

        # Headings
        if stripped.startswith("### "):
            heading_text = stripped[4:].strip()
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(4)
            _apply_inline_formatting(h, heading_text)
        elif stripped.startswith("## "):
            heading_text = stripped[3:].strip()
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(12)
            h.paragraph_format.space_after = Pt(4)
            _apply_inline_formatting(h, heading_text)
        elif stripped.startswith("# "):
            heading_text = stripped[2:].strip()
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(6)
            _apply_inline_formatting(h, heading_text)

        # Bullet Lists
        elif stripped.startswith(("- ", "* ", "+ ")):
            bullet_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            _apply_inline_formatting(p, bullet_text)

        # Numbered Lists
        elif re.match(r'^\d+\.\s+', stripped):
            num_match = re.match(r'^\d+\.\s+', stripped)
            item_text = stripped[num_match.end():].strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            _apply_inline_formatting(p, item_text)

        # Horizontal rule
        elif stripped in ("---", "***", "___"):
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(6)
            run = p.add_run("―" * 40)
            run.font.color.rgb = RGBColor(180, 180, 180)

        # Standard Paragraph
        else:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            _apply_inline_formatting(p, stripped)

    doc.save(output_path)
    return os.path.abspath(output_path)
