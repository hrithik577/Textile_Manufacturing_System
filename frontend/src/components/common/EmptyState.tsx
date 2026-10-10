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
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl bg-slate-900/60 border border-slate-800 border-dashed">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400 mb-4">
        {icon || <PackageOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-semibold text-white font-display">{title}</h3>
      <p className="mt-1 text-xs text-slate-400 max-w-sm">{description}</p>
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
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin" />
        <RefreshCw className="w-5 h-5 text-teal-400 absolute" />
      </div>
      <p className="text-sm font-medium text-slate-300 font-display">{message}</p>
      <span className="text-xs text-slate-500">Everest Manufacturing Telemetry Pipeline</span>
    </div>
  );
};
