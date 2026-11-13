'use client'

import React from 'react'
import {
  Calendar,
  Lightbulb,
  CheckSquare,
  User,
  MapPin,
  Plus,
  ChevronRight,
} from 'lucide-react'

export function RightSidebarStrip() {
  const sidebarIcons = [
    { icon: Calendar, label: 'Calendar', color: '#4285f4' },
    { icon: Lightbulb, label: 'Keep', color: '#fbbc04' },
    { icon: CheckSquare, label: 'Tasks', color: '#1a73e8' },
    { icon: User, label: 'Contacts', color: '#1a73e8' },
    { icon: MapPin, label: 'Maps', color: '#ea4335' },
  ]

  return (
    <div className="w-[48px] bg-white border-l border-[#dadce0] flex flex-col items-center py-2 gap-1 select-none shrink-0">
      {sidebarIcons.map(({ icon: Icon, label, color }) => (
        <button
          key={label}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f1f3f4] transition-colors"
          title={label}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </button>
      ))}

      <div className="h-px bg-[#dadce0] w-6 my-1" />

      {/* Get add-ons */}
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f1f3f4] transition-colors"
        title="Get add-ons"
      >
        <Plus className="w-5 h-5 text-[#5f6368]" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Collapse arrow */}
      <button
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#f1f3f4] transition-colors"
        title="Show side panel"
      >
        <ChevronRight className="w-5 h-5 text-[#5f6368]" />
      </button>
    </div>
  )
}
