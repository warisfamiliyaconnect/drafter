'use client'

import React, { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Sparkles,
  Play,
  ChevronUp,
  ChevronDown,
  X,
  Terminal,
  ShieldCheck,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Zap,
  Shield,
  CheckCircle,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEditorStore } from '@/store/use-editor-store'
import { subscribeToAgentStream, approveCurrentSection } from '@/services/agent-service'
import { insertContentIntoDocument } from '@/lib/superdoc-bridge'

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

  // Dual-mode drafting state
  const generationMode = useEditorStore((s) => s.generationMode)
  const setGenerationMode = useEditorStore((s) => s.setGenerationMode)
  const stagedParagraph = useEditorStore((s) => s.stagedParagraph)
  const setStagedParagraph = useEditorStore((s) => s.setStagedParagraph)
  const clearStagedParagraph = useEditorStore((s) => s.clearStagedParagraph)
  const currentThreadId = useEditorStore((s) => s.currentThreadId)
  const setCurrentThreadId = useEditorStore((s) => s.setCurrentThreadId)

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
    clearStagedParagraph()
    addReasoningLog(`[User Request] ${values.prompt}`)
    addReasoningLog(`[Mode] ${generationMode === 'automatic' ? '⚡ Automatic' : '🛡️ Manual Review'} mode active`)
    addReasoningLog('Planner Node: Constructing section blueprint...')

    const tid = crypto.randomUUID()
    setCurrentThreadId(tid)

    const unsubscribe = subscribeToAgentStream(
      values.prompt,
      {
        onNodeChange: (node) => {
          setStatusMessage(`Agent working in ${node}...`)
          if (node === 'architect' || node === 'planner') setActiveStep(1)
          if (node === 'draft_paragraph' || node === 'drafter') setActiveStep(2)
          if (node === 'critic_audit' || node === 'critic') setActiveStep(3)
          addReasoningLog(`[Pipeline Node] Activated → ${node}`)
        },
        onTextChunk: (textChunk) => {
          if (!textChunk?.trim()) return
          addReasoningLog(`[Draft Stream] ${textChunk.slice(0, 80)}...`)
          if (generationMode === 'automatic') {
            const inserted = insertContentIntoDocument(textChunk)
            if (inserted) {
              addReasoningLog('[Editor] ✓ Section content written to canvas.')
            } else {
              addReasoningLog('[Editor] ✗ Failed to write to canvas — retrying fallback.')
            }
          }
        },
        onPendingApproval: (paragraph) => {
          if (!paragraph?.trim()) return
          addReasoningLog('[Manual Gate] 🛡️ Section draft ready for review.')
          setStatusMessage('Awaiting your approval...')
          setStagedParagraph({ title: '', content: paragraph, threadId: tid })
        },
        onSectionApproved: (section) => {
          addReasoningLog(`[Critic Audit] ✓ Passed: ${section.title || 'Section'}`)
          if (generationMode === 'automatic') {
            setShowApprovalGate(true)
          }
        },
        onComplete: () => {
          setIsDrafting(false)
          setStatusMessage('Draft Completed ✓')
          addReasoningLog('[Complete] Document drafting finished.')
        },
        onError: (err: any) => {
          const errorMsg = err?.message || 'Connection lost to agent backend'
          console.error('Agent stream error:', errorMsg)
          setIsDrafting(false)
          setStatusMessage('Error drafting')
          addReasoningLog(`[Error] ${errorMsg}`)
        },
      },
      { mode: generationMode, threadId: tid }
    )
  }

  const handleApproveGate = async () => {
    try {
      addReasoningLog('[Approval] Section approved by user. Proceeding...')
      const ok = await approveCurrentSection(currentThreadId ?? 'default')
      if (ok) {
        setShowApprovalGate(false)
        setStatusMessage('Section approved. Resuming...')
      }
    } catch (e) {
      console.error('Approval failed:', e)
    }
  }

  const handleApproveStagedParagraph = async () => {
    if (!stagedParagraph) return
    insertContentIntoDocument(stagedParagraph.content)
    addReasoningLog('[Manual] ✓ Approved and pasted to canvas.')
    clearStagedParagraph()
    setStatusMessage('Section approved. Drafting next...')
    try {
      await approveCurrentSection(currentThreadId ?? 'default')
    } catch (e) {
      console.error('Resume failed:', e)
    }
  }

  if (!isAiConsoleOpen) return null

  const heightClass = consoleHeight === 'expanded' ? 'h-[420px]' : 'h-[260px]'

  const quickTags = [
    'Mutual NDA',
    'Consulting MSA',
    'Add Indemnity Clause',
    'Formal Tone',
    'Format as Table',
  ]

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 ${heightClass} glass-surface border-t border-[#e0e2ec] shadow-[0_-8px_32px_rgba(0,0,0,0.08)] flex flex-col z-30 transition-all duration-200 select-none animate-in slide-in-from-bottom-6 rounded-t-2xl overflow-hidden`}
    >
      {/* Frosted Top Bar */}
      <div className="h-10 bg-white/60 px-5 flex items-center justify-between border-b border-[#e0e2ec]/60 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1d1b20]">
            <Sparkles className="w-4 h-4 text-[#a855f7]" />
            <span>AI Copilot</span>
          </div>

          <div className="h-3.5 w-px bg-[#e0e2ec]" />

          {/* Pipeline Stepper */}
          <div className="flex items-center gap-1 text-[11px]">
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                activeStep >= 1 ? 'bg-[#f3e8ff] text-[#7c3aed] font-medium' : 'text-[#79747e]'
              }`}
            >
              1. Blueprint
            </span>
            <span className="text-[#cac4d0]">→</span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                activeStep >= 2 ? 'bg-[#f3e8ff] text-[#7c3aed] font-medium' : 'text-[#79747e]'
              }`}
            >
              2. Drafting
            </span>
            <span className="text-[#cac4d0]">→</span>
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                activeStep >= 3 ? 'bg-[#f3e8ff] text-[#7c3aed] font-medium' : 'text-[#79747e]'
              }`}
            >
              3. Critic Audit
            </span>
          </div>

          <div className="h-3.5 w-px bg-[#e0e2ec]" />

          {/* Mode Toggle — Auto / Manual */}
          <div className="flex items-center bg-[#f0f4f9] rounded-full p-0.5 gap-0.5">
            <button
              onClick={() => setGenerationMode('automatic')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                generationMode === 'automatic'
                  ? 'bg-white shadow-sm text-[#1d1b20]'
                  : 'text-[#79747e]'
              }`}
            >
              <Zap className="w-3 h-3 text-[#fbbc04]" />
              Auto
            </button>
            <button
              onClick={() => setGenerationMode('manual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                generationMode === 'manual'
                  ? 'bg-white shadow-sm text-[#1d1b20]'
                  : 'text-[#79747e]'
              }`}
            >
              <Shield className="w-3 h-3 text-[#1e8e3e]" />
              Manual
            </button>
          </div>
        </div>

        {/* Height and Close Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setConsoleHeight(consoleHeight === 'compact' ? 'expanded' : 'compact')}
            title={consoleHeight === 'compact' ? 'Expand console' : 'Compact console'}
            className="p-1 rounded-md text-[#49454f] hover:text-[#1d1b20] hover:bg-[#f0f4f9] transition-colors"
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
            className="p-1 rounded-md text-[#49454f] hover:text-[#1d1b20] hover:bg-[#f0f4f9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prompt Composer */}
      <div className="px-4 py-2 bg-white/70 border-b border-[#e0e2ec]/60 flex flex-col gap-1.5 shrink-0">
        <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              {...register('prompt')}
              disabled={isDrafting}
              placeholder="Describe the document to draft or give editing instructions..."
              className="w-full h-9 pl-3 pr-4 rounded-xl border border-[#e0e2ec] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/25 focus:border-[#a855f7] text-xs text-[#1d1b20] disabled:bg-[#f0f4f9] transition-all bg-white"
            />
          </div>

          <Button
            type="submit"
            disabled={isDrafting}
            variant="ai"
            size="md"
            className="gap-1.5 shrink-0 rounded-xl"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isDrafting ? 'Drafting...' : 'Run Copilot'}
          </Button>
        </form>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[#79747e] text-[11px] shrink-0">Presets:</span>
          {quickTags.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={isDrafting}
              onClick={() => setValue('prompt', tag)}
              className="px-2.5 py-0.5 rounded-full bg-[#f0f4f9] hover:bg-[#e9eef6] hover:text-[#0b57d0] text-[#49454f] border border-[#e0e2ec]/70 transition-colors disabled:opacity-50 text-[11px] shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Reasoning Logs & Right Panel */}
      <div className="flex-1 flex overflow-hidden bg-[#fafbfc] min-h-0">
        {/* Terminal Reasoning Stream */}
        <div
          ref={logContainerRef}
          className="flex-1 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1 bg-[#f8f9fa] border-r border-[#e0e2ec]/60 text-[#3c4043]"
        >
          <div className="flex items-center gap-1.5 text-[#79747e] pb-1 mb-1 border-b border-[#e0e2ec]/60">
            <Terminal className="w-3.5 h-3.5 text-[#a855f7]" />
            <span>Agent Reasoning & Token Log</span>
          </div>

          {reasoningLogs.map((log, idx) => (
            <div key={idx} className="text-[#3c4043]">
              <span className="text-[#0b57d0] mr-2">›</span>
              {log}
            </div>
          ))}

          {isDrafting && (
            <div className="flex items-center gap-2 text-[#7c3aed] font-medium pt-1">
              <span className="inline-block w-2 h-2 rounded-full bg-[#a855f7] animate-ping" />
              <span>Streaming agent synthesis...</span>
            </div>
          )}
        </div>

        {/* Right Panel — Audit / Staged Paragraph */}
        <div className="w-80 bg-white p-4 flex flex-col justify-between gap-3 overflow-y-auto">
          <div className="flex flex-col gap-3">

            {/* Manual mode: Staged Paragraph Card */}
            {generationMode === 'manual' && stagedParagraph ? (
              <div className="p-3 bg-[#fafbff] border border-[#c5cae9] rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95">
                <div className="text-xs font-semibold text-[#1a237e] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#1e8e3e]" />
                  Pending Review — Section Draft
                </div>
                <p className="text-[11px] text-[#1d1b20] leading-relaxed font-mono bg-white border border-[#e0e2ec] rounded-lg p-2 max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                  {stagedParagraph.content}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleApproveStagedParagraph}
                    size="sm"
                    className="flex-1 bg-[#1e8e3e] hover:bg-[#188038] gap-1 rounded-lg text-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve & Paste
                  </Button>
                  <Button
                    onClick={() => {
                      clearStagedParagraph()
                      addReasoningLog('[Manual] Regenerating section...')
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1 rounded-lg text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Regen
                  </Button>
                </div>
              </div>
            ) : (
              /* Automatic mode / idle: Critic Audit Status */
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1d1b20] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#1e8e3e]" />
                    Critic Audit Status
                  </span>
                  <Badge variant={showApprovalGate ? 'success' : 'neutral'}>
                    {showApprovalGate ? 'Passed Audit' : 'Auditing'}
                  </Badge>
                </div>

                {showApprovalGate ? (
                  <div className="p-3 bg-[#e6f4ea] border border-[#ceead6] rounded-xl flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-xs text-[#137333] font-medium">
                      The Legal Critic audited this clause. No discrepancies found.
                    </p>
                    <Button
                      onClick={handleApproveGate}
                      variant="default"
                      size="sm"
                      className="bg-[#1e8e3e] hover:bg-[#188038] gap-1.5 w-full mt-1 rounded-lg"
                    >
                      Approve & Advance
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-[#79747e] leading-relaxed">
                    {generationMode === 'manual'
                      ? 'Manual mode: each section will appear here for your review before being pasted into the document.'
                      : 'Automatic mode: sections will be inserted directly into the canvas as they are generated.'}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="pt-2 border-t border-[#e0e2ec] flex items-center justify-between text-[11px] text-[#79747e]">
            <span>DOCX Track Changes: Active</span>
            <button
              onClick={() => setMode('suggesting')}
              className="text-[#0b57d0] hover:underline flex items-center gap-1 font-medium"
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
