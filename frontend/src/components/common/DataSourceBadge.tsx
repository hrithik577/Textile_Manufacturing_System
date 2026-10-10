import React from 'react';
import { clsx } from 'clsx';
import { Radio, Database, Cpu } from 'lucide-react';
import { DataSource } from '../../types';

interface DataSourceBadgeProps {
  source: DataSource | 'SIMULATED' | 'LIVE';
  className?: string;
  size?: 'sm' | 'md';
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  className,
  size = 'sm',
}) => {
  const isSimulated = source === 'SIMULATED';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-mono font-medium rounded-md tracking-wider border',
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        isSimulated
          ? 'bg-amber-950/50 text-amber-300 border-amber-800/80 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
          : 'bg-emerald-950/50 text-emerald-300 border-emerald-800/80 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
        className
      )}
      title={
        isSimulated
          ? 'Virtual Factory Simulator data (Member 3 Simulator Engine)'
          : 'Live physical factory telemetry integration'
      }
    >
      {isSimulated ? (
        <>
          <Cpu className="w-3 h-3 text-amber-400 animate-pulse-subtle" />
          <span>SIMULATED</span>
        </>
      ) : (
        <>
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>LIVE TELEMETRY</span>
        </>
      )}
    </span>
  );
};
