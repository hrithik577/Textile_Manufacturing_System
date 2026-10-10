import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
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

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={clsx(
          'relative w-full rounded-none bg-white editorial-border shadow-2xl transition-all z-10 my-8 text-[var(--color-ink)] overflow-hidden',
          maxWidthStyles[maxWidth]
        )}
      >
        <div className="flex items-center justify-between p-4 bg-[var(--color-ink)] text-white">
          <div className="min-w-0 pr-4">
            <h3 className="text-xs font-black font-mono tracking-widest uppercase text-white truncate">{title}</h3>
            {subtitle && <p className="mt-0.5 text-[10px] font-mono tracking-wider text-white/50 uppercase truncate">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-white/60 hover:text-white transition-colors focus:outline-none shrink-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 bg-[var(--color-paper)] max-h-[75vh] overflow-y-auto text-[var(--color-ink)]">{children}</div>
      </div>
    </div>
  );
};
