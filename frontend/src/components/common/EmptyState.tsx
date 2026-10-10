import React from 'react';
import { PackageOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white editorial-border text-[var(--color-ink)]">
      <div className="flex items-center justify-center w-12 h-12 bg-[var(--color-paper)] editorial-border text-[var(--color-ink)] mb-4">
        {icon || <PackageOpen className="w-6 h-6 text-[var(--color-vermilion)]" />}
      </div>
      <h3 className="text-sm font-bold font-mono uppercase tracking-widest text-[var(--color-ink)]">{title}</h3>
      <p className="mt-1 text-xs font-mono text-[var(--color-industrial-grey)] max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} className="mt-5">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Fetching telemetry and records...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-3 bg-[var(--color-paper)]">
      <div className="relative flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[var(--color-ink)] border-t-[var(--color-vermilion)] animate-spin" />
      </div>
      <p className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-ink)]">{message}</p>
      <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase">Everest Mill Telemetry Stream</span>
    </div>
  );
};
