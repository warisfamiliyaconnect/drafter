'use client'

import React, { useState } from 'react'
import {
  PenLine,
  GitPullRequest,
  Eye,
  ChevronDown,
  Check,
} from 'lucide-react'
import { useEditorStore, DocumentMode } from '@/store/use-editor-store'

interface MenuBarProps {
  onNewDoc: () => void
  onOpenTemplates: () => void
  onExportDoc: () => void
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function MenuBar({
  onNewDoc,
  onOpenTemplates,
  onExportDoc,
  onImportDoc,
}: MenuBarProps) {
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)

  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)

  const menus = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']

  const modes: { id: DocumentMode; label: string; icon: React.ReactNode }[] = [
    { id: 'editing', label: 'Editing', icon: <PenLine className="w-4 h-4 text-[#5f6368]" /> },
    { id: 'suggesting', label: 'Suggesting', icon: <GitPullRequest className="w-4 h-4 text-[#1e8e3e]" /> },
    { id: 'viewing', label: 'Viewing', icon: <Eye className="w-4 h-4 text-[#5f6368]" /> },
  ]

  const currentModeInfo = modes.find((m) => m.id === mode) || modes[0]

  const handleMenuClick = (menu: string) => {
    if (menu === 'File') {
      setActiveMenu(activeMenu === 'File' ? null : 'File')
    } else {
      setActiveMenu(null)
    }
  }

  return (
    <div className="h-[28px] bg-white px-3 flex items-center justify-between select-none">
      {/* Left: Menu items */}
      <div className="flex items-center gap-0 -ml-1">
        {menus.map((menu) => (
          <div key={menu} className="relative">
            <button
              onClick={() => handleMenuClick(menu)}
              onMouseEnter={() => activeMenu && setActiveMenu(menu)}
              className={`px-2.5 py-1 text-sm rounded hover:bg-[#e8eaed] transition-colors ${
                activeMenu === menu ? 'bg-[#e8eaed]' : ''
              } text-[#202124]`}
            >
              {menu}
            </button>

            {/* File dropdown */}
            {activeMenu === 'File' && menu === 'File' && (
              <div
                className="absolute top-full left-0 mt-0.5 w-64 bg-white border border-[#dadce0] rounded-lg shadow-lg py-1 z-50"
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => { onNewDoc(); setActiveMenu(null) }}
                  className="w-full flex items-center gap-3 px-4 py-1.5 text-sm text-[#202124] hover:bg-[#f1f3f4] text-left"
                >
                  New
                  <span className="ml-auto text-xs text-[#80868b]">Ctrl+N</span>
                </button>
                <button
                  onClick={() => { onOpenTemplates(); setActiveMenu(null) }}
                  className="w-full flex items-center gap-3 px-4 py-1.5 text-sm text-[#202124] hover:bg-[#f1f3f4] text-left"
                >
                  New from template
                </button>
                <div className="h-px bg-[#dadce0] my-1" />
                <label className="w-full flex items-center gap-3 px-4 py-1.5 text-sm text-[#202124] hover:bg-[#f1f3f4] text-left cursor-pointer">
                  Open
                  <span className="ml-auto text-xs text-[#80868b]">Ctrl+O</span>
                  <input
                    type="file"
                    accept=".docx"
                    className="hidden"
                    onChange={(e) => { onImportDoc(e); setActiveMenu(null) }}
                  />
                </label>
                <div className="h-px bg-[#dadce0] my-1" />
                <button
                  onClick={() => { onExportDoc(); setActiveMenu(null) }}
                  className="w-full flex items-center gap-3 px-4 py-1.5 text-sm text-[#202124] hover:bg-[#f1f3f4] text-left"
                >
                  Download
                  <span className="ml-auto text-xs text-[#80868b]">.docx</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right: Mode dropdown */}
      <div className="flex items-center gap-2">
        {/* AI Copilot shortcut */}
        <button
          onClick={toggleAiConsole}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
            isAiConsoleOpen
              ? 'bg-[#e8f0fe] text-[#1a73e8]'
              : 'text-[#5f6368] hover:bg-[#f1f3f4]'
          }`}
          title="Toggle AI Copilot (Ctrl+K)"
        >
          ✨ Copilot
        </button>

        {/* Mode dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-sm rounded hover:bg-[#e8eaed] transition-colors text-[#202124]"
          >
            {currentModeInfo.icon}
            <span>{currentModeInfo.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5f6368]" />
          </button>

          {isModeDropdownOpen && (
            <div
              className="absolute right-0 mt-0.5 w-52 bg-white border border-[#dadce0] rounded-lg shadow-lg py-1 z-50"
              onMouseLeave={() => setIsModeDropdownOpen(false)}
            >
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setIsModeDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                    mode === m.id
                      ? 'bg-[#e8f0fe] text-[#1a73e8]'
                      : 'text-[#202124] hover:bg-[#f1f3f4]'
                  }`}
                >
                  {m.icon}
                  <span className="flex-1">{m.label}</span>
                  {mode === m.id && <Check className="w-4 h-4 text-[#1a73e8]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
