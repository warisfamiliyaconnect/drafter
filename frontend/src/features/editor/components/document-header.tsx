'use client'

import React, { useState } from 'react'
import {
  Star,
  Clock,
  MessageSquare,
  Lock,
  Cloud,
  CloudOff,
  Sparkles,
  ChevronDown,
  Check,
  PenLine,
  GitPullRequest,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore, DocumentMode } from '@/store/use-editor-store'

interface DocumentHeaderProps {
  onNewDoc: () => void
  onOpenTemplates: () => void
  onExportDoc: () => void
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function DocumentHeader({
  onNewDoc,
  onOpenTemplates,
  onExportDoc,
  onImportDoc,
}: DocumentHeaderProps) {
  const documentTitle = useEditorStore((s) => s.documentTitle)
  const setDocumentTitle = useEditorStore((s) => s.setDocumentTitle)
  const mode = useEditorStore((s) => s.mode)
  const setMode = useEditorStore((s) => s.setMode)
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(documentTitle)
  const [isStarred, setIsStarred] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false)

  const menus = ['File', 'Edit', 'View', 'Insert', 'Format', 'Tools', 'Extensions', 'Help']

  const modes: { id: DocumentMode; label: string; icon: React.ReactNode }[] = [
    { id: 'editing', label: 'Editing', icon: <PenLine className="w-3.5 h-3.5 text-[#49454f]" /> },
    { id: 'suggesting', label: 'Suggesting', icon: <GitPullRequest className="w-3.5 h-3.5 text-[#1e8e3e]" /> },
    { id: 'viewing', label: 'Viewing', icon: <Eye className="w-3.5 h-3.5 text-[#49454f]" /> },
  ]

