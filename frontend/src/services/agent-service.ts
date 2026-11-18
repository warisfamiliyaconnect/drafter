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
  let isClosed = false

  const processUpdateData = (rawData: any) => {
    try {
      const update = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
      const nodeName = Object.keys(update)[0]
      if (!nodeName || nodeName === '__interrupt__') return

      const stateUpdate = update[nodeName]
      handlers.onNodeChange?.(nodeName)

      if (stateUpdate?.full_text) {
        const parts = stateUpdate.full_text.split('\n\n')
        handlers.onTextChunk?.(parts[parts.length - 1])
      }

      if (nodeName === 'critic' && stateUpdate?.blueprint) {
        const currentIdx = stateUpdate.current_section_index || 0
        const section = stateUpdate.blueprint[currentIdx]
        if (section?.status === 'approved' || section?.status === 'reviewing') {
          handlers.onSectionApproved?.(section)
        }
      }
    } catch (err) {
      console.warn('Error parsing agent update payload:', err)
    }
  }

  // Handle named 'update' events sent by backend
  eventSource.addEventListener('update', (event: MessageEvent) => {
    processUpdateData(event.data)
  })

  // Handle named 'end' event sent by backend
  eventSource.addEventListener('end', () => {
    if (!isClosed) {
      isClosed = true
      handlers.onComplete?.()
      eventSource.close()
    }
  })

  // Fallback for default unnamed SSE messages
  eventSource.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data)
      if (parsed.status === 'completed' || parsed.event === 'end') {
        if (!isClosed) {
          isClosed = true
          handlers.onComplete?.()
          eventSource.close()
        }
      } else {
        processUpdateData(parsed)
      }
    } catch (err) {
      console.warn('Unhandled message format:', err)
    }
  }

  eventSource.onerror = (err) => {
    if (isClosed) return

    // If the server closed the connection after sending all events,
    // readyState will become CLOSED or CONNECTING without active failure.
    if (eventSource.readyState === EventSource.CLOSED) {
      isClosed = true
      eventSource.close()
      handlers.onComplete?.()
      return
    }

    // Actual error occurred before stream completed
    isClosed = true
    eventSource.close()
    const errorDetails = new Error('Failed to connect to agent stream at ' + API_BASE_URL)
    handlers.onError?.(errorDetails)
  }

  return () => {
    isClosed = true
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
      instruction: req.instruction,
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
