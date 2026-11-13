import { DocumentTemplate } from '@/types/document'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function fetchTemplates(): Promise<DocumentTemplate[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/documents/templates`)
    if (!res.ok) throw new Error('Failed to load templates')
    return await res.json()
  } catch (err) {
    // Return sensible fallback starter templates
    return [
      {
        id: 'blank',
        name: 'Blank Document',
        description: 'Clean standard letter document with standard margins',
        category: 'blank',
        fileUrl: '',
      },
      {
        id: 'nda',
        name: 'Non-Disclosure Agreement',
        description: 'Standard mutual confidentiality agreement',
        category: 'legal',
        fileUrl: '/templates/nda.docx',
      },
      {
        id: 'consulting',
        name: 'Consulting Contract',
        description: 'Professional services master contract',
        category: 'business',
        fileUrl: '/templates/consulting.docx',
      },
    ]
  }
}

export async function uploadDocxFile(file: File): Promise<{ documentId: string; fileUrl: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    throw new Error('Failed to upload document')
  }

  return await res.json()
}
