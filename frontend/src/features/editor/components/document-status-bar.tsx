'use client'

import React from 'react'
import { Sparkles, ZoomIn } from 'lucide-react'
import { useEditorStore } from '@/store/use-editor-store'

export function DocumentStatusBar() {
  const isDrafting = useEditorStore((s) => s.isDrafting)
  const statusMessage = useEditorStore((s) => s.statusMessage)
  const zoomLevel = useEditorStore((s) => s.zoomLevel)
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel)
  const isAiConsoleOpen = useEditorStore((s) => s.isAiConsoleOpen)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)

  const zoomOptions = [50, 75, 90, 100, 125, 150]

  return (
    <footer className="h-6 bg-[#f8f9fa] border-t border-[#dadce0] px-4 flex items-center justify-between text-[11px] text-[#5f6368] select-none z-10">
      {/* Left: Document stats */}
      <div className="flex items-center gap-3">
        <span>Page 1 of 1</span>
        <span className="text-[#dadce0]">|</span>
        <span>0 words</span>
        <span className="text-[#dadce0]">|</span>
        <span className="flex items-center gap-1">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isDrafting ? 'bg-[#f9ab00] animate-pulse' : 'bg-[#1e8e3e]'
            }`}
          />
          <span className="font-medium text-[#3c4043]">{statusMessage}</span>
        </span>
      </div>

      {/* Center: Quick AI trigger */}
      {!isAiConsoleOpen && (
        <button
          onClick={toggleAiConsole}
          className="flex items-center gap-1.5 px-3 py-0.5 rounded text-[#5f6368] hover:text-[#202124] hover:bg-[#e8eaed] transition-all text-[11px]"
        >
          <Sparkles className="w-3 h-3" />
          <span>AI Copilot (Ctrl+K)</span>
        </button>
      )}

      {/* Right: Zoom */}
      <div className="flex items-center gap-2">
        <ZoomIn className="w-3 h-3 text-[#80868b]" />
        <select
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className="bg-transparent text-[11px] text-[#5f6368] font-normal focus:outline-none cursor-pointer"
        >
          {zoomOptions.map((z) => (
            <option key={z} value={z}>{z}%</option>
          ))}
        </select>
      </div>
    </footer>
  )
}
