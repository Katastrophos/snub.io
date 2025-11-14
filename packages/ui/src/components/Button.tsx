import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-mono uppercase tracking-wider transition-all duration-300 border-2'

  const variantStyles = {
    primary: 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-void-black hover:shadow-lg hover:shadow-neon-cyan/50',
    secondary: 'border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-void-black hover:shadow-lg hover:shadow-neon-purple/50',
    ghost: 'border-void-gray text-gray-400 hover:border-gray-300 hover:text-gray-100',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
