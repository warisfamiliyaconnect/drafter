'use client'

import React, { useState } from 'react'
import { DocumentHeader } from './document-header'
import { FormattingRibbon } from './formatting-ribbon'
import { SuperDocCanvas } from './superdoc-canvas'
import { RightSidebarStrip } from './right-sidebar-strip'
import { DocumentStatusBar } from './document-status-bar'
import { ColabBottomConsole } from '@/features/ai-assistant/components/colab-bottom-console'
import { FloatingSurgicalPill } from '@/features/ai-assistant/components/floating-surgical-pill'
import { AiSparkleFab } from '@/features/ai-assistant/components/ai-sparkle-fab'
import { TemplateModal } from './template-modal'
import { DocumentTemplate } from '@/types/document'
import { useEditorStore } from '@/store/use-editor-store'
import { exportDocument } from '@/lib/superdoc-bridge'

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
    const filename = useEditorStore.getState().documentTitle || 'Drafter_Document.docx'
    const success = await exportDocument(filename)
    if (success) {
      setStatusMessage('Exported .docx successfully')
    } else {
      setStatusMessage('Export ready')
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f0f4f9]">
      {/* 1. Modern 2026 Unified Document Header (Title + Inline Menus + Share) */}
      <DocumentHeader
        onNewDoc={handleNewDoc}
        onOpenTemplates={() => setIsTemplateModalOpen(true)}
        onExportDoc={handleExportDoc}
        onImportDoc={handleImportDoc}
      />

      {/* 2. Floating Pill Formatting Toolbar */}
      <FormattingRibbon />

      {/* 3. Main Work Area: Canvas + AI Overlays + Companion Rail */}
      <div className="flex-1 overflow-hidden relative flex flex-row">
        {/* Document Editing Canvas & AI Overlays */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <SuperDocCanvas documentSource={activeDocSource} />
          <FloatingSurgicalPill />
          <ColabBottomConsole />
        </div>

        {/* Workspace Companion Strip */}
        <RightSidebarStrip />
      </div>

      {/* 4. Minimal Borderless Status Bar */}
      <DocumentStatusBar />

      {/* 5. 2026 AI Sparkle Floating Action Button */}
      <AiSparkleFab />

      {/* 6. Starter Templates Modal */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  )
}
