'use client'

import React from 'react'
import { Sparkles, ZoomIn, Minus, Plus } from 'lucide-react'
import { useEditorStore } from '@/store/use-editor-store'

export function DocumentStatusBar() {
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const statusMessage = useEditorStore((s) => s.statusMessage)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)

  const handleZoomChange = (delta: number) => {
    const next = Math.min(200, Math.max(50, zoomLevel + delta))
    setZoomLevel(next)
  }

  return (
    <footer className="h-6 bg-[#f0f4f9] px-4 flex items-center justify-between text-[11px] text-[#49454f] select-none z-10">
      {/* Left: Document stats */}
      <div className="flex items-center gap-2.5">
        <span>Page 1 of 1</span>
        <span className="text-[#cac4d0]">·</span>
        <span>0 words</span>
        <span className="text-[#cac4d0]">·</span>
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDrafting ? 'bg-[#e37400] animate-pulse' : 'bg-[#1e8e3e]'
            }`}
          />
          <span className="font-medium text-[#1d1b20]">{statusMessage}</span>
        </span>
      </div>

      {/* Center: Subtle AI Pill */}
      {!isAiConsoleOpen && (
        <button
          onClick={toggleAiConsole}
          className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f3e8ff]/80 text-[#7c3aed] hover:bg-[#ede9fe] transition-colors text-[11px] font-medium"
        >
          <Sparkles className="w-3 h-3 text-[#a855f7]" />
          <span>Ask AI Copilot (Ctrl+K)</span>
        </button>
      )}

      {/* Right: Zoom Stepper */}
      <div className="flex items-center gap-1 text-[#49454f]">
        <button
          onClick={() => handleZoomChange(-10)}
          className="w-5 h-5 rounded hover:bg-black/[0.05] flex items-center justify-center transition-colors"
          title="Zoom out"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center font-medium">{zoomLevel}%</span>
        <button
          onClick={() => handleZoomChange(10)}
          className="w-5 h-5 rounded hover:bg-black/[0.05] flex items-center justify-center transition-colors"
          title="Zoom in"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </footer>
  )
}
