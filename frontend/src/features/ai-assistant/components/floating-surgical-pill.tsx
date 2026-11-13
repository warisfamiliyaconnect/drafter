'use client'

import React, { useState, useEffect } from 'react'
import { Wand2, Check, X, Loader2, Sparkles } from 'lucide-react'
import { submitSurgicalEdit } from '@/services/agent-service'
import { useEditorStore } from '@/store/use-editor-store'

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
    const promptToUse = customInstruction || instruction || 'Rewrite to be professional, clear, and authoritative'
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
      if (typeof window !== 'undefined' && (window as any).__superdocInstance) {
        const editor = (window as any).__superdocInstance
        try {
          if (typeof editor.insertContent === 'function') {
            editor.insertContent(result.rewrittenText)
          }
        } catch (e) {
          console.warn('SuperDoc surgical replacement:', e)
        }
      }

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
      className="fixed z-50 transform -translate-x-1/2 pointer-events-auto"
      style={{ left: `${coords.x}px`, top: `${coords.y}px` }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-xl hover:bg-indigo-600 transition-all border border-slate-700 animate-in fade-in zoom-in-95 duration-150 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Rewrite</span>
        </button>
      ) : (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-3 w-80 flex flex-col gap-2.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Wand2 className="w-3 h-3 text-indigo-600" />
              Surgical AI Refinement
            </span>
            <button
              onClick={() => {
                setIsOpen(false)
                setCoords(null)
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
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
                className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors disabled:opacity-50"
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
              className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyRewrite()
              }}
            />
            <button
              onClick={() => handleApplyRewrite()}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
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
