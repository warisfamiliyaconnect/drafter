'use client'

import React, { useRef } from 'react'
import dynamic from 'next/dynamic'
import { superdocFonts } from '@superdoc-dev/fonts'
import { useEditorStore } from '@/store/use-editor-store'

// Avoid SSR evaluation of DOM-dependent document layout engine
const SuperDocEditor = dynamic(
  () => import('@superdoc-dev/react').then((mod) => mod.SuperDocEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[800px] w-full items-center justify-center bg-[#f0f0f0] text-[#5f6368]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1a73e8] border-t-transparent" />
          <p className="text-sm font-normal">Initializing Document Engine...</p>
        </div>
      </div>
    ),
  }
)

interface SuperDocCanvasProps {
  documentSource?: string
}

export function SuperDocCanvas({ documentSource }: SuperDocCanvasProps) {
  const editorRef = useRef<any>(null)
  const mode = useEditorStore((s) => s.mode)
  const setSelection = useEditorStore((s) => s.setSelection)

  const handleEditorReady = (editor: any) => {
    editorRef.current = editor
    if (typeof window !== 'undefined') {
      ;(window as any).__superdocInstance = editor
    }
  }

  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-[#f0f0f0] py-4 px-6 flex justify-center">
      <div className="w-full max-w-[816px] min-h-[1056px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] transition-all">
        <SuperDocEditor
          document={documentSource || ''}
          fonts={superdocFonts}
          documentMode={mode}
          onReady={handleEditorReady}
          style={{ width: '100%', minHeight: '1056px' }}
        />
      </div>
    </div>
  )
}
