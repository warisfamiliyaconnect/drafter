'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Bot,
  Play,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
  Terminal,
  ShieldCheck,
  ArrowRight,
  GitPullRequest
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/store/use-editor-store'
import { subscribeToAgentStream, approveCurrentSection } from '@/services/agent-service'

const promptSchema = z.object({
  prompt: z.string().min(3, 'Please enter a drafting or editing goal.'),
})

type PromptFormValues = z.infer<typeof promptSchema>

export function ColabBottomConsole() {
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const setIsAiConsoleOpen = useEditorStore((s) => s.setIsAiConsoleOpen)
  const consoleHeight = useEditorStore((s) => s.consoleHeight)
  const setConsoleHeight = useEditorStore((s) => s.setConsoleHeight)
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const setIsDrafting = useEditorStore((s) => s.setIsDrafting)
  const statusMessage = useEditorStore((s) => s.statusMessage)
  const setStatusMessage = useEditorStore((s) => s.setStatusMessage)
  const showApprovalGate = useEditorStore((s) => s.showApprovalGate)
  const setShowApprovalGate = useEditorStore((s) => s.setShowApprovalGate)
  const activeStep = useEditorStore((s) => s.activeStep)
  const setActiveStep = useEditorStore((s) => s.setActiveStep)
  const reasoningLogs = useEditorStore((s) => s.reasoningLogs)
  const addReasoningLog = useEditorStore((s) => s.addReasoningLog)
  const setMode = useEditorStore((s) => s.setMode)

  const logContainerRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      prompt: 'Draft a standard mutual Non-Disclosure Agreement for an AI startup.',
    },
  })

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [reasoningLogs])

  // Listen for Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsAiConsoleOpen(!isAiConsoleOpen)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAiConsoleOpen, setIsAiConsoleOpen])

  const onSubmit = (values: PromptFormValues) => {
    setIsDrafting(true)
    setStatusMessage('Architecting...')
    setActiveStep(1)
    addReasoningLog(`[User Request] ${values.prompt}`)
    addReasoningLog('Planner Node: Constructing section blueprint...')

    const unsubscribe = subscribeToAgentStream(values.prompt, {
      onNodeChange: (node) => {
        setStatusMessage(`Agent working in ${node}...`)
        if (node === 'planner') setActiveStep(1)
        if (node === 'drafter') setActiveStep(2)
        if (node === 'critic') setActiveStep(3)
        addReasoningLog(`[Pipeline Node] Activated ${node}`)
      },
      onTextChunk: (textChunk) => {
        addReasoningLog(`[Draft Stream] ${textChunk.slice(0, 80)}...`)
        if (typeof window !== 'undefined' && (window as any).__superdocInstance) {
          const editor = (window as any).__superdocInstance
          try {
            if (typeof editor.insertContent === 'function') {
              editor.insertContent(textChunk)
            }
          } catch (e) {
            console.warn('SuperDoc insertion error:', e)
          }
        }
      },
      onSectionApproved: (section) => {
        addReasoningLog(`[Critic Audit] Passed section: ${section.title || 'Section'}`)
        setShowApprovalGate(true)
      },
      onComplete: () => {
        setIsDrafting(false)
        setStatusMessage('Draft Completed')
        addReasoningLog('[Complete] Document drafting finished.')
      },
      onError: (err) => {
        console.error('Agent stream error:', err)
        setIsDrafting(false)
        setStatusMessage('Error drafting')
        addReasoningLog(`[Error] Stream disconnected: ${err}`)
      },
    })
  }

  const handleApproveGate = async () => {
    try {
      addReasoningLog('[Approval] Section approved by user. Proceeding...')
      const ok = await approveCurrentSection()
      if (ok) {
        setShowApprovalGate(false)
        setStatusMessage('Section approved. Resuming...')
      }
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  if (!isAiConsoleOpen) return null

  const heightClass = consoleHeight === 'expanded' ? 'h-[440px]' : 'h-[280px]'

  const quickTags = [
    'Mutual NDA',
    'Consulting MSA',
    'Add Indemnity Clause',
    'Formal Tone',
    'Format as Table'
  ]

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 ${heightClass} bg-white border-t border-slate-200 shadow-2xl flex flex-col z-30 transition-all duration-200 select-none animate-in slide-in-from-bottom-6`}
    >
      {/* Top Console Bar */}
      <div className="h-9 bg-slate-50 border-b border-slate-200 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>AI Copilot Console</span>
          </div>

          <div className="h-4 w-px bg-slate-200" />

          {/* Stepper */}
          <div className="flex items-center gap-2 text-[11px]">
            <span
              className={`flex items-center gap-1 ${
                activeStep >= 1 ? 'font-semibold text-indigo-600' : 'text-slate-400'
              }`}
            >
              1. Blueprint Plan
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`flex items-center gap-1 ${
                activeStep >= 2 ? 'font-semibold text-indigo-600' : 'text-slate-400'
              }`}
            >
              2. Live Drafting
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`flex items-center gap-1 ${
                activeStep >= 3 ? 'font-semibold text-indigo-600' : 'text-slate-400'
              }`}
            >
              3. Legal Critic Audit
            </span>
          </div>
        </div>

        {/* Height and Close Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setConsoleHeight(consoleHeight === 'compact' ? 'expanded' : 'compact')
            }
            title={consoleHeight === 'compact' ? 'Expand console' : 'Compact console'}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            {consoleHeight === 'compact' ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsAiConsoleOpen(false)}
            title="Close console (Ctrl+K)"
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search / Prompt Composer Bar (Colab Style) */}
      <div className="p-3 bg-white border-b border-slate-100 flex flex-col gap-2">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              {...register('prompt')}
              disabled={isDrafting}
              placeholder="🔍 Describe document to draft or select text for surgical instruction..."
              className="w-full h-9 pl-3 pr-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs text-slate-800 disabled:bg-slate-50 transition-all shadow-xs"
            />
          </div>

          <Button
            type="submit"
            disabled={isDrafting}
            size="md"
            className="gap-1.5 font-semibold shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isDrafting ? 'Drafting...' : 'Run Copilot'}
          </Button>
        </form>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium">Quick presets:</span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={isDrafting}
              onClick={() => setValue('prompt', tag)}
              className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition-colors disabled:opacity-50"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Console Body: Live Stream Log & Approval Gate */}
      <div className="flex-1 flex overflow-hidden bg-slate-900 text-slate-200">
        {/* Terminal Reasoning Stream */}
        <div
          ref={logContainerRef}
          className="flex-1 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1 bg-slate-950/70 border-r border-slate-800"
        >
          <div className="flex items-center gap-1.5 text-slate-500 pb-1 mb-1 border-b border-slate-800/80">
            <Terminal className="w-3 h-3 text-emerald-400" />
            <span>Agent Reasoning & Token Log</span>
          </div>

          {reasoningLogs.map((log, idx) => (
            <div key={idx} className="text-slate-300">
              <span className="text-emerald-500 mr-2">›</span>
              {log}
            </div>
          ))}

          {isDrafting && (
            <div className="flex items-center gap-2 text-indigo-400 animate-pulse pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500" />
              <span>Streaming agent synthesis...</span>
            </div>
          )}
        </div>

        {/* Right Action / Approval Gate Panel */}
        <div className="w-80 bg-slate-900 p-4 flex flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Critic Audit Status
              </span>
              <Badge variant={showApprovalGate ? 'success' : 'neutral'}>
                {showApprovalGate ? 'Passed Audit' : 'Auditing'}
              </Badge>
            </div>

            {showApprovalGate ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-700/50 rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                <p className="text-xs text-emerald-300 font-medium">
                  The Legal Critic audited this clause. No discrepancies found.
                </p>
                <Button
                  onClick={handleApproveGate}
                  variant="default"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 gap-1.5 w-full mt-1"
                >
                  Approve & Advance
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Autonomous agent pipeline is active. Clauses will pause here for manual audit approval when ready.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>DOCX Track Changes: Active</span>
            <button
              onClick={() => setMode('suggesting')}
              className="text-indigo-400 hover:underline flex items-center gap-1"
            >
              <GitPullRequest className="w-3 h-3" />
              Suggesting Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
