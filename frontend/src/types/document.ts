export interface DocumentSection {
  id: string
  title: string
  content: string
  status?: 'pending' | 'approved' | 'rejected'
}

export interface DocumentMetadata {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  fileUrl?: string
}

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: 'legal' | 'business' | 'blank'
  fileUrl: string
}
