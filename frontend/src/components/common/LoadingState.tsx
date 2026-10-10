import React from 'react';
import { RefreshCw } from 'lucide-react';

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
