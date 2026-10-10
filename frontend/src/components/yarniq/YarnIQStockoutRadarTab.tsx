import React, { useState } from 'react';
import {
 Radar,
 AlertTriangle,
 Clock,
 TrendingDown,
 Calendar,
 CheckCircle2,
 ArrowRight,
 ShieldAlert,
} from 'lucide-react';
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
} from 'recharts';
import { StockoutRadarItem } from '../../types/yarniq';
import { clsx } from 'clsx';

interface YarnIQStockoutRadarTabProps {
 radarItems: StockoutRadarItem[];
 onNavigateTab: (tab: string) => void;
}

export const YarnIQStockoutRadarTab: React.FC<YarnIQStockoutRadarTabProps> = ({
 radarItems,
 onNavigateTab,
}) => {
 const [selectedSpecId, setSelectedSpecId] = useState<number>(
 radarItems[1]?.specification_id || radarItems[0]?.specification_id || 1
 );
 const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'healthy'>('all');

 const filteredItems = radarItems.filter(
 (item) => severityFilter === 'all' || item.severity === severityFilter
 );

 const selectedItem =
 radarItems.find((item) => item.specification_id === selectedSpecId) || radarItems[0];

 return (
 <div className="space-y-6">
 {/* Header Banner */}
 <div className="p-4 bg-white border editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-base font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 <Radar className="w-5 h-5 text-[var(--color-ink)]" />
 Stockout Radar — Forward Inventory Timeline & Risk Horizon
 </h2>
 <p className="text-xs text-[var(--color-industrial-grey)] mt-1">
 Deterministic 14-day stock burn projection accounting for scheduled production orders, hard reservations, safety buffers, and confirmed incoming POs.
 </p>
 </div>

 {/* Severity Filter Pills */}
 <div className="flex items-center gap-1.5">
 {(['all', 'critical', 'warning', 'healthy'] as const).map((sev) => (
 <button
 key={sev}
 onClick={() => setSeverityFilter(sev)}
 className={clsx(
 'px-2.5 py-1 text-xs font-mono uppercase transition-colors',
 severityFilter === sev
 ? 'bg-[var(--color-paper)] text-[var(--color-ink)] font-bold'
 : 'bg-white text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)] border editorial-border'
 )}
 >
 {sev}
 </button>
 ))}
 </div>
 </div>

 {/* Main Grid: Left Items Selector, Right Interactive Projection Chart */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Left Col: Specification Risk Cards */}
 <div className="space-y-2.5">
 <span className="text-xs font-mono uppercase text-[var(--color-industrial-grey)] font-bold block mb-1">
 Yarn Specification Risk Ledger
 </span>

 {filteredItems.map((item) => {
 const isSelected = item.specification_id === selectedSpecId;
 const isCritical = item.severity === 'critical';
 const isWarning = item.severity === 'warning';

 return (
 <button
 key={item.specification_id}
 onClick={() => setSelectedSpecId(item.specification_id)}
 className={clsx(
 'w-full p-3.5 border text-left transition-all',
 isSelected
 ? 'bg-white editorial-border ring-1 ring-indigo-500/30'
 : 'bg-white editorial-border hover:editorial-border'
 )}
 >
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <span
 className="w-3.5 h-3.5 border editorial-border shrink-0"
 style={{ backgroundColor: item.color_code }}
 />
 <span className="font-mono font-bold text-xs text-[var(--color-ink)]">{item.sku}</span>
 </div>
 <span
 className={clsx(
 'px-2 py-0.5 rounded text-[10px] font-mono uppercase border',
 isCritical && 'bg-rose-950 text-rose-300 border-rose-800',
 isWarning && 'bg-amber-950 text-amber-300 border-amber-800',
 item.severity === 'healthy' && 'bg-emerald-950 text-emerald-300 border-emerald-800'
 )}
 >
 {item.severity}
 </span>
 </div>

 <div className="mt-2 text-xs">
 <span className="text-[var(--color-ink)] font-medium block">{item.yarn_name}</span>
 <div className="flex justify-between items-center text-[11px] text-[var(--color-industrial-grey)] font-mono mt-1 pt-1.5 border-t editorial-border">
 <span>Available: {item.current_available_kg.toLocaleString()} kg</span>
 <span>Supply: {item.days_of_supply_remaining} Days</span>
 </div>
 </div>

 {item.earliest_shortage_date && (
 <div className="mt-2 p-1.5 rounded bg-rose-950/40 border border-rose-900/60 text-[10px] font-mono text-rose-300 flex items-center justify-between">
 <span>Stockout Date: {item.earliest_shortage_date}</span>
 <span className="font-bold">Shortage: -{item.estimated_shortage_kg} kg</span>
 </div>
 )}
 </button>
 );
 })}
 </div>

 {/* Right 2 Cols: Interactive Trajectory Graph & Affected Orders */}
 {selectedItem && (
 <div className="lg:col-span-2 space-y-4">
 <div className="p-5 bg-white border editorial-border space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b editorial-border">
 <div>
 <div className="flex items-center gap-2">
 <span
 className="w-4 h-4 border editorial-border"
 style={{ backgroundColor: selectedItem.color_code }}
 />
 <h3 className="text-sm font-bold font-display text-[var(--color-ink)]">
 {selectedItem.yarn_name} ({selectedItem.yarn_count})
 </h3>
 </div>
 <span className="text-xs font-mono text-[var(--color-industrial-grey)] mt-0.5 block">
 SKU: {selectedItem.sku} | Color: {selectedItem.color_name}
 </span>
 </div>

 <div className="flex items-center gap-2">
 <div className="text-right">
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] block uppercase">
 Safety Stock Threshold
 </span>
 <span className="text-xs font-mono font-bold text-amber-400">
 {selectedItem.safety_stock_kg} kg
 </span>
 </div>
 </div>
 </div>

 {/* 14-Day Trajectory Recharts Line Chart */}
 <div className="h-64 w-full">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={selectedItem.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
 <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
 <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
 <Tooltip
 contentStyle={{
 backgroundColor: '#0f172a',
 borderColor: '#334155',
 borderRadius: '0.75rem',
 fontSize: '12px',
 }}
 />
 <ReferenceLine
 y={selectedItem.safety_stock_kg}
 stroke="#f59e0b"
 strokeDasharray="4 4"
 label={{ value: 'Safety Buffer', fill: '#f59e0b', fontSize: 10 }}
 />
 <Line
 type="monotone"
 dataKey="projected_stock_kg"
 name="Projected Stock (kg)"
 stroke="#6366f1"
 strokeWidth={2.5}
 dot={{ r: 3, fill: '#6366f1' }}
 activeDot={{ r: 6 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>

 {/* Affected Orders and Corrective Proposal */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t editorial-border">
 <div className="p-3 bg-white border editorial-border text-xs">
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] block font-bold mb-1">
 Orders Affected by Projected Shortage
 </span>
 {selectedItem.affected_order_numbers.length > 0 ? (
 <div className="space-y-1">
 {selectedItem.affected_order_numbers.map((on, i) => (
 <div key={i} className="flex items-center justify-between font-mono text-rose-300">
 <span>{on}</span>
 <span className="text-[10px] text-rose-400 font-bold">AT RISK</span>
 </div>
 ))}
 </div>
 ) : (
 <span className="text-emerald-400 font-mono">No active orders affected.</span>
 )}
 </div>

 <div className="p-3 bg-white border editorial-border text-xs flex flex-col justify-between">
 <div>
 <span className="text-[10px] font-mono uppercase text-[var(--color-ink)] block font-bold mb-1">
 Actionable Remediation
 </span>
 <p className="text-[var(--color-ink)] text-[11px] leading-relaxed">
 {selectedItem.severity === 'critical'
 ? 'Shortage breaches safety stock. Expedite delivery of incoming replenishment PO or trigger emergency spot reorder.'
 : 'Stock is currently above minimum safety threshold. Monitor daily burn.'}
 </p>
 </div>
 {selectedItem.severity === 'critical' && (
 <button
 onClick={() => onNavigateTab('recommendations')}
 className="mt-2 text-xs px-2.5 py-1 rounded bg-[var(--color-paper)] text-[var(--color-ink)] border editorial-border hover:bg-[var(--color-paper)] font-mono inline-flex items-center gap-1 self-start"
 >
 View Corrective Plan <ArrowRight className="w-3 h-3" />
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
