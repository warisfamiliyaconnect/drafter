'use client'

import React from 'react'
import {
  FileText,
  Download,
  Upload,
  Sparkles,
  CheckCircle2,
  Eye,
  PenLine,
  GitPullRequest
} from 'lucide-react'
import { useEditorStore, DocumentMode } from '@/store/use-editor-store'

interface EditorToolbarProps {
  onNewDoc: () => void
  onOpenTemplates: () => void
  onExportDoc: () => void
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function EditorToolbar({
  onNewDoc,
  onOpenTemplates,
  onExportDoc,
  onImportDoc,
}: EditorToolbarProps) {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const statusMessage = useEditorStore((s) => s.statusMessage)
  const isDrafting = useEditorStore((s) => s.isDrafting)

  const modes: { id: DocumentMode; label: string; icon: React.ReactNode }[] = [
    { id: 'editing', label: 'Editing', icon: <PenLine className="w-3.5 h-3.5" /> },
    { id: 'suggesting', label: 'Suggesting (Redline)', icon: <GitPullRequest className="w-3.5 h-3.5" /> },
    { id: 'viewing', label: 'Viewing', icon: <Eye className="w-3.5 h-3.5" /> },
  ]

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-10 select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-bold text-lg text-indigo-600 mr-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <span>Drafter</span>
        </div>

        <div className="h-5 w-px bg-slate-200" />

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={onNewDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            New
          </button>
          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            Templates
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            Import .docx
            <input
              type="file"
              accept=".docx"
              className="hidden"
              onChange={onImportDoc}
            />
          </label>
          <button
            onClick={onExportDoc}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export .docx
          </button>
        </div>
      </div>

      {/* Mode Selector and Status */}
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
          <span
            className={`w-2 h-2 rounded-full ${
              isDrafting ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="font-medium text-slate-700">{statusMessage}</span>
        </div>

        {/* Document Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                mode === m.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
