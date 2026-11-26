import { SurgicalEditRequest, SurgicalEditResponse } from '@/types/agent'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface AgentStreamHandlers {
  onNodeChange?: (nodeName: string) => void
  onTextChunk?: (chunk: string) => void
  onSectionApproved?: (section: any) => void
  onPendingApproval?: (paragraph: string) => void
  onComplete?: () => void
  onError?: (err: any) => void
}

export interface AgentStreamOptions {
  mode?: 'automatic' | 'manual'
  threadId?: string
}

export function subscribeToAgentStream(
  prompt: string = '',
  handlers: AgentStreamHandlers,
  options?: AgentStreamOptions
): () => void {
  const mode = options?.mode ?? 'automatic'
  const threadId = options?.threadId ?? ''

  const params = new URLSearchParams()
  if (prompt) params.set('prompt', prompt)
  params.set('mode', mode)
  if (threadId) params.set('thread_id', threadId)

  const url = `${API_BASE_URL}/agent/stream?${params.toString()}`
  const eventSource = new EventSource(url)
  let isClosed = false

  const processUpdateData = (rawData: any) => {
    try {
      const update = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
      const nodeName = Object.keys(update)[0]
      if (!nodeName) return

      const stateUpdate = update[nodeName]
      handlers.onNodeChange?.(nodeName)

      // Manual mode: detect interrupt / staged paragraph
      if (nodeName === '__interrupt__' || (stateUpdate && stateUpdate.staged_paragraph)) {
        const staged =
          stateUpdate?.staged_paragraph ||
          (Array.isArray(stateUpdate) ? stateUpdate[0]?.value : null)
        if (staged && handlers.onPendingApproval) {
          handlers.onPendingApproval(staged)
        }
        return
      }

      // Prefer staged_paragraph for text insertion (clean per-section content)
      if (stateUpdate?.staged_paragraph) {
        if (mode === 'automatic') {
          handlers.onTextChunk?.(stateUpdate.staged_paragraph)
        } else {
          // Manual mode: surface for approval
          handlers.onPendingApproval?.(stateUpdate.staged_paragraph)
        }
        return
      }

      // Fallback: stream text chunk from full_text accumulator
      if (stateUpdate?.full_text) {
        const parts = stateUpdate.full_text.split('\n\n')
        const lastChunk = parts[parts.length - 1]
        if (lastChunk?.trim()) {
          handlers.onTextChunk?.(lastChunk)
        }
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

    if (eventSource.readyState === EventSource.CLOSED) {
      isClosed = true
      eventSource.close()
      handlers.onComplete?.()
      return
    }

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

export async function approveCurrentSection(threadId: string = 'default'): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/agent/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId }),
  })
  return response.ok
}
