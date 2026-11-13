'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Separator({
  className,
  orientation = 'horizontal',
  ...props
}: SeparatorProps) {
  return (
    <div
      role="separator"
      className={cn(
        'bg-[#dadce0] shrink-0',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-4 w-px',
        className
      )}
      {...props}
    />
  )
}
