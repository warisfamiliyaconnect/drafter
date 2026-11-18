'use client'

import React, { useState } from 'react'
import {
  Calendar,
  Lightbulb,
  CheckSquare,
  User,
  MapPin,
  Plus,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { useEditorStore } from '@/store/use-editor-store'

export function RightSidebarStrip() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const toggleAiConsole = useEditorStore((s) => s.toggleAiConsole)

  const sidebarIcons = [
    { icon: Sparkles, label: 'AI Copilot', color: '#a855f7', onClick: toggleAiConsole },
    { icon: Calendar, label: 'Calendar', color: '#0b57d0' },
    { icon: Lightbulb, label: 'Keep Notes', color: '#f9ab00' },
    { icon: CheckSquare, label: 'Tasks', color: '#0b57d0' },
    { icon: User, label: 'Contacts', color: '#0b57d0' },
    { icon: MapPin, label: 'Maps', color: '#d93025' },
  ]

  if (isCollapsed) {
    return (
      <div className="w-4 bg-transparent hover:bg-black/[0.04] flex items-center justify-center transition-colors relative group select-none shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute right-1 p-1 rounded-full bg-white shadow-md border border-[#e0e2ec] opacity-0 group-hover:opacity-100 transition-opacity"
          title="Show side panel"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-[#49454f]" />
        </button>
      </div>
    )
  }

  return (
    <aside className="w-11 bg-white border-l border-[#e0e2ec]/60 flex flex-col items-center py-2.5 gap-1.5 select-none shrink-0 z-10 transition-all duration-200">
      {sidebarIcons.map(({ icon: Icon, label, color, onClick }) => (
        <button
          key={label}
          onClick={onClick}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f4f9] active:bg-[#e9eef6] transition-colors"
          title={label}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </button>
      ))}

      <div className="h-px bg-[#e0e2ec] w-5 my-1" />

      {/* Add-ons */}
      <button
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f4f9] transition-colors"
        title="Get add-ons"
      >
        <Plus className="w-4 h-4 text-[#49454f]" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse arrow */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#f0f4f9] text-[#79747e] hover:text-[#1d1b20] transition-colors"
        title="Hide side panel"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </aside>
  )
}
