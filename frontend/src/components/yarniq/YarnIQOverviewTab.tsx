import React from 'react';
import {
 Layers,
 ShieldAlert,
 AlertTriangle,
 Clock,
 CheckCircle2,
 Package,
 TrendingDown,
 ArrowUpRight,
 Truck,
 Flame,
 FileCheck2,
 Calendar,
 Sparkles,
} from 'lucide-react';
import {
 BarChart,
 Bar,
 PieChart,
 Pie,
 Cell,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
} from 'recharts';
import { YarnIQOverviewMetrics } from '../../types/yarniq';
import { clsx } from 'clsx';

interface YarnIQOverviewTabProps {
 metrics: YarnIQOverviewMetrics;
 onNavigateTab: (tab: string) => void;
}

export const YarnIQOverviewTab: React.FC<YarnIQOverviewTabProps> = ({
 metrics,
 onNavigateTab,
}) => {
 return (
 <div className="space-y-6">
 {/* ─── 1. TOP METRIC CARDS (CLICKABLE) ─────────────────────────────────── */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
 {/* Card 1: Total Usable Stock */}
 <button
 onClick={() => onNavigateTab('inventory')}
 className="p-3.5 bg-white border editorial-border hover:editorial-border text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">Usable Stock</span>
 <div className="p-1.5 bg-teal-500/10 text-[var(--color-ink)] border editorial-border group-hover:scale-110 transition-transform">
 <Layers className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-[var(--color-ink)] block mt-2">
 {metrics.total_usable_stock_kg.toLocaleString()}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">kg</span>
 </span>
 <span className="text-[10px] text-[var(--color-ink)] block mt-1">Cleared for production</span>
 </button>

 {/* Card 2: Reserved Stock */}
 <button
 onClick={() => onNavigateTab('inventory')}
 className="p-3.5 bg-white border editorial-border hover:editorial-border text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">Hard Reserved</span>
 <div className="p-1.5 bg-indigo-500/10 text-[var(--color-ink)] border editorial-border group-hover:scale-110 transition-transform">
 <Package className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-[var(--color-ink)] block mt-2">
 {metrics.total_reserved_stock_kg.toLocaleString()}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">kg</span>
 </span>
 <span className="text-[10px] text-[var(--color-ink)] block mt-1">Locked to active orders</span>
 </button>

 {/* Card 3: Quarantined Stock */}
 <button
 onClick={() => onNavigateTab('inventory')}
 className="p-3.5 bg-white border editorial-border hover:border-amber-500/50 text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">In Quarantine</span>
 <div className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
 <ShieldAlert className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-amber-400 block mt-2">
 {metrics.total_quarantined_stock_kg.toLocaleString()}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">kg</span>
 </span>
 <span className="text-[10px] text-amber-400 block mt-1">Excluded from usable pool</span>
 </button>

 {/* Card 4: PO Discrepancies */}
 <button
 onClick={() => onNavigateTab('smart-gate')}
 className="p-3.5 bg-white border editorial-border hover:border-rose-500/50 text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">PO Shortages</span>
 <div className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
 <TrendingDown className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-rose-400 block mt-2">
 {metrics.po_discrepancies_count}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">Receipts</span>
 </span>
 <span className="text-[10px] text-rose-400 block mt-1">Delivery vs PO mismatch</span>
 </button>

 {/* Card 5: Blocked Production Orders */}
 <button
 onClick={() => onNavigateTab('readiness')}
 className="p-3.5 bg-white border editorial-border hover:border-rose-500/50 text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">Blocked Orders</span>
 <div className="p-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-rose-400 block mt-2">
 {metrics.blocked_production_orders_count}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">Orders</span>
 </span>
 <span className="text-[10px] text-rose-400 block mt-1">Loom starvation risk</span>
 </button>

 {/* Card 6: At Risk Orders */}
 <button
 onClick={() => onNavigateTab('stockout-radar')}
 className="p-3.5 bg-white border editorial-border hover:border-amber-500/50 text-left transition-all group"
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">At-Risk Orders</span>
 <div className="p-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
 <Clock className="w-3.5 h-3.5" />
 </div>
 </div>
 <span className="text-xl font-bold font-display text-amber-300 block mt-2">
 {metrics.at_risk_orders_count}{' '}
 <span className="text-xs font-normal text-[var(--color-industrial-grey)] font-mono">Orders</span>
 </span>
 <span className="text-[10px] text-amber-400 block mt-1">Shipment dependency</span>
 </button>
 </div>

 {/* ─── 2. CRITICAL SHORTAGE ALERTS & ACTIONABLE JUMP LIST ───────────────── */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left 2 Cols: Alerts & Prioritized Actions */}
 <div className="lg:col-span-2 space-y-4">
 <div className="p-4 bg-white border editorial-border">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
 <Flame className="w-4 h-4 text-rose-400" />
 Active Material Shortage & Quality Alerts
 </h3>
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)]">Real-time DB Monitor</span>
 </div>
 <div className="space-y-2.5">
 {metrics.critical_alerts.map((al, idx) => (
 <div
 key={idx}
 className="p-3 bg-white border editorial-border flex items-start justify-between gap-3"
 >
 <div className="flex items-start gap-2.5">
 <div
 className={clsx(
 'p-1.5 shrink-0 mt-0.5',
 al.severity === 'danger'
 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
 : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
 )}
 >
 <AlertTriangle className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-xs font-semibold text-[var(--color-ink)]">{al.title}</h4>
 <p className="text-[11px] text-[var(--color-industrial-grey)] mt-0.5 leading-relaxed">{al.description}</p>
 </div>
 </div>
 <button
 onClick={() => onNavigateTab(al.link.includes('smart-gate') ? 'smart-gate' : 'inventory')}
 className="shrink-0 text-xs px-2.5 py-1 rounded bg-white hover:bg-white text-[var(--color-ink)] border editorial-border transition-colors font-mono flex items-center gap-1"
 >
 Resolve <ArrowUpRight className="w-3 h-3" />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* Prioritized Action Matrix */}
 <div className="p-4 bg-white border editorial-border">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-[var(--color-ink)]" />
 Prioritized Manager Action Queue
 </h3>
 <span className="text-[10px] font-mono text-[var(--color-ink)]">YarnIQ Recommendation Engine</span>
 </div>
 <div className="space-y-2">
 {metrics.prioritized_actions.map((act) => (
 <div
 key={act.id}
 className="p-3 bg-white border editorial-border hover:editorial-border flex items-center justify-between gap-3 transition-colors"
 >
 <div className="flex items-center gap-3">
 <span
 className={clsx(
 'px-2 py-0.5 rounded text-[10px] font-mono font-bold border',
 act.priority === 'P1' && 'bg-rose-950 text-rose-300 border-rose-800',
 act.priority === 'P2' && 'bg-amber-950 text-amber-300 border-amber-800',
 act.priority === 'P3' && 'bg-blue-950 text-blue-300 border-blue-800'
 )}
 >
 {act.priority}
 </span>
 <div>
 <h4 className="text-xs font-semibold text-[var(--color-ink)]">{act.title}</h4>
 <p className="text-[11px] text-[var(--color-industrial-grey)] mt-0.5">{act.action}</p>
 </div>
 </div>
 <button
 onClick={() => onNavigateTab('recommendations')}
 className="shrink-0 text-xs px-2.5 py-1 rounded bg-[var(--color-paper)] hover:bg-[var(--color-paper)] text-[var(--color-ink)] border editorial-border transition-colors font-mono"
 >
 Approve
 </button>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Right Col: Inventory Composition & Recent Gate Receipts */}
 <div className="space-y-4">
 {/* Stock by Fiber Composition */}
 <div className="p-4 bg-white border editorial-border">
 <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--color-ink)] mb-3">
 Usable Stock by Fiber Blend
 </h3>
 <div className="space-y-2.5">
 {metrics.stock_by_fiber.map((item, i) => {
 const total = metrics.total_usable_stock_kg || 1;
 const pct = Math.round((item.quantity_kg / total) * 100);
 return (
 <div key={i} className="space-y-1">
 <div className="flex justify-between text-xs">
 <span className="text-[var(--color-ink)] font-medium">{item.fiber}</span>
 <span className="text-[var(--color-industrial-grey)] font-mono">
 {item.quantity_kg.toLocaleString()} kg ({pct}%)
 </span>
 </div>
 <div className="h-2 bg-white overflow-hidden border editorial-border">
 <div
 className="h-full "
 style={{ width: `${pct}%` }}
 />
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Recent Goods Receipts */}
 <div className="p-4 bg-white border editorial-border">
 <div className="flex items-center justify-between mb-3">
 <h3 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--color-ink)] flex items-center gap-1.5">
 <Truck className="w-3.5 h-3.5 text-[var(--color-industrial-grey)]" />
 Recent Gate Receipts
 </h3>
 <button
 onClick={() => onNavigateTab('smart-gate')}
 className="text-[10px] text-[var(--color-ink)] hover:underline font-mono"
 >
 View All
 </button>
 </div>
 <div className="space-y-2">
 {metrics.recent_receipts.slice(0, 4).map((gr, i) => (
 <div
 key={i}
 className="p-2.5 bg-white border editorial-border flex items-center justify-between"
 >
 <div>
 <span className="text-xs font-mono font-semibold text-[var(--color-ink)] block">
 {gr.receipt_number}
 </span>
 <span className="text-[11px] text-[var(--color-industrial-grey)] block truncate max-w-[140px]">
 {gr.supplier_name}
 </span>
 </div>
 <div className="text-right">
 <span className="text-xs font-mono font-bold text-[var(--color-ink)] block">
 {gr.net_weight_kg.toLocaleString()} kg
 </span>
 {gr.has_discrepancy ? (
 <span className="text-[10px] font-mono text-rose-400">PO Shortfall</span>
 ) : (
 <span className="text-[10px] font-mono text-emerald-400">Verified</span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
