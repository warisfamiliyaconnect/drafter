'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface DropdownOption {
  value: string
  label: string
  previewStyle?: React.CSSProperties
}

interface ToolbarDropdownProps {
  value: string
  options: (string | DropdownOption)[]
  onChange: (value: string) => void
  placeholder?: string
  widthClass?: string
  align?: 'left' | 'right'
}

export function ToolbarDropdown({
  value,
  options,
  onChange,
  placeholder,
  widthClass = 'w-auto',
  align = 'left',
}: ToolbarDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedOptions: DropdownOption[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

  const selectedOption = normalizedOptions.find((opt) => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : placeholder || value

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative inline-block text-left select-none">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-1.5 h-8 px-2.5 rounded-lg text-[13px] font-medium text-[#1d1b20] hover:bg-[#f0f4f9] active:bg-[#e3e8ef] transition-colors focus:outline-none ${widthClass}`}
        aria-expanded={isOpen}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#79747e] shrink-0" />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 bg-white rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12),0_0_1px_rgba(0,0,0,0.08)] border border-[#e0e2ec] p-1 z-50 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          } min-w-[140px]`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs rounded-lg text-left transition-colors ${
                  isSelected
                    ? 'bg-[#d3e3fd] text-[#041e49] font-semibold'
                    : 'text-[#1d1b20] hover:bg-[#f0f4f9]'
                }`}
                style={opt.previewStyle}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0b57d0] shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
