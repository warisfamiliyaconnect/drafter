export interface AgentStreamEvent {
  event: 'update' | 'chunk' | 'end' | 'error'
  node?: string
  text?: string
  data?: any
}

export interface SurgicalEditRequest {
  selectedText: string
  contextBefore?: string
  contextAfter?: string
  instruction: string
}

export interface SurgicalEditResponse {
  rewrittenText: string
  reasoning?: string
}
