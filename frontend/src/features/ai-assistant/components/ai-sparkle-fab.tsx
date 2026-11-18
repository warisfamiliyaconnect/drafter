'use client'

import React, { useState } from 'react'
import { Sparkles, Bot } from 'lucide-react'
import { useEditorStore } from '@/store/use-editor-store'

export function AiSparkleFab() {
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="fixed bottom-7 right-8 z-40 select-none">
      <button
        type="button"
        onClick={toggleAiConsole}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title="Open Drafter AI Copilot (Ctrl+K)"
        className={`group relative flex items-center justify-center transition-all duration-300 rounded-full cursor-pointer active:scale-95 ${
          isHovered ? 'px-4 h-11' : 'w-11 h-11'
        } bg-gradient-to-br from-[#a855f7] via-[#7c3aed] to-[#4f46e5] text-white shadow-[0_4px_20px_rgba(168,85,247,0.35)] hover:shadow-[0_6px_28px_rgba(168,85,247,0.5)] border border-white/20 ${
          isDrafting ? 'ai-glow animate-pulse' : 'ai-glow'
        }`}
      >
        {/* Subtle spinning glow border when drafting */}
        {isDrafting && (
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 opacity-75 blur-sm animate-spin -z-10" />
        )}

        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white shrink-0 group-hover:rotate-12 transition-transform duration-300" />
          {isHovered && (
            <span className="text-xs font-semibold tracking-wide whitespace-nowrap animate-in fade-in duration-200">
              {isAiConsoleOpen ? 'Close AI' : 'Drafter AI'}
            </span>
          )}
        </div>

        {/* Status dot if open or drafting */}
        {isDrafting && !isHovered && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
        )}
      </button>
    </div>
  )
}
