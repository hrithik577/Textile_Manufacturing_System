import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendGood?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
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
  variant = 'default',
  onClick,
}) => {
  const isClickable = Boolean(onClick);

  const borderAccents = {
    default: 'editorial-border bg-white',
    accent: 'editorial-border bg-[var(--color-paper)]',
    warning: 'editorial-border bg-amber-50',
    danger: 'editorial-border bg-rose-50 border-[var(--color-vermilion)]',
    success: 'editorial-border bg-emerald-50',
  };

  const titleColors = {
    default: 'text-[var(--color-ink)]',
    accent: 'text-[var(--color-ink)]',
    warning: 'text-amber-900',
    danger: 'text-[var(--color-vermilion)]',
    success: 'text-[var(--color-success-green)]',
  };

  const getTrendColor = () => {
    if (!trend || trend === 'neutral') return 'text-[var(--color-industrial-grey)]';
    if (trend === 'up') return trendGood ? 'text-[var(--color-success-green)]' : 'text-[var(--color-vermilion)]';
    if (trend === 'down') return trendGood ? 'text-[var(--color-vermilion)]' : 'text-[var(--color-success-green)]';
    return 'text-[var(--color-industrial-grey)]';
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-5 flex flex-col justify-between transition-colors min-h-[140px]',
        borderAccents[variant],
        isClickable && 'cursor-pointer hover:bg-black/5'
      )}
    >
      <div>
        <h3 className={clsx("editorial-label mb-2", titleColors[variant])}>{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-ink)] uppercase">
            {value}
          </span>
          {unit && <span className="font-mono text-xs uppercase text-[var(--color-industrial-grey)]">{unit}</span>}
        </div>
      </div>
      
      {(change || subtitle) && (
        <div className="mt-6 pt-3 border-t border-[var(--color-light-border)] flex justify-between items-end text-xs font-sans">
          {change && <span className={clsx("font-semibold", getTrendColor())}>{change}</span>}
          {subtitle && <span className="text-[var(--color-industrial-grey)] text-right leading-tight max-w-[60%]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

