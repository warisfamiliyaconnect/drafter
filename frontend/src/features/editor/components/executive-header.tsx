'use client'

import React, { useState } from 'react'
import {
  Sparkles,
  Download,
  Upload,
  FileText,
  CloudCheck,
  Check,
  ChevronDown,
  PenLine,
  GitPullRequest,
  Eye,
  Bot
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useEditorStore, DocumentMode } from '@/store/use-editor-store'

interface ExecutiveHeaderProps {
  onNewDoc: () => void
  onOpenTemplates: () => void
  onExportDoc: () => void
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function ExecutiveHeader({
  onNewDoc,
  onOpenTemplates,
  onExportDoc,
  onImportDoc,
}: ExecutiveHeaderProps) {
  const documentTitle = useEditorStore((s) => s.documentTitle)
  const setDocumentTitle = useEditorStore((s) => s.setDocumentTitle)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)
  const isDrafting = useEditorStore((s) => s.isDrafting)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(documentTitle)
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setDocumentTitle(titleInput.trim())
    } else {
      setTitleInput(documentTitle)
    }
    setIsEditingTitle(false)
  }

  const modes: { id: DocumentMode; label: string; icon: React.ReactNode }[] = [
    { id: 'editing', label: 'Editing', icon: <PenLine className="w-3.5 h-3.5 text-indigo-600" /> },
    { id: 'suggesting', label: 'Suggesting (Redlines)', icon: <GitPullRequest className="w-3.5 h-3.5 text-emerald-600" /> },
    { id: 'viewing', label: 'Viewing (Read-only)', icon: <Eye className="w-3.5 h-3.5 text-slate-500" /> },
  ]

  const currentModeInfo = modes.find((m) => m.id === mode) || modes[0]

  return (
    <header className="h-13 bg-white border-b border-slate-200 px-4 flex items-center justify-between z-20 select-none">
      {/* Left: Brand + Editable Document Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-base text-indigo-600 cursor-pointer">
          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="tracking-tight font-bold text-slate-900">Drafter</span>
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* In-place Editable Title */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit()
                if (e.key === 'Escape') {
                  setTitleInput(documentTitle)
                  setIsEditingTitle(false)
                }
              }}
              className="text-xs font-semibold px-2 py-1 rounded border border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 w-64"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(documentTitle)
                setIsEditingTitle(true)
              }}
              className="text-xs font-semibold px-2 py-1 rounded hover:bg-slate-100 text-slate-800 transition-colors text-left max-w-xs truncate"
              title="Click to rename document"
            >
              {documentTitle}
            </button>
          )}

          {/* Sync status */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
            <Check className="w-3 h-3 text-emerald-600" />
            <span>Saved</span>
          </div>
        </div>
      </div>

      {/* Center / Right: Mode Switcher, Document Actions, AI Copilot Toggle */}
      <div className="flex items-center gap-2">
        {/* Templates */}
        <Button variant="ghost" size="sm" onClick={onOpenTemplates}>
          <FileText className="w-3.5 h-3.5 mr-1" />
          Templates
        </Button>

        {/* Import */}
        <label className="cursor-pointer">
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-md hover:bg-slate-100 text-slate-700 transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import
          </span>
          <input
            type="file"
            accept=".docx"
            className="hidden"
            onChange={onImportDoc}
          />
        </label>

        {/* Export .docx */}
        <Button variant="outline" size="sm" onClick={onExportDoc}>
          <Download className="w-3.5 h-3.5 mr-1" />
          Export .docx
        </Button>

        <Separator orientation="vertical" className="h-5" />

        {/* Mode Dropdown Selector */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors border border-slate-200"
          >
            {currentModeInfo.icon}
            <span>{currentModeInfo.label}</span>
            <ChevronDown className="w-3 h-3 text-slate-500" />
          </button>

          {isModeDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setIsModeDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors ${
                    mode === m.id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.icon}
                  <span className="flex-1">{m.label}</span>
                  {mode === m.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-5" />

        {/* Colab AI Copilot Toggle Button */}
        <Button
          variant={isAiConsoleOpen ? 'default' : 'subtle'}
          size="sm"
          onClick={toggleAiConsole}
          className="gap-1.5 font-semibold"
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Copilot</span>
          <span className="text-[10px] px-1 py-0.2 bg-indigo-500/20 rounded font-mono">Ctrl+K</span>
        </Button>
      </div>
    </header>
  )
}
