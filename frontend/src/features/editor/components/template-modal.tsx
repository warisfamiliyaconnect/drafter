'use client'

import React from 'react'
import { FileText, Briefcase, FileCode, X, Sparkles } from 'lucide-react'
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
        return <FileCode className="w-5 h-5 text-[#0b57d0]" />
      case 'business':
        return <Briefcase className="w-5 h-5 text-[#1e8e3e]" />
      default:
        return <FileText className="w-5 h-5 text-[#49454f]" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.16)] border border-[#e0e2ec] max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 px-5 border-b border-[#e0e2ec]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#d3e3fd] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#0b57d0]" />
            </div>
            <h3 className="font-semibold text-[#1d1b20] text-sm">Choose a Document Starter</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#79747e] hover:text-[#1d1b20] hover:bg-[#f0f4f9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 px-5 flex flex-col gap-2.5 max-h-[440px] overflow-y-auto bg-[#fafbfc]">
          {DEFAULT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                onSelectTemplate(tmpl)
                onClose()
              }}
              className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#e0e2ec] bg-white hover:border-[#0b57d0] hover:shadow-sm text-left transition-all group cursor-pointer"
            >
              <div className="p-2.5 rounded-xl bg-[#f0f4f9] border border-[#e0e2ec]/60 group-hover:bg-[#d3e3fd]/40 transition-colors shrink-0">
                {getCategoryIcon(tmpl.category)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-xs text-[#1d1b20] group-hover:text-[#0b57d0] transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-[11px] text-[#79747e] mt-0.5 leading-relaxed">
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
