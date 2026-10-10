import React from 'react';
import { Badge } from './Badge';
import { MachineStatus, OrderStatus, RescueSeverity, QualityDecision, StockStatus } from '../../types';

interface StatusBadgeProps {
  status: MachineStatus | OrderStatus | RescueSeverity | QualityDecision | StockStatus | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', className }) => {
  switch (status) {
    // Machine Statuses
    case 'running':
      return <Badge variant="emerald" dot size={size} className={className}>Running</Badge>;
    case 'idle':
      return <Badge variant="amber" dot size={size} className={className}>Idle</Badge>;
    case 'setup':
      return <Badge variant="blue" dot size={size} className={className}>Setup</Badge>;
    case 'breakdown':
      return <Badge variant="rose" dot size={size} className={className}>Breakdown</Badge>;
    case 'maintenance':
      return <Badge variant="purple" dot size={size} className={className}>Maintenance</Badge>;

    // Order Statuses
    case 'in_production':
      return <Badge variant="teal" dot size={size} className={className}>In Production</Badge>;
    case 'at_risk':
      return <Badge variant="rose" dot size={size} className={className}>At Risk</Badge>;
    case 'quality_hold':
      return <Badge variant="amber" dot size={size} className={className}>Quality Hold</Badge>;
    case 'ready_to_dispatch':
      return <Badge variant="emerald" dot size={size} className={className}>Ready to Dispatch</Badge>;
    case 'partially_dispatched':
      return <Badge variant="indigo" dot size={size} className={className}>Partially Dispatched</Badge>;
    case 'completed':
      return <Badge variant="emerald" size={size} className={className}>Completed</Badge>;
    case 'draft':
      return <Badge variant="slate" size={size} className={className}>Draft</Badge>;
    case 'cancelled':
      return <Badge variant="rose" size={size} className={className}>Cancelled</Badge>;

    // Quality Decisions
    case 'pass':
      return <Badge variant="emerald" size={size} className={className}>PASS (Grade A)</Badge>;
    case 'rework':
      return <Badge variant="amber" size={size} className={className}>REWORK</Badge>;
    case 'hold':
      return <Badge variant="rose" size={size} className={className}>HOLD</Badge>;
    case 'reject':
      return <Badge variant="rose" size={size} className={className}>REJECTED</Badge>;

    // Rescue Severity
    case 'critical':
      return <Badge variant="rose" dot size={size} className={className}>CRITICAL</Badge>;
    case 'high':
      return <Badge variant="amber" dot size={size} className={className}>HIGH RISK</Badge>;
    case 'medium':
      return <Badge variant="blue" dot size={size} className={className}>MEDIUM</Badge>;

    // Stock Status
    case 'in_stock':
      return <Badge variant="emerald" size={size} className={className}>In Stock</Badge>;
    case 'low_stock':
      return <Badge variant="amber" size={size} className={className}>Low Stock</Badge>;
    case 'critical_stock':
      return <Badge variant="rose" dot size={size} className={className}>Critical Low</Badge>;
    case 'depleted':
      return <Badge variant="rose" size={size} className={className}>Depleted</Badge>;

    default:
      return (
        <Badge variant="slate" size={size} className={className}>
          {String(status).replace(/_/g, ' ').toUpperCase()}
        </Badge>
      );
  }
};
