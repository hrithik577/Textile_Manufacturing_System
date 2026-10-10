import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          className={clsx(
            'w-screen bg-[var(--color-paper)] border-l-2 border-[var(--color-ink)] shadow-2xl flex flex-col h-full text-[var(--color-ink)] z-10 animate-in slide-in-from-right duration-200 rounded-none',
            widthStyles[width]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-[var(--color-ink)] text-white">
            <div className="min-w-0 pr-4">
              <h2 className="text-xs font-black font-mono tracking-widest uppercase text-white truncate">{title}</h2>
              {subtitle && <p className="mt-0.5 text-[10px] font-mono tracking-wider text-white/50 uppercase truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1 text-white/60 hover:text-white transition-colors focus:outline-none shrink-0"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white text-[var(--color-ink)]">{children}</div>
        </div>
      </div>
    </div>
  );
};
