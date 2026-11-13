'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'neutral'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#e8f0fe] text-[#1a73e8] border-[#d2e3fc]',
    success: 'bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]',
    warning: 'bg-[#fef7e0] text-[#e37400] border-[#fde293]',
    danger: 'bg-[#fce8e6] text-[#d93025] border-[#f5c6c0]',
    neutral: 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
