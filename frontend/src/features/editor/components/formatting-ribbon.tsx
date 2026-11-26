'use client'

import React, { useState } from 'react'
import {
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  MessageSquare,
  Image,
  Table as TableIcon,
  Minus,
  Plus,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
} from 'lucide-react'
import { ToolbarDropdown } from './toolbar-dropdown'
import { executeCommand } from '@/lib/superdoc-bridge'

export function FormattingRibbon() {
  const [fontFamily, setFontFamily] = useState('Inter')
  const [fontSize, setFontSize] = useState('11')
  const [blockType, setBlockType] = useState('Normal text')
  const [activeFormats, setActiveFormats] = useState<{ [key: string]: boolean }>({})

  const fontOptions = [
    { value: 'Inter', label: 'Inter', previewStyle: { fontFamily: 'Inter, sans-serif' } },
    { value: 'Arial', label: 'Arial', previewStyle: { fontFamily: 'Arial, sans-serif' } },
    { value: 'Roboto', label: 'Roboto', previewStyle: { fontFamily: 'Roboto, sans-serif' } },
    { value: 'Times New Roman', label: 'Times New Roman', previewStyle: { fontFamily: 'Times New Roman, serif' } },
    { value: 'Georgia', label: 'Georgia', previewStyle: { fontFamily: 'Georgia, serif' } },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', previewStyle: { fontFamily: 'monospace' } },
  ]

  const blockOptions = [
    { value: 'Normal text', label: 'Normal text' },
    { value: 'Title', label: 'Title', previewStyle: { fontWeight: 700, fontSize: '15px' } },
    { value: 'Subtitle', label: 'Subtitle', previewStyle: { fontWeight: 500, fontSize: '13px', color: '#49454f' } },
    { value: 'Heading 1', label: 'Heading 1', previewStyle: { fontWeight: 600, fontSize: '14px' } },
    { value: 'Heading 2', label: 'Heading 2', previewStyle: { fontWeight: 600, fontSize: '13px' } },
    { value: 'Heading 3', label: 'Heading 3', previewStyle: { fontWeight: 600, fontSize: '12px' } },
  ]

  const getEditor = () => {
    if (typeof window !== 'undefined') {
      return (window as any).__superdocInstance
    }
    return null
  }

  const handleCommand = (action: string, param?: any) => {
    // Track local toggle state for visual feedback
    if (['bold', 'italic', 'underline'].includes(action)) {
      setActiveFormats((prev) => ({ ...prev, [action]: !prev[action] }))
    }

    executeCommand(action, param)
  }

  const ToolButton = ({
    onClick,
    title,
    children,
    isActive = false,
  }: {
    onClick: () => void
    title: string
    children: React.ReactNode
    isActive?: boolean
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-150 ${
        isActive
          ? 'bg-[#c2e7ff] text-[#001d35] shadow-xs'
          : 'text-[#444746] hover:bg-[#f0f4f9] hover:text-[#1d1b20] active:scale-95'
      }`}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-4 bg-[#e0e2ec] mx-1 shrink-0" />

  return (
    <div className="w-full flex justify-start py-2 px-4 z-20 pointer-events-none select-none">
      {/* 2026 Material 3 Floating Pill Toolbar */}
      <div className="pointer-events-auto bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.08),0_0_1px_rgba(0,0,0,0.12)] border border-[#e0e2ec]/60 px-3 h-10 flex items-center gap-0.5 overflow-x-auto max-w-full">
        {/* Undo / Redo */}
        <ToolButton onClick={() => handleCommand('undo')} title="Undo (Ctrl+Z)">
          <Undo className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('redo')} title="Redo (Ctrl+Y)">
          <Redo className="w-4 h-4" />
        </ToolButton>

        <Sep />

        {/* Block Type Dropdown */}
        <ToolbarDropdown
          value={blockType}
          options={blockOptions}
          onChange={(newVal) => {
            setBlockType(newVal)
            handleCommand('blockType', newVal)
          }}
          widthClass="w-[116px]"
        />

        <Sep />

        {/* Font Family Dropdown */}
        <ToolbarDropdown
          value={fontFamily}
          options={fontOptions}
          onChange={(newVal) => {
            setFontFamily(newVal)
            handleCommand('fontFamily', newVal)
          }}
          widthClass="w-[110px]"
        />

        <Sep />

        {/* Font Size with − / + Steppers */}
        <div className="flex items-center gap-0.5 px-0.5">
          <button
            type="button"
            onClick={() => {
              const newSize = Math.max(1, parseInt(fontSize) - 1).toString()
              setFontSize(newSize)
              handleCommand('fontSize', newSize)
            }}
            title="Decrease font size"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#444746] hover:bg-[#f0f4f9] active:scale-95 transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            type="text"
            value={fontSize}
            onChange={(e) => {
              setFontSize(e.target.value)
              handleCommand('fontSize', e.target.value)
            }}
            className="w-7 h-6 text-center text-xs font-medium rounded bg-transparent text-[#1d1b20] focus:outline-none focus:bg-[#f0f4f9]"
          />

          <button
            type="button"
            onClick={() => {
              const newSize = Math.min(400, parseInt(fontSize) + 1).toString()
              setFontSize(newSize)
              handleCommand('fontSize', newSize)
            }}
            title="Increase font size"
            className="w-6 h-6 rounded-full flex items-center justify-center text-[#444746] hover:bg-[#f0f4f9] active:scale-95 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <Sep />

        {/* Bold, Italic, Underline */}
        <ToolButton
          onClick={() => handleCommand('bold')}
          title="Bold (Ctrl+B)"
          isActive={activeFormats.bold}
        >
          <Bold className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => handleCommand('italic')}
          title="Italic (Ctrl+I)"
          isActive={activeFormats.italic}
        >
          <Italic className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          onClick={() => handleCommand('underline')}
          title="Underline (Ctrl+U)"
          isActive={activeFormats.underline}
        >
          <Underline className="w-4 h-4" />
        </ToolButton>

        {/* Text color */}
        <ToolButton onClick={() => handleCommand('textColor')} title="Text color">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold leading-none text-[#1d1b20]">A</span>
            <div className="w-3.5 h-1 bg-[#1d1b20] rounded-full mt-0.5" />
          </div>
        </ToolButton>

        {/* Highlight color */}
        <ToolButton onClick={() => handleCommand('highlight')} title="Highlight color">
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5">
              <path d="M2 13h12v1.5H2z" fill="#fbbc04" />
              <path d="M9 2L3.5 11h2.5l1.5-2.5h3L12 11h2.5L9 2z" fill="#444746" />
            </svg>
          </div>
        </ToolButton>

        <Sep />

        {/* Link, Comment, Image */}
        <ToolButton onClick={() => handleCommand('link')} title="Insert link (Ctrl+K)">
          <Link className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('comment')} title="Add comment">
          <MessageSquare className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('image')} title="Insert image">
          <Image className="w-4 h-4" />
        </ToolButton>

        <Sep />

        {/* Alignments */}
        <ToolButton onClick={() => handleCommand('align', 'left')} title="Left align">
          <AlignLeft className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('align', 'center')} title="Center align">
          <AlignCenter className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('align', 'right')} title="Right align">
          <AlignRight className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('align', 'justify')} title="Justify">
          <AlignJustify className="w-4 h-4" />
        </ToolButton>

        <Sep />

        {/* Lists */}
        <ToolButton onClick={() => handleCommand('bulletList')} title="Bulleted list">
          <List className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('orderedList')} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('checklist')} title="Checklist">
          <CheckSquare className="w-4 h-4" />
        </ToolButton>

        <Sep />

        {/* Indent / Outdent */}
        <ToolButton onClick={() => handleCommand('outdent')} title="Decrease indent">
          <IndentDecrease className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={() => handleCommand('indent')} title="Increase indent">
          <IndentIncrease className="w-4 h-4" />
        </ToolButton>

        {/* Table */}
        <ToolButton
          onClick={() => {
            const editor = getEditor()
            if (editor && typeof editor.insertTable === 'function') {
              editor.insertTable({ rows: 3, cols: 3 })
            }
          }}
          title="Insert table"
        >
          <TableIcon className="w-4 h-4" />
        </ToolButton>

        {/* Clear formatting */}
        <ToolButton onClick={() => handleCommand('clearFormatting')} title="Clear formatting">
          <RemoveFormatting className="w-4 h-4" />
        </ToolButton>
      </div>
    </div>
  )
}
