import mammoth
from typing import List, Dict

def parse_docx_to_ast(file_path: str) -> List[Dict]:
    with open(file_path, "rb") as docx_file:
        result = mammoth.convert_to_html(docx_file)
        html = result.value

        sections = []
        import re
        parts = re.split(r'(<h[12]>.*?</h[12]>)', html)

        current_title = "Document Start"
        current_content = ""

        for part in parts:
            if re.match(r'<h[12]>.*?</h[12]>', part):
                if current_content:
                    sections.append({"title": current_title, "content": current_content})
                current_title = re.sub(r'<[^>]*>', '', part)
                current_content = ""
            else:
                current_content += part

        if current_content:
            sections.append({"title": current_title, "content": current_content})

        return sections
