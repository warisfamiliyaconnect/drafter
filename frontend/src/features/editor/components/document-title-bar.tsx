'use client'

import React, { useState } from 'react'
import {
  Star,
  Clock,
  MessageSquare,
  Video,
  Lock,
  Cloud,
  CloudOff,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEditorStore } from '@/store/use-editor-store'

interface DocumentTitleBarProps {
  onImportDoc: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function DocumentTitleBar({ onImportDoc }: DocumentTitleBarProps) {
  const documentTitle = useEditorStore((s) => s.documentTitle)
  const setDocumentTitle = useEditorStore((s) => s.setDocumentTitle)
  const isDrafting = useEditorStore((s) => s.isDrafting)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleInput, setTitleInput] = useState(documentTitle)
  const [isStarred, setIsStarred] = useState(false)

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setDocumentTitle(titleInput.trim())
    } else {
      setTitleInput(documentTitle)
    }
    setIsEditingTitle(false)
  }

  return (
    <div className="h-[52px] bg-white px-3 flex items-center justify-between select-none">
      {/* Left: Doc icon + Title + Star + Sync */}
      <div className="flex items-center gap-1 min-w-0">
        {/* Google Docs-style page icon */}
        <div className="flex items-center justify-center w-10 h-10 shrink-0">
          <svg viewBox="0 0 48 48" className="w-8 h-8" fill="none">
            <path d="M12 6h18l12 12v24a3 3 0 01-3 3H12a3 3 0 01-3-3V9a3 3 0 013-3z" fill="#4285f4" />
            <path d="M30 6l12 12H33a3 3 0 01-3-3V6z" fill="#a1c2fa" />
            <rect x="16" y="24" width="16" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="16" y="29" width="12" height="2" rx="1" fill="white" opacity="0.9" />
            <rect x="16" y="34" width="14" height="2" rx="1" fill="white" opacity="0.9" />
          </svg>
        </div>

        {/* Title + status row */}
        <div className="flex flex-col min-w-0">
          {/* Editable title */}
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
                className="text-lg font-normal px-1.5 py-0 rounded border border-[#1a73e8] focus:outline-none text-[#202124] w-72 bg-white"
              />
            ) : (
              <button
                onClick={() => {
                  setTitleInput(documentTitle)
                  setIsEditingTitle(true)
                }}
                className="text-lg font-normal px-1.5 py-0 rounded hover:bg-[#f1f3f4] text-[#202124] transition-colors text-left max-w-sm truncate leading-tight"
                title="Rename"
              >
                {documentTitle.replace(/\.docx$/, '')}
              </button>
            )}

            {/* Star */}
            <button
              onClick={() => setIsStarred(!isStarred)}
              className="p-1 rounded-full hover:bg-[#f1f3f4] transition-colors"
              title={isStarred ? 'Remove from starred' : 'Star'}
            >
              <Star
                className={`w-[18px] h-[18px] ${
                  isStarred
                    ? 'fill-[#fbbc04] text-[#fbbc04]'
                    : 'text-[#5f6368]'
                }`}
              />
            </button>

            {/* Cloud sync */}
            <div className="flex items-center gap-1 ml-1">
              {isDrafting ? (
                <CloudOff className="w-4 h-4 text-[#80868b]" />
              ) : (
                <Cloud className="w-4 h-4 text-[#5f6368]" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions + Share + Avatar */}
      <div className="flex items-center gap-1 shrink-0">
        {/* History */}
        <button
          className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors"
          title="Last edit was seconds ago"
        >
          <Clock className="w-5 h-5 text-[#5f6368]" />
        </button>

        {/* Comments */}
        <button
          className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors"
          title="Open comment history"
        >
          <MessageSquare className="w-5 h-5 text-[#5f6368]" />
        </button>

        {/* Meet */}
        <button
          className="p-2 rounded-full hover:bg-[#f1f3f4] transition-colors"
          title="Join a call"
        >
          <Video className="w-5 h-5 text-[#5f6368]" />
        </button>

        {/* Lock / Private */}
        <button
          className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-[#f1f3f4] transition-colors text-[13px] text-[#5f6368]"
          title="Private to only me"
        >
          <Lock className="w-4 h-4" />
        </button>

        {/* Share button */}
        <Button
          variant="default"
          size="md"
          className="rounded-full px-6 h-9 text-sm font-medium shadow-sm ml-2"
        >
          Share
        </Button>

        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-sm font-medium ml-2 cursor-pointer">
          W
        </div>
      </div>
    </div>
  )
}
