import React, { useState, useEffect } from 'react';
import {
 FileText,
 Search,
 Truck,
 Package,
 Calendar,
 Layers,
 ShieldCheck,
 ShieldAlert,
 ArrowRight,
 GitCommit,
 Clock,
 ExternalLink,
} from 'lucide-react';
import { YarnLot } from '../../types/yarniq';
import { yarniqService } from '../../services/yarniq';
import { clsx } from 'clsx';

interface YarnIQTraceabilityTabProps {
 lots: YarnLot[];
 selectedLotCode?: string;
 onNavigateTab: (tab: string) => void;
}

export const YarnIQTraceabilityTab: React.FC<YarnIQTraceabilityTabProps> = ({
 lots,
 selectedLotCode,
 onNavigateTab,
}) => {
 const [currentLotCode, setCurrentLotCode] = useState<string>(
 selectedLotCode || lots[0]?.lot_number || 'LOT-2026-Y881'
 );
 const [traceData, setTraceData] = useState<any>(null);
 const [loading, setLoading] = useState(false);

 const fetchTraceability = async (code: string) => {
 setLoading(true);
 try {
 const res = await yarniqService.getTraceability(code);
 setTraceData(res.data);
 } catch (err: any) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 if (selectedLotCode) {
 setCurrentLotCode(selectedLotCode);
 fetchTraceability(selectedLotCode);
 } else if (lots.length > 0) {
 fetchTraceability(lots[0].lot_number);
 }
 }, [selectedLotCode, lots]);

 return (
 <div className="space-y-6">
 {/* Top Selector Bar */}
 <div className="p-4 bg-white border editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-base font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 <FileText className="w-5 h-5 text-[var(--color-ink)]" />
 Yarn DNA — End-to-End Lot Traceability & Audit History
 </h2>
 <p className="text-xs text-[var(--color-industrial-grey)] mt-1">
 Complete backward lineage to supplier challans and forward lineage to production orders with an immutable chronological ledger.
 </p>
 </div>

 {/* Lot Selector */}
 <div className="flex items-center gap-2">
 <label className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase">Select Lot:</label>
 <select
 value={currentLotCode}
 onChange={(e) => {
 setCurrentLotCode(e.target.value);
 fetchTraceability(e.target.value);
 }}
 className="px-3 py-1.5 text-xs bg-white border editorial-border text-[var(--color-ink)] font-mono focus:outline-none focus:editorial-border"
 >
 {lots.map((l) => (
 <option key={l.id} value={l.lot_number}>
 {l.lot_number} — {l.sku} ({l.quality_status.toUpperCase()})
 </option>
 ))}
 </select>
 </div>
 </div>

 {traceData && (
 <div className="space-y-6">
 {/* Lot Overview Badge Header */}
 <div className="p-5 bg-white border editorial-border ">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b editorial-border">
 <div className="flex items-center gap-3">
 <span
 className="w-8 h-8 border editorial-border shrink-0 "
 style={{ backgroundColor: traceData.color_code }}
 />
 <div>
 <div className="flex items-center gap-2">
 <span className="text-lg font-bold font-mono text-[var(--color-ink)]">
 {traceData.lot_number}
 </span>
 <span
 className={clsx(
 'text-[10px] font-mono px-2 py-0.5 rounded border uppercase',
 traceData.backward_lineage.quality_status === 'APPROVED' &&
 'bg-emerald-950 text-emerald-300 border-emerald-800',
 traceData.backward_lineage.quality_status === 'QUARANTINED' &&
 'bg-amber-950 text-amber-300 border-amber-800 font-bold'
 )}
 >
 {traceData.backward_lineage.quality_status}
 </span>
 </div>
 <span className="text-xs text-[var(--color-industrial-grey)] font-sans block mt-0.5">
 {traceData.yarn_name} ({traceData.yarn_count}) | SKU: {traceData.sku}
 </span>
 </div>
 </div>

 {/* Stock Balances Row */}
 <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
 <div className="p-2 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[9px]">PHYSICAL</span>
 <span className="text-[var(--color-ink)] font-bold">{traceData.current_physical_kg} kg</span>
 </div>
 <div className="p-2 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[9px]">RESERVED</span>
 <span className="text-[var(--color-ink)] font-bold">{traceData.current_reserved_kg} kg</span>
 </div>
 <div className="p-2 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[9px]">USABLE</span>
 <span className="text-[var(--color-ink)] font-bold">{traceData.current_available_kg} kg</span>
 </div>
 <div className="p-2 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[9px]">QUARANTINED</span>
 <span className="text-amber-400 font-bold">{traceData.current_quarantined_kg} kg</span>
 </div>
 </div>
 </div>

 {/* ─── DUAL LINEAGE: BACKWARD & FORWARD ─────────────────────────────── */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
 {/* Backward Lineage (Supplier & Gate Inward) */}
 <div className="p-4 bg-white border editorial-border space-y-3">
 <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)] font-bold flex items-center gap-2">
 <Truck className="w-4 h-4" />
 Backward Lineage (Origin & Gate Inward)
 </h3>
 <div className="space-y-1.5 text-xs">
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Supplier Name:</span>
 <span className="text-[var(--color-ink)] font-semibold">
 {traceData.backward_lineage.supplier_name}
 </span>
 </div>
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Supplier Batch Lot #:</span>
 <span className="text-[var(--color-ink)] font-mono">
 {traceData.backward_lineage.supplier_lot_number}
 </span>
 </div>
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Purchase Order #:</span>
 <span className="text-[var(--color-ink)] font-mono">
 {traceData.backward_lineage.purchase_order}
 </span>
 </div>
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Goods Receipt Pass:</span>
 <span className="text-[var(--color-ink)] font-mono">
 {traceData.backward_lineage.goods_receipt_number}
 </span>
 </div>
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Delivery Challan #:</span>
 <span className="text-[var(--color-ink)] font-mono">
 {traceData.backward_lineage.challan_number}
 </span>
 </div>
 <div className="flex justify-between py-1 border-b border-slate-900">
 <span className="text-[var(--color-industrial-grey)]">Received Net Weight:</span>
 <span className="text-[var(--color-ink)] font-mono font-bold">
 {traceData.backward_lineage.net_weight_kg} kg
 </span>
 </div>
 <div className="flex justify-between py-1">
 <span className="text-[var(--color-industrial-grey)]">Storage Location:</span>
 <span className="text-[var(--color-ink)] font-mono">
 {traceData.backward_lineage.storage_location}
 </span>
 </div>
 </div>
 </div>

 {/* Forward Lineage (Orders Consuming This Lot) */}
 <div className="p-4 bg-white border editorial-border space-y-3">
 <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)] font-bold flex items-center gap-2">
 <Package className="w-4 h-4" />
 Forward Lineage (Production Order Allocations)
 </h3>
 {traceData.forward_lineage.length > 0 ? (
 <div className="space-y-2">
 {traceData.forward_lineage.map((f: any, i: number) => (
 <div
 key={i}
 className="p-2.5 bg-white border editorial-border flex items-center justify-between text-xs"
 >
 <div>
 <span className="font-mono font-bold text-[var(--color-ink)] block">
 {f.production_order_number}
 </span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] font-mono">
 Ref: {f.reservation_number} | Allocated {f.date}
 </span>
 </div>
 <div className="text-right">
 <span className="font-mono font-bold text-[var(--color-ink)] block">
 {f.quantity_allocated_kg} kg
 </span>
 <span className="text-[9px] font-mono text-[var(--color-ink)] uppercase">
 {f.status}
 </span>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="p-4 text-center text-[var(--color-industrial-grey)] text-xs">
 No active production orders currently allocated to this lot. Stock is unreserved.
 </div>
 )}
 </div>
 </div>
 </div>

 {/* ─── CHRONOLOGICAL AUDIT TIMELINE ───────────────────────────────── */}
 <div className="p-5 bg-white border editorial-border space-y-4">
 <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--color-ink)] font-bold flex items-center gap-2">
 <Clock className="w-4 h-4 text-[var(--color-industrial-grey)]" />
 Chronological Audit Trail & Immutable Ledger Events
 </h3>

 <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white">
 {traceData.audit_timeline.map((event: any, idx: number) => (
 <div key={idx} className="relative">
 {/* Dot */}
 <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 bg-teal-400 ring-4 ring-slate-900" />
 <div className="p-3 bg-white border editorial-border text-xs space-y-1">
 <div className="flex items-center justify-between">
 <span className="font-mono font-bold text-[var(--color-ink)] uppercase">
 {event.event_type.replace('_', ' ')}
 </span>
 <span className="text-[11px] font-mono text-[var(--color-industrial-grey)]">{event.timestamp}</span>
 </div>
 <p className="text-[var(--color-ink)]">{event.notes}</p>
 <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-industrial-grey)] pt-1 border-t border-slate-900">
 <span>Ref: {event.reference}</span>
 <span>
 Delta: {event.quantity_kg} kg | Post Balance: {event.balance_after_kg} kg
 </span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
