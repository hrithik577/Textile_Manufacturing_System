import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'slate' | 'teal' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'blue';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  className,
  dot = false,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    slate: 'bg-slate-800 text-slate-300 border border-slate-700',
    teal: 'bg-teal-950/80 text-teal-300 border border-teal-800/80',
    emerald: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80',
    amber: 'bg-amber-950/80 text-amber-300 border border-amber-800/80',
    rose: 'bg-rose-950/80 text-rose-300 border border-rose-800/80',
    indigo: 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/80',
    purple: 'bg-purple-950/80 text-purple-300 border border-purple-800/80',
    blue: 'bg-blue-950/80 text-blue-300 border border-blue-800/80',
  };

  const dotColors = {
    slate: 'bg-slate-400',
    teal: 'bg-teal-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    indigo: 'bg-indigo-400',
    purple: 'bg-purple-400',
    blue: 'bg-blue-400',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-md tracking-wide',
          sizeStyles[size],
          variantStyles[variant],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
};
