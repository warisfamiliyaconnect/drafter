'use client'

import React, { useState } from 'react'
import { DocumentTitleBar } from './document-title-bar'
import { MenuBar } from './menu-bar'
import { FormattingRibbon } from './formatting-ribbon'
import { SuperDocCanvas } from './superdoc-canvas'
import { RightSidebarStrip } from './right-sidebar-strip'
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
    setDocumentTitle('Untitled document.docx')
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* 1. Google Docs Document Title & Identity Bar */}
      <DocumentTitleBar onImportDoc={handleImportDoc} />

      {/* 2. Menu Bar (File, Edit, View, Insert, Format, Tools... + Mode Switcher) */}
      <MenuBar
        onNewDoc={handleNewDoc}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onExportDoc={handleExportDoc}
        onImportDoc={handleImportDoc}
      />

      {/* 3. Google Docs Formatting Ribbon / Toolbar */}
      <FormattingRibbon />

      {/* 4. Main Work Area: Canvas + AI Overlays + Right Icon Strip */}
      <div className="flex-1 overflow-hidden relative flex flex-row">
        {/* Document Editing Canvas & AI Overlays */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <SuperDocCanvas documentSource={activeDocSource} />
          <FloatingSurgicalPill />
          <ColabBottomConsole />
        </div>

        {/* Google Workspace Right Tool Strip */}
        <RightSidebarStrip />
      </div>

      {/* 5. Minimal Status Bar */}
      <DocumentStatusBar />

      {/* 6. Starter Templates Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  )
}
