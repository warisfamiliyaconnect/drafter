'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'subtle' | 'ai'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0b57d0]/25 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer'

    const variants = {
      default: 'bg-[#0b57d0] text-white hover:bg-[#0842a0] shadow-sm active:bg-[#06337a] active:scale-[0.98]',
      outline: 'border border-[#e0e2ec] bg-white hover:bg-[#f0f4f9] text-[#1d1b20] active:bg-[#e9eef6]',
      secondary: 'bg-[#f0f4f9] text-[#1d1b20] hover:bg-[#e3e8ef] active:bg-[#d5dbe4]',
      ghost: 'hover:bg-black/[0.04] text-[#49454f] hover:text-[#1d1b20] active:bg-black/[0.08]',
      subtle: 'bg-[#d3e3fd] text-[#041e49] hover:bg-[#c2e7ff] active:bg-[#b2dcfe]',
      ai: 'bg-gradient-to-r from-[#a855f7] to-[#6366f1] text-white hover:opacity-95 shadow-[0_2px_12px_rgba(168,85,247,0.3)] active:scale-[0.98]',
    }

    const sizes = {
      sm: 'h-7 px-3 text-xs rounded-lg gap-1.5',
      md: 'h-8 px-3.5 text-sm rounded-lg gap-2',
      lg: 'h-10 px-5 text-sm rounded-xl gap-2.5',
      icon: 'h-8 w-8 rounded-full p-0 flex items-center justify-center',
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
