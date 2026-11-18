'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral' | 'ai'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#d3e3fd] text-[#041e49] border-[#c2e7ff]',
    success: 'bg-[#c4eed0] text-[#146c2e] border-[#a8dab5]',
    warning: 'bg-[#fee3b8] text-[#8f4700] border-[#fdd192]',
    danger: 'bg-[#f9dedc] text-[#8c1d18] border-[#f2b8b5]',
    neutral: 'bg-[#f0f4f9] text-[#49454f] border-[#e0e2ec]',
    ai: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e9d5ff]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border select-none transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
