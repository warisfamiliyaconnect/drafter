from docx import Document

def create_test_docx(path):
    doc = Document()
    doc.add_heading('Test Document', 0)
    doc.add_heading('Introduction', level=1)
    doc.add_paragraph('This is a test introduction paragraph.')
    doc.add_heading('Detailed Analysis', level=1)
    doc.add_paragraph('This is a test analysis paragraph with more detail.')
    doc.save(path)
    print(f"Created test file at {path}")

if __name__ == "__main__":
    create_test_docx("backend/data/test_import.docx")
