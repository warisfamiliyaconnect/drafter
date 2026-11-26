'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import { BlankDOCX } from 'superdoc'
import { superdocFonts } from '@superdoc-dev/fonts'
import { useEditorStore } from '@/store/use-editor-store'
import { setSuperDoc, setSuperDocEditor } from '@/lib/superdoc-bridge'

// Avoid SSR evaluation of DOM-dependent document layout engine
const SuperDocEditor = dynamic(
  () => import('@superdoc-dev/react').then((mod) => mod.SuperDocEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[800px] w-full items-center justify-center bg-slate-50 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium">Initializing Document Engine...</p>
        </div>
      </div>
    ),
  }
)

interface SuperDocCanvasProps {
  documentSource?: string
}

export function SuperDocCanvas({ documentSource }: SuperDocCanvasProps) {
  const mode = useEditorStore((s) => s.mode)
  // Use BlankDOCX data URL so SuperDoc loads synchronously in-memory
  const activeDocument = documentSource || BlankDOCX

  const handleReady = (event: any) => {
    console.log('[SuperDoc Canvas] Ready:', event)
    setSuperDoc(event)
  }

  const handleEditorCreate = (event: any) => {
    console.log('[SuperDoc Canvas] Editor created:', event)
    setSuperDocEditor(event)
  }

  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-slate-100/80 p-6 flex justify-center">
      <div className="w-full max-w-[900px] min-h-[1120px] rounded-sm bg-white shadow-xl transition-all">
        <SuperDocEditor
          document={activeDocument}
          fonts={superdocFonts}
          documentMode={mode}
          hideToolbar={true}
          onReady={handleReady}
          onEditorCreate={handleEditorCreate}
          style={{ width: '100%', minHeight: '1120px' }}
        />
      </div>
    </div>
  )
}
