'use client'

import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import { PendingText } from './extensions/pending-text'
import { Play, FileText, Download, Sparkles, CheckCircle, Wand2 } from 'lucide-react'

export default function DrafterEditor() {
  const [isDrafting, setIsDrafting] = useState(false)
  const [status, setStatus] = useState('Idle')
  const [showApprovalGate, setShowApprovalGate] = useState(false)
  const [selection, setSelection] = useState<{from: number, to: number, text: string} | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      PendingText,
    ],
    content: '<h1>New Document</h1><p>Start drafting your production-grade document here...</p>',
    editorProps: {
      attributes: {
        class: 'prose-canvas focus:outline-none',
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      if (from !== to) {
        setSelection({ from, to, text });
      } else {
        setSelection(null);
      }
    },
  })

  const handleAutoDraft = async () => {
    if (!editor) return
    setIsDrafting(true)
    setStatus('Architecting...')

    try {
      const eventSource = new EventSource('http://localhost:8000/agent/stream')

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.event === 'update') {
          const update = JSON.parse(data.data)
          const nodeName = Object.keys(update)[0]
          const stateUpdate = update[nodeName]

          setStatus(`Agent is in ${nodeName}...`)

          if (stateUpdate.full_text) {
            const parts = stateUpdate.full_text.split('\n\n')
            const latestContent = parts[parts.length - 1]
            editor.commands.insertContent(`<span data-status="pending" class="ai-pending">${latestContent}</span>`)
          }

          if (nodeName === 'critic' && stateUpdate.blueprint) {
            const currentIdx = stateUpdate.current_section_index || 0
            const section = stateUpdate.blueprint[currentIdx]

            if (section && section.status === 'approved') {
              const pendingElements = document.querySelectorAll('.ai-pending')
              pendingElements.forEach(el => {
                el.classList.remove('ai-pending')
                el.classList.add('ai-final')
                el.removeAttribute('data-status')
              })
              setShowApprovalGate(true)
            }
          }
        } else if (data.event === 'end') {
          setStatus('Completed')
          setIsDrafting(false)
          eventSource.close()
        }
      }

      eventSource.onerror = (err) => {
        console.error('SSE Error:', err)
        setStatus('Connection Error')
        setIsDrafting(false)
        eventSource.close()
      }
    } catch (error) {
      console.error('Drafting error:', error)
      setStatus('Error')
      setIsDrafting(false)
    }
  }

  const handleApprove = async () => {
    try {
      const resp = await fetch('http://localhost:8000/agent/approve', { method: 'POST' })
      if (resp.ok) {
        setShowApprovalGate(false)
        setIsDrafting(true)
        handleAutoDraft()
      }
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  const handleSurgicalEdit = async () => {
    if (!editor || !selection) return

    setStatus('Surgically refining...')
    try {
      const contextBefore = editor.state.doc.textBetween(Math.max(0, selection.from - 500), selection.from)
      const contextAfter = editor.state.doc.textBetween(selection.to, Math.min(editor.state.doc.content.size, selection.to + 500))

      const resp = await fetch('http://localhost:8000/agent/surgical-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_text: selection.text,
          context_before: contextBefore,
          context_after: contextAfter,
          instruction: "Make it more professional"
        })
      })

      const data = await resp.json()
      if (data.rewritten_text) {
        editor.chain().focus().insertContentAt({ from: selection.from, to: selection.to }, `<span data-status="pending" class="ai-pending">${data.rewritten_text}</span>`).run()

        // Simulate the Critic approving the edit after a short delay
        setTimeout(() => {
          const pendingElements = document.querySelectorAll('.ai-pending')
          pendingElements.forEach(el => {
            el.classList.remove('ai-pending')
            el.classList.add('ai-final')
            el.removeAttribute('data-status')
          })
          setStatus('Idle')
        }, 1500)
      }
    } catch (e) {
      console.error('Surgical edit failed:', e)
      setStatus('Error')
    }
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Approval Gate Overlay */}
      {showApprovalGate && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full mx-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Section Approved!</h3>
            <p className="text-gray-500 mb-6">The AI has finished this section and passed the audit. Do you want to proceed to the next one?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalGate(false)}
                className="flex-1 py-2 px-4 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Review Manually
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Approve & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-6">
        <div className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Sparkles className="w-6 h-6" />
          <span>Drafter AI</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">Agent Control</label>
          <button
            onClick={handleAutoDraft}
            disabled={isDrafting}
            className={`flex items-center justify-center gap-2 p-2 rounded-lg font-medium transition-all ${
              isDrafting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            <Play className="w-4 h-4" />
            {isDrafting ? 'Drafting...' : 'Auto-Draft'}
          </button>
          <div className="text-xs text-center text-gray-400 mt-1">
            Status: <span className="text-gray-600">{status}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto">
          <button className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <FileText className="w-4 h-4" />
            Import .docx
          </button>
          <button className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export .docx
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <EditorContent editor={editor} />

        {/* Floating Surgical Edit Button */}
        {selection && (
          <div
            className="absolute z-10 flex items-center gap-2 bg-white border border-indigo-200 shadow-xl rounded-full px-3 py-1.5 text-xs font-medium text-indigo-600 animate-in fade-in slide-in-from-bottom-2 duration-200 hover:bg-indigo-50 cursor-pointer transition-colors"
            style={{
              left: '50%',
              top: '20px', // In a real app, we would calculate the exact cursor position
              transform: 'translateX(-50%)'
            }}
            onClick={handleSurgicalEdit}
          >
            <Wand2 className="w-3 h-3" />
            AI Rewrite
          </div>
        )}
      </div>
    </div>
  )
}