  const currentModeInfo = modes.find((m) => m.id === mode) || modes[0]

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setDocumentTitle(titleInput.trim())
    } else {
      setTitleInput(documentTitle)
    }
    setIsEditingTitle(false)
  }

  const handleMenuClick = (menu: string) => {
    if (menu === 'File') {
      setActiveMenu(activeMenu === 'File' ? null : 'File')
    } else {
      setActiveMenu(null)
    }
  }

  return (
    <header className="h-12 bg-white px-3 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Doc Icon + Title + Status + Inline Menus */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Modern Google Docs Icon */}
        <div className="flex items-center justify-center w-8 h-8 shrink-0 hover:opacity-90 transition-opacity cursor-pointer">
          <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none">
            <path d="M12 6h18l12 12v24a3 3 0 01-3 3H12a3 3 0 01-3-3V9a3 3 0 013-3z" fill="#0b57d0" />
            <path d="M30 6l12 12H33a3 3 0 01-3-3V6z" fill="#a8c7fa" />
            <rect x="16" y="24" width="16" height="2" rx="1" fill="white" opacity="0.95" />
            <rect x="16" y="29" width="12" height="2" rx="1" fill="white" opacity="0.95" />
            <rect x="16" y="34" width="14" height="2" rx="1" fill="white" opacity="0.95" />
          </svg>
        </div>

        {/* Editable Title */}
        <div className="flex items-center gap-1">
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
              className="text-sm font-medium px-2 py-0.5 rounded-md border border-[#0b57d0] focus:outline-none text-[#1d1b20] w-64 bg-white"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(documentTitle)
                setIsEditingTitle(true)
              }}
              className="text-sm font-medium px-2 py-0.5 rounded-md hover:bg-[#f0f4f9] text-[#1d1b20] transition-colors text-left max-w-[220px] truncate"
              title="Click to rename"
            >
              {documentTitle.replace(/\.docx$/, '')}
            </button>
          )}

          {/* Star Toggle */}
          <button
            onClick={() => setIsStarred(!isStarred)}
            className="p-1 rounded-full hover:bg-[#f0f4f9] transition-colors"
            title={isStarred ? 'Remove from starred' : 'Star'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isStarred ? 'fill-[#fbbc04] text-[#fbbc04]' : 'text-[#79747e]'
              }`}
            />
          </button>

          {/* Cloud Sync Status */}
          <div className="flex items-center text-[#79747e] ml-0.5" title={isDrafting ? 'Saving changes...' : 'Saved to cloud'}>
            {isDrafting ? (
              <CloudOff className="w-3.5 h-3.5 animate-pulse text-[#e37400]" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        {/* Delicate divider */}
        <div className="h-4 w-px bg-[#e0e2ec] mx-1 hidden md:block" />

        {/* Compact Text Menu Items */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {menus.map((menu) => (
            <div key={menu} className="relative">
              <button
                onClick={() => handleMenuClick(menu)}
                onMouseEnter={() => activeMenu && setActiveMenu(menu)}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
                  activeMenu === menu
                    ? 'bg-[#e9eef6] text-[#041e49] font-medium'
                    : 'text-[#49454f] hover:bg-[#f0f4f9] hover:text-[#1d1b20]'
                }`}
              >
                {menu}
              </button>

              {/* File Dropdown */}
              {activeMenu === 'File' && menu === 'File' && (
                <div
                  className="absolute top-full left-0 mt-1 w-60 bg-white border border-[#e0e2ec] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onMouseLeave={() => setActiveMenu(null)}
                >
                  <button
                    onClick={() => {
                      onNewDoc()
                      setActiveMenu(null)
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#1d1b20] hover:bg-[#f0f4f9] text-left transition-colors"
                  >
                    <span>New Document</span>
                    <span className="text-[10px] text-[#79747e]">Ctrl+N</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenTemplates()
                      setActiveMenu(null)
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#1d1b20] hover:bg-[#f0f4f9] text-left transition-colors"
                  >
                    <span>New from template</span>
                  </button>

                  <div className="h-px bg-[#e0e2ec]/60 my-1" />

                  <label className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#1d1b20] hover:bg-[#f0f4f9] text-left cursor-pointer transition-colors">
                    <span>Open (.docx)</span>
                    <span className="text-[10px] text-[#79747e]">Ctrl+O</span>
                    <input
                      type="file"
                      accept=".docx"
                      className="hidden"
                      onChange={(e) => {
                        onImportDoc(e)
                        setActiveMenu(null)
                      }}
                    />
                  </label>

                  <div className="h-px bg-[#e0e2ec]/60 my-1" />

                  <button
                    onClick={() => {
                      onExportDoc()
                      setActiveMenu(null)
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-[#1d1b20] hover:bg-[#f0f4f9] text-left transition-colors"
                  >
                    <span>Download (.docx)</span>
                    <span className="text-[10px] text-[#79747e]">Export</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right: AI Copilot Chip + Mode Switcher + Lock + Share + Avatar */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* 2026 AI Copilot Chip */}
        <button
          onClick={toggleAiConsole}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
            isAiConsoleOpen
              ? 'bg-gradient-to-r from-[#a855f7]/20 to-[#6366f1]/20 text-[#6b21a8] ring-1 ring-[#a855f7]/40 shadow-xs'
              : 'bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 text-purple-700 hover:from-purple-500/20 hover:to-blue-500/20 border border-purple-200/50'
          }`}
          title="Toggle AI Copilot (Ctrl+K)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#a855f7] animate-pulse" />
          <span>Copilot</span>
        </button>

        {/* Mode Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg hover:bg-[#f0f4f9] text-[#1d1b20] transition-colors"
          >
            {currentModeInfo.icon}
            <span className="hidden sm:inline">{currentModeInfo.label}</span>
            <ChevronDown className="w-3 h-3 text-[#79747e]" />
          </button>

          {isModeDropdownOpen && (
            <div
              className="absolute right-0 mt-1 w-48 bg-white border border-[#e0e2ec] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
              onMouseLeave={() => setIsModeDropdownOpen(false)}
            >
              {modes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMode(m.id)
                    setIsModeDropdownOpen(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-1.5 text-xs text-left transition-colors ${
                    mode === m.id
                      ? 'bg-[#d3e3fd] text-[#041e49] font-medium'
                      : 'text-[#1d1b20] hover:bg-[#f0f4f9]'
                  }`}
                >
                  {m.icon}
                  <span className="flex-1">{m.label}</span>
                  {mode === m.id && <Check className="w-3.5 h-3.5 text-[#0b57d0]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lock indicator */}
        <button
          className="p-1.5 rounded-full hover:bg-[#f0f4f9] text-[#79747e] transition-colors hidden sm:block"
          title="Private to only me"
        >
          <Lock className="w-3.5 h-3.5" />
        </button>

        {/* Share Button (2026 Material 3 Rounded Pill) */}
        <Button
          variant="default"
          size="sm"
          className="rounded-full px-4 h-8 text-xs font-medium shadow-xs bg-[#0b57d0] hover:bg-[#0842a0]"
        >
          Share
        </Button>

        {/* User Avatar */}
        <div className="w-7 h-7 rounded-full bg-[#0b57d0] flex items-center justify-center text-white text-xs font-medium cursor-pointer shadow-xs">
          W
        </div>
      </div>
    </header>
  )
}
