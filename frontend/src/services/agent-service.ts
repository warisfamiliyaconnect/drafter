import { SurgicalEditRequest, SurgicalEditResponse } from '@/types/agent'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AgentStreamHandlers {
  onNodeChange?: (nodeName: string) => void
  onTextChunk?: (chunk: string) => void
  onSectionApproved?: (section: any) => void
  onComplete?: () => void
  onError?: (err: any) => void
}

export function subscribeToAgentStream(prompt: string = '', handlers: AgentStreamHandlers): () => void {
  const queryParam = prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''
  const eventSource = new EventSource(`${API_BASE_URL}/agent/stream${queryParam}`)

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)

      if (data.event === 'update') {
        const update = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
        const nodeName = Object.keys(update)[0]
        const stateUpdate = update[nodeName]

        handlers.onNodeChange?.(nodeName)

        if (stateUpdate?.full_text) {
          const parts = stateUpdate.full_text.split('\n\n')
          handlers.onTextChunk?.(parts[parts.length - 1])
        }

        if (nodeName === 'critic' && stateUpdate?.blueprint) {
          const currentIdx = stateUpdate.current_section_index || 0
          const section = stateUpdate.blueprint[currentIdx]
          if (section?.status === 'approved') {
            handlers.onSectionApproved?.(section)
          }
        }
      } else if (data.event === 'end') {
        handlers.onComplete?.()
        eventSource.close()
      }
    } catch (err) {
      handlers.onError?.(err)
    }
  }

  eventSource.onerror = (err) => {
    handlers.onError?.(err)
    eventSource.close()
  }

  return () => {
    eventSource.close()
  }
}

export async function submitSurgicalEdit(req: SurgicalEditRequest): Promise<SurgicalEditResponse> {
  const response = await fetch(`${API_BASE_URL}/agent/surgical-edit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selected_text: req.selectedText,
      context_before: req.contextBefore || '',
      context_after: req.contextAfter || '',
      instruction: req.instruction
    }),
  })

  if (!response.ok) {
    throw new Error(`Surgical edit failed: ${response.statusText}`)
  }

  const data = await response.json()
  return {
    rewrittenText: data.rewritten_text,
    reasoning: data.reasoning,
  }
}

export async function approveCurrentSection(): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/agent/approve`, {
    method: 'POST',
  })
  return response.ok
}
