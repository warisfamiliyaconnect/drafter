'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Bot, Play, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react'
import { useEditorStore } from '@/store/use-editor-store'
import { subscribeToAgentStream, approveCurrentSection } from '@/services/agent-service'

const promptSchema = z.object({
  prompt: z.string().min(3, 'Please describe what you want the agent to draft.'),
})

type PromptFormValues = z.infer<typeof promptSchema>

export function AiSidebar() {
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const setIsDrafting = useEditorStore((s) => s.setIsDrafting)
  const statusMessage = useEditorStore((s) => s.statusMessage)
  const setStatusMessage = useEditorStore((s) => s.setStatusMessage)
  const showApprovalGate = useEditorStore((s) => s.showApprovalGate)
  const setShowApprovalGate = useEditorStore((s) => s.setShowApprovalGate)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: 'Draft an Executive Non-Disclosure Agreement for an AI startup.',
    },
  })

  const onSubmit = (values: PromptFormValues) => {
    setIsDrafting(true)
    setStatusMessage('Architecting...')

    const unsubscribe = subscribeToAgentStream(values.prompt, {
      onNodeChange: (node) => {
        setStatusMessage(`Agent working in ${node}...`)
      },
      onTextChunk: (textChunk) => {
        // Inject into SuperDoc active session if available
        if (typeof window !== 'undefined' && (window as any).__superdocInstance) {
          const editor = (window as any).__superdocInstance
          try {
            // Programmatically insert into current paragraph or end of document
            if (typeof editor.insertContent === 'function') {
              editor.insertContent(textChunk)
            }
          } catch (e) {
            console.warn('SuperDoc chunk insertion:', e)
          }
        }
      },
      onSectionApproved: (section) => {
        setShowApprovalGate(true)
      },
      onComplete: () => {
        setIsDrafting(false)
        setStatusMessage('Draft Completed')
      },
      onError: (err) => {
        console.error('Agent stream error:', err)
        setIsDrafting(false)
        setStatusMessage('Error drafting')
      },
    })
  }

  const handleApproveGate = async () => {
    try {
      const ok = await approveCurrentSection()
      if (ok) {
        setShowApprovalGate(false)
        setStatusMessage('Section approved. Continuing...')
      }
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  return (
    <aside className="w-80 border-r border-slate-200 bg-white p-4 flex flex-col justify-between h-full">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-800 text-sm">AI Agent Copilot</h2>
        </div>

        {/* Prompt Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Document Goal / Prompt
          </label>
          <textarea
            {...register('prompt')}
            rows={4}
            disabled={isDrafting}
            className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
            placeholder="e.g. Draft a 3-clause Non-Disclosure Agreement..."
          />
          {errors.prompt && (
            <span className="text-[11px] text-rose-500 font-medium">
              {errors.prompt.message}
            </span>
          )}

          <button
            type="submit"
            disabled={isDrafting}
            className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium text-xs transition-all shadow-sm ${
              isDrafting
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isDrafting ? 'Agent Drafting...' : 'Run Autonomous Draft'}
          </button>
        </form>

        {/* Approval Gate Notification */}
        {showApprovalGate && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Section Audit Passed</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              The AI Critic verified compliance. Proceed to next section?
            </p>
            <button
              onClick={handleApproveGate}
              className="mt-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Approve & Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 pt-3 text-center">
        <p className="text-[11px] text-slate-400">
          Real-time OOXML native drafting engine
        </p>
      </div>
    </aside>
  )
}
