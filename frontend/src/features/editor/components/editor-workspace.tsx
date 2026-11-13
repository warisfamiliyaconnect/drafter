'use client'

import React, { useState } from 'react'
import { ExecutiveHeader } from './executive-header'
import { FormattingRibbon } from './formatting-ribbon'
import { SuperDocCanvas } from './superdoc-canvas'
import { DocumentStatusBar } from './document-status-bar'
import { ColabBottomConsole } from '@/features/ai-assistant/components/colab-bottom-console'
import { FloatingSurgicalPill } from '@/features/ai-assistant/components/floating-surgical-pill'
import { TemplateModal } from './template-modal'
import { DocumentTemplate } from '@/types/document'
import { useEditorStore } from '@/store/use-editor-store'

export function EditorWorkspace() {
  const [activeDocSource, setActiveDocSource] = useState<string>('')
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const setStatusMessage = useEditorStore((s) => s.setStatusMessage)
  const setDocumentTitle = useEditorStore((s) => s.setDocumentTitle)

  const handleNewDoc = () => {
    setActiveDocSource('')
    setDocumentTitle('Untitled Document.docx')
    setStatusMessage('New Blank Document')
  }

  const handleSelectTemplate = (template: DocumentTemplate) => {
    setActiveDocSource(template.fileUrl)
    setDocumentTitle(`${template.name}.docx`)
    setStatusMessage(`Loaded: ${template.name}`)
  }

  const handleImportDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setActiveDocSource(objectUrl)
    setDocumentTitle(file.name)
    setStatusMessage(`Imported: ${file.name}`)
  }

  const handleExportDoc = async () => {
    if (typeof window !== 'undefined' && (window as any).__superdocInstance) {
      const editor = (window as any).__superdocInstance
      try {
        if (typeof editor.exportDocument === 'function') {
          const blob = await editor.exportDocument({ format: 'docx' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = useEditorStore.getState().documentTitle || 'Drafter_Document.docx'
          a.click()
          URL.revokeObjectURL(url)
          setStatusMessage('Exported .docx successfully')
          return
        }
      } catch (err) {
        console.error('SuperDoc export error:', err)
      }
    }
    setStatusMessage('Export ready')
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
      {/* 1. Executive Top Header */}
      <ExecutiveHeader
        onNewDoc={handleNewDoc}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onExportDoc={handleExportDoc}
        onImportDoc={handleImportDoc}
      />

      {/* 2. Google Docs Formatting Ribbon */}
      <FormattingRibbon />

      {/* 3. Full-Width Paginated Canvas Area with Expandable Colab Console */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <SuperDocCanvas documentSource={activeDocSource} />
        <FloatingSurgicalPill />
        <ColabBottomConsole />
      </div>

      {/* 4. Executive Bottom Status Bar */}
      <DocumentStatusBar />

      {/* 5. Starter Templates Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  )
}
