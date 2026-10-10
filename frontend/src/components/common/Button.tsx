import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-mono uppercase tracking-wider text-xs font-bold rounded-none transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none border';

  const sizeStyles = {
    sm: 'text-[10px] px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-4 py-2 gap-2',
    lg: 'text-sm px-6 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-[var(--color-vermilion)] hover:bg-[var(--color-ink)] text-white border-[var(--color-vermilion)] shadow-none',
    secondary: 'bg-[var(--color-ink)] hover:bg-[var(--color-vermilion)] text-white border-[var(--color-ink)] shadow-none',
    outline: 'bg-white hover:bg-[var(--color-paper)] text-[var(--color-ink)] border-[var(--color-ink)] shadow-none',
    danger: 'bg-[var(--color-vermilion)] hover:bg-black text-white border-[var(--color-vermilion)] shadow-none',
    success: 'bg-[#1a7a4a] hover:bg-black text-white border-[#1a7a4a] shadow-none',
    ghost: 'bg-transparent hover:bg-black/5 text-[var(--color-ink)] border-transparent shadow-none',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};
