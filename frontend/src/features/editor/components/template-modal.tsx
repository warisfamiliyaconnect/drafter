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
        return <FileCode className="w-5 h-5 text-indigo-600" />
      case 'business':
        return <Briefcase className="w-5 h-5 text-emerald-600" />
      default:
        return <FileText className="w-5 h-5 text-slate-600" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-800 text-sm">Choose a Document Starter</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
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
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-left transition-all group"
            >
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-indigo-200 transition-colors">
                {getCategoryIcon(tmpl.category)}
              </div>
              <div>
                <h4 className="font-medium text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {tmpl.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
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
