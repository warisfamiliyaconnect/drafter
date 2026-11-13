'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'subtle'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer'

    const variants = {
      default: 'bg-[#1a73e8] text-white hover:bg-[#1765cc] shadow-sm active:bg-[#185abc]',
      outline: 'border border-[#dadce0] bg-white hover:bg-[#f1f3f4] text-[#3c4043] shadow-xs active:bg-[#e8eaed]',
      secondary: 'bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed] active:bg-[#dadce0]',
      ghost: 'hover:bg-black/[0.04] text-[#5f6368] hover:text-[#202124] active:bg-black/[0.08]',
      subtle: 'bg-[#e8f0fe] text-[#1a73e8] hover:bg-[#d2e3fc] active:bg-[#c5d9f7]',
    }

    const sizes = {
      sm: 'h-7 px-2.5 text-xs rounded-md gap-1.5',
      md: 'h-8 px-3 text-sm rounded-md gap-2',
      lg: 'h-10 px-4 text-sm rounded-md gap-2.5',
      icon: 'h-7 w-7 rounded-full p-0 flex items-center justify-center',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
