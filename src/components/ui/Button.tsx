'use client'

import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className, variant = 'primary', size = 'md', loading, children, disabled, ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'w-full rounded-2xl font-bold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-white text-black hover:bg-white/90': variant === 'primary',
          'bg-[#1a1a1a] text-white border border-white/10 hover:border-white/20': variant === 'secondary',
          'bg-transparent text-white/55 hover:text-white': variant === 'ghost',
          'bg-red-500/10 text-red-400 border border-red-500/20': variant === 'danger',
          'px-4 py-2.5 text-sm': size === 'sm',
          'px-5 py-4 text-base': size === 'md',
          'px-6 py-[18px] text-[17px]': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
})

Button.displayName = 'Button'
export { Button }
