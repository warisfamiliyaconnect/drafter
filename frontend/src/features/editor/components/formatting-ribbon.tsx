'use client'

import React, { useState } from 'react'
import {
  Undo,
  Redo,
  Printer,
  SpellCheck,
  PaintBucket,
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
  ChevronDown,
  Minus,
  Plus,
  IndentDecrease,
  IndentIncrease,
  RemoveFormatting,
} from 'lucide-react'

export function FormattingRibbon() {
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontSize, setFontSize] = useState('11')
  const [blockType, setBlockType] = useState('Normal text')
  const [zoomLevel, setZoomLevel] = useState('100')

  const fontOptions = ['Arial', 'Times New Roman', 'Georgia', 'Roboto', 'Courier New', 'Verdana', 'Comic Sans MS']
  const sizeOptions = ['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36', '48', '72']
  const blockOptions = ['Normal text', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']
  const zoomOptions = ['50', '75', '90', '100', '125', '150', '200']

  const getEditor = () => {
    if (typeof window !== 'undefined') {
      return (window as any).__superdocInstance
    }
    return null
  }

  const handleCommand = (action: string, param?: any) => {
    const editor = getEditor()
    if (!editor) return
    try {
      if (typeof editor.formatText === 'function') {
        editor.formatText({ [action]: param ?? true })
      } else if (typeof editor.execCommand === 'function') {
        editor.execCommand(action, param)
      }
    } catch (e) {
      console.warn('Ribbon command execution:', action, e)
    }
  }

  const ToolButton = ({
    onClick,
    title,
    children,
    className = '',
  }: {
    onClick: () => void
    title: string
    children: React.ReactNode
    className?: string
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded hover:bg-black/[0.06] active:bg-black/[0.10] transition-colors text-[#444746] ${className}`}
    >
      {children}
    </button>
  )

  const Sep = () => <div className="w-px h-5 bg-[#c4c7c5] mx-0.5 shrink-0" />

  return (
    <div className="h-10 bg-[#edf2fa] border-b border-[#c4c7c5] px-2 flex items-center gap-0.5 overflow-x-auto select-none">
      {/* Undo / Redo */}
      <ToolButton onClick={() => handleCommand('undo')} title="Undo (Ctrl+Z)">
        <Undo className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('redo')} title="Redo (Ctrl+Y)">
        <Redo className="w-[18px] h-[18px]" />
      </ToolButton>

      <Sep />

      {/* Print */}
      <ToolButton onClick={() => window.print()} title="Print (Ctrl+P)">
        <Printer className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Spell check */}
      <ToolButton onClick={() => handleCommand('spellcheck')} title="Spelling and grammar check">
        <SpellCheck className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Paint format */}
      <ToolButton onClick={() => handleCommand('paintFormat')} title="Paint format">
        <PaintBucket className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Zoom */}
      <div className="relative ml-1">
        <select
          value={zoomLevel}
          onChange={(e) => setZoomLevel(e.target.value)}
          className="text-[13px] h-7 px-2 pr-5 rounded bg-transparent hover:bg-black/[0.06] font-normal text-[#444746] border-none focus:outline-none cursor-pointer"
        >
          {zoomOptions.map((z) => (
            <option key={z} value={z}>{z}%</option>
          ))}
        </select>
      </div>

      <Sep />

      {/* Block Type Dropdown */}
      <div className="relative">
        <select
          value={blockType}
          onChange={(e) => {
            setBlockType(e.target.value)
            handleCommand('blockType', e.target.value)
          }}
          className="text-[13px] h-7 px-2 pr-6 rounded bg-transparent hover:bg-black/[0.06] font-normal text-[#444746] border border-[#c4c7c5] focus:outline-none cursor-pointer w-[120px]"
        >
          {blockOptions.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      <Sep />

      {/* Font Family */}
      <div className="relative">
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value)
            handleCommand('fontFamily', e.target.value)
          }}
          className="text-[13px] h-7 px-2 pr-6 rounded bg-transparent hover:bg-black/[0.06] font-normal text-[#444746] border border-[#c4c7c5] focus:outline-none cursor-pointer w-[120px]"
        >
          {fontOptions.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </div>

      <Sep />

      {/* Font Size with ± */}
      <ToolButton onClick={() => {
        const newSize = Math.max(1, parseInt(fontSize) - 1).toString()
        setFontSize(newSize)
        handleCommand('fontSize', newSize)
      }} title="Decrease font size">
        <Minus className="w-[14px] h-[14px]" />
      </ToolButton>

      <input
        type="text"
        value={fontSize}
        onChange={(e) => {
          setFontSize(e.target.value)
          handleCommand('fontSize', e.target.value)
        }}
        className="w-8 h-7 text-center text-[13px] rounded border border-[#c4c7c5] bg-transparent text-[#444746] focus:outline-none focus:border-[#1a73e8]"
      />

      <ToolButton onClick={() => {
        const newSize = Math.min(400, parseInt(fontSize) + 1).toString()
        setFontSize(newSize)
        handleCommand('fontSize', newSize)
      }} title="Increase font size">
        <Plus className="w-[14px] h-[14px]" />
      </ToolButton>

      <Sep />

      {/* Bold, Italic, Underline, Strikethrough */}
      <ToolButton onClick={() => handleCommand('bold')} title="Bold (Ctrl+B)">
        <Bold className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('italic')} title="Italic (Ctrl+I)">
        <Italic className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('underline')} title="Underline (Ctrl+U)">
        <Underline className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Text color indicator */}
      <ToolButton onClick={() => handleCommand('textColor')} title="Text color">
        <div className="flex flex-col items-center">
          <span className="text-[15px] font-bold leading-none text-[#444746]">A</span>
          <div className="w-4 h-1 bg-[#202124] rounded-sm -mt-0.5" />
        </div>
      </ToolButton>

      {/* Highlight color */}
      <ToolButton onClick={() => handleCommand('highlight')} title="Highlight color">
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 18 18" className="w-[18px] h-[18px]">
            <path d="M3 14h12v2H3z" fill="#fbbc04" />
            <path d="M10 2L4 12h3l1.5-3h3L13 12h3L10 2z" fill="#444746" />
          </svg>
        </div>
      </ToolButton>

      <Sep />

      {/* Link */}
      <ToolButton onClick={() => handleCommand('link')} title="Insert link (Ctrl+K)">
        <Link className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Comment */}
      <ToolButton onClick={() => handleCommand('comment')} title="Add comment (Ctrl+Alt+M)">
        <MessageSquare className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Image */}
      <ToolButton onClick={() => handleCommand('image')} title="Insert image">
        <Image className="w-[18px] h-[18px]" />
      </ToolButton>

      <Sep />

      {/* Alignment */}
      <ToolButton onClick={() => handleCommand('align', 'left')} title="Left align">
        <AlignLeft className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('align', 'center')} title="Center align">
        <AlignCenter className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('align', 'right')} title="Right align">
        <AlignRight className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('align', 'justify')} title="Justify">
        <AlignJustify className="w-[18px] h-[18px]" />
      </ToolButton>

      <Sep />

      {/* Lists */}
      <ToolButton onClick={() => handleCommand('bulletList')} title="Bulleted list">
        <List className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('orderedList')} title="Numbered list">
        <ListOrdered className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Checklist */}
      <ToolButton onClick={() => handleCommand('checklist')} title="Checklist">
        <CheckSquare className="w-[18px] h-[18px]" />
      </ToolButton>

      <Sep />

      {/* Indent */}
      <ToolButton onClick={() => handleCommand('outdent')} title="Decrease indent">
        <IndentDecrease className="w-[18px] h-[18px]" />
      </ToolButton>
      <ToolButton onClick={() => handleCommand('indent')} title="Increase indent">
        <IndentIncrease className="w-[18px] h-[18px]" />
      </ToolButton>

      <Sep />

      {/* Table */}
      <ToolButton onClick={() => {
        const editor = getEditor()
        if (editor && typeof editor.insertTable === 'function') {
          editor.insertTable({ rows: 3, cols: 3 })
        }
      }} title="Insert table">
        <TableIcon className="w-[18px] h-[18px]" />
      </ToolButton>

      {/* Clear formatting */}
      <ToolButton onClick={() => handleCommand('clearFormatting')} title="Clear formatting">
        <RemoveFormatting className="w-[18px] h-[18px]" />
      </ToolButton>
    </div>
  )
}
