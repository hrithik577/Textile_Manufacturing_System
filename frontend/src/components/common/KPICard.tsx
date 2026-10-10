import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendGood?: boolean; // If trend 'up' is good or bad
  subtitle?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger' | 'success';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  change,
  trend,
  trendGood = true,
  subtitle,
  icon,
  variant = 'default',
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-slate-400';
    if (trend === 'up') return trendGood ? 'text-emerald-400' : 'text-rose-400';
    if (trend === 'down') return trendGood ? 'text-rose-400' : 'text-emerald-400';
    return 'text-slate-400';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const borderAccents = {
    default: 'border-slate-800 hover:border-slate-700',
    accent: 'border-teal-500/40 hover:border-teal-500/60 bg-teal-950/10',
    warning: 'border-amber-500/40 hover:border-amber-500/60 bg-amber-950/10',
    danger: 'border-rose-500/40 hover:border-rose-500/60 bg-rose-950/10',
    success: 'border-emerald-500/40 hover:border-emerald-500/60 bg-emerald-950/10',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative overflow-hidden rounded-xl bg-slate-900/90 border p-5 transition-all duration-200 shadow-sm',
        borderAccents[variant],
        isClickable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-bold font-display text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800/80 p-2.5 text-slate-300 border border-slate-700/60">
          {icon}
        </div>
      </div>

      {(change || subtitle) && (
        <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800 text-xs">
          {change && (
            <div className={clsx('flex items-center gap-1 font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{change}</span>
            </div>
          )}
          {subtitle && (
            <span className="text-slate-400 truncate max-w-[200px]" title={subtitle}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
