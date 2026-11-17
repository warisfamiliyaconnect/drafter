'use client'

import React from 'react'
import { FileText, Briefcase, FileCode, X } from 'lucide-react'
import { DocumentTemplate } from '@/types/document'

interface TemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: DocumentTemplate) => void
}

const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    description: 'Clean standard letter-size document with 1-inch margins and standard typography.',
    category: 'blank',
    fileUrl: '',
  },
  {
    id: 'nda',
    name: 'Mutual NDA Agreement',
    description: 'Bilateral confidentiality agreement with standard non-disclosure clauses and definitions.',
    category: 'legal',
    fileUrl: '/templates/nda.docx',
  },
  {
    id: 'consulting',
    name: 'Master Services Agreement',
    description: 'Professional consulting contract with deliverables, payment schedules, and IP ownership.',
    category: 'business',
    fileUrl: '/templates/consulting.docx',
  },
]

export function TemplateModal({ isOpen, onClose, onSelectTemplate }: TemplateModalProps) {
  if (!isOpen) return null

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'legal':
        return <FileCode className="w-5 h-5 text-[#1a73e8]" />
      case 'business':
        return <Briefcase className="w-5 h-5 text-[#1e8e3e]" />
      default:
        return <FileText className="w-5 h-5 text-[#5f6368]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#dadce0] max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#dadce0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1a73e8]" />
            <h3 className="font-medium text-[#202124] text-sm">Choose a Document Starter</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3 max-h-[420px] overflow-y-auto">
          {DEFAULT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl)
                onClose()
              }}
              className="flex items-start gap-3 p-3.5 rounded-lg border border-[#dadce0] hover:border-[#1a73e8] hover:bg-[#f8fafd] text-left transition-all group"
            >
              <div className="p-2.5 rounded-lg bg-[#f8f9fa] border border-[#dadce0] group-hover:bg-white group-hover:border-[#1a73e8]/30 transition-colors">
                {getCategoryIcon(tmpl.category)}
              </div>
              <div>
                <h4 className="font-medium text-xs text-[#202124] group-hover:text-[#1a73e8] transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-[11px] text-[#5f6368] mt-1 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
