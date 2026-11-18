'use client'

import React, { useState, useEffect } from 'react'
import { Wand2, Check, X, Loader2, Sparkles } from 'lucide-react'
import { submitSurgicalEdit } from '@/services/agent-service'
import { useEditorStore } from '@/store/use-editor-store'
import { insertContentIntoDocument } from '@/lib/superdoc-bridge'

export function FloatingSurgicalPill() {
  const [selectedText, setSelectedText] = useState('')
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [instruction, setInstruction] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const setMode = useEditorStore((s) => s.setMode)
  const setStatusMessage = useEditorStore((s) => s.setStatusMessage)

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        if (!isOpen) {
          setSelectedText('')
          setCoords(null)
        }
        return
      }

      const text = selection.toString().trim()
      if (text.length > 2) {
        const range = selection.getRangeAt(0)
        const rect = range.getBoundingClientRect()
        setSelectedText(text)
        setCoords({
          x: rect.left + rect.width / 2,
          y: Math.max(10, rect.top - 44),
        })
      }
    }

    document.addEventListener('mouseup', handleMouseUp)
    return () => document.removeEventListener('mouseup', handleMouseUp)
  }, [isOpen])

  const handleApplyRewrite = async (customInstruction?: string) => {
    const promptToUse =
      customInstruction || instruction || 'Rewrite to be professional, clear, and authoritative'
    setIsLoading(true)
    setStatusMessage('Surgically revising text...')

    try {
      // Switch editor to suggesting mode for tracked changes
      setMode('suggesting')

      const result = await submitSurgicalEdit({
        selectedText,
        instruction: promptToUse,
      })

      // Replace in editor instance
      insertContentIntoDocument(result.rewrittenText)

      setStatusMessage('Revision proposed in Suggestion Mode')
      setIsOpen(false)
      setSelectedText('')
      setCoords(null)
      setInstruction('')
    } catch (err) {
      console.error('Surgical edit failed:', err)
      setStatusMessage('Error rewriting text')
    } finally {
      setIsLoading(false)
    }
  }

  if (!coords || !selectedText) return null

  return (
    <div
      className="fixed z-50 transform -translate-x-1/2 pointer-events-auto select-none"
      style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-surface text-[#6b21a8] text-xs font-semibold shadow-[0_4px_20px_rgba(168,85,247,0.25)] hover:shadow-[0_6px_24px_rgba(168,85,247,0.35)] hover:scale-105 transition-all border border-purple-200/60 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#a855f7]" />
          <span>AI Rewrite</span>
        </button>
      ) : (
        <div className="glass-surface rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-[#e0e2ec] p-3.5 w-84 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1d1b20] flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-[#a855f7]" />
              Surgical AI Refinement
            </span>
            <button
              onClick={() => {
                setIsOpen(false)
                setCoords(null)
              }}
              className="p-1 text-[#79747e] hover:text-[#1d1b20] rounded-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {['More Professional', 'Make Shorter', 'Bullet Points'].map((preset) => (
              <button
                key={preset}
                disabled={isLoading}
                onClick={() => handleApplyRewrite(preset)}
                className="text-xs px-2.5 py-1 rounded-full bg-[#f3e8ff] hover:bg-[#ede9fe] text-[#7c3aed] font-medium transition-colors disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Custom rewrite instruction..."
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-1.5 rounded-xl border border-[#e0e2ec] focus:outline-none focus:ring-2 focus:ring-[#a855f7]/20 focus:border-[#a855f7] bg-white text-[#1d1b20]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyRewrite()
              }}
            />
            <button
              onClick={() => handleApplyRewrite()}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#a855f7] to-[#6366f1] text-white hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
