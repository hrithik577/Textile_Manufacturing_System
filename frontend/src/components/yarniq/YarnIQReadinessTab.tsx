import React, { useState, useEffect } from 'react';
import {
 Cpu,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 Clock,
 Sparkles,
 ArrowRight,
 ShieldCheck,
 ShieldAlert,
 Calendar,
 Layers,
 HelpCircle,
 Play,
 RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
 YarnSpecification,
 ProductionReadinessRequest,
 ProductionReadinessResponse,
} from '../../types/yarniq';
import { yarniqService } from '../../services/yarniq';
import { useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

interface YarnIQReadinessTabProps {
 specifications: YarnSpecification[];
 onNavigateTab: (tab: string) => void;
}

export const YarnIQReadinessTab: React.FC<YarnIQReadinessTabProps> = ({
 specifications,
 onNavigateTab,
}) => {
 const { addToast } = useApp();
 const [loading, setLoading] = useState(false);
 const [result, setResult] = useState<ProductionReadinessResponse | null>(null);

 // Form Inputs
 const [selectedPreset, setSelectedPreset] = useState<'ready' | 'at_risk' | 'blocked' | 'custom'>('blocked');
 const [orderNumber, setOrderNumber] = useState('PO-PROD-2026-03');
 const [customerName, setCustomerName] = useState('Patagonia Outdoor Corp');
 const [selectedSpecId, setSelectedSpecId] = useState<number>(specifications[1]?.id || 2);
 const [targetMeters, setTargetMeters] = useState<number>(8000);
 const [gsm, setGsm] = useState<number>(220);
 const [widthInches, setWidthInches] = useState<number>(58);
 const [wastageRate, setWastageRate] = useState<number>(0.05); // 5%
 const [plannedStartDate, setPlannedStartDate] = useState(
 new Date(Date.now() + 86400000).toISOString().split('T')[0]
 );
 const [productionDeadline, setProductionDeadline] = useState(
 new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
 );

 // Load preset scenarios
 const applyPreset = (preset: 'ready' | 'at_risk' | 'blocked' | 'custom') => {
 setSelectedPreset(preset);
 if (preset === 'ready') {
 setOrderNumber('PO-PROD-2026-01');
 setCustomerName('Nordic Apparel Group');
 const ecru = specifications.find((s) => s.sku.includes('30S-ECR')) || specifications[0];
 if (ecru) setSelectedSpecId(ecru.id);
 setTargetMeters(10000);
 setGsm(180);
 setWidthInches(60);
 setWastageRate(0.04);
 } else if (preset === 'at_risk') {
 setOrderNumber('PO-PROD-2026-02');
 setCustomerName('Zara Inditex Sourcing');
 const red = specifications.find((s) => s.sku.includes('50D-RED')) || specifications[3] || specifications[0];
 if (red) setSelectedSpecId(red.id);
 setTargetMeters(15000);
 setGsm(120);
 setWidthInches(58);
 setWastageRate(0.04);
 } else if (preset === 'blocked') {
 setOrderNumber('PO-PROD-2026-03');
 setCustomerName('Patagonia Outdoor Corp');
 const nvy = specifications.find((s) => s.sku.includes('40S-NVY')) || specifications[1] || specifications[0];
 if (nvy) setSelectedSpecId(nvy.id);
 setTargetMeters(8000);
 setGsm(220);
 setWidthInches(58);
 setWastageRate(0.05);
 }
 };

 const runEvaluation = async () => {
 setLoading(true);
 try {
 const payload: ProductionReadinessRequest = {
 order_number: orderNumber,
 customer_name: customerName,
 planned_start_date: plannedStartDate,
 production_deadline: productionDeadline,
 requirements: [
 {
 specification_id: selectedSpecId,
 finished_meters: targetMeters,
 gsm: gsm,
 width_inches: widthInches,
 wastage_rate: wastageRate,
 },
 ],
 };

 const res = await yarniqService.checkProductionReadiness(payload);
 setResult(res.data);
 } catch (err: any) {
 console.error(err);
 addToast({ type: 'danger', title: 'Evaluation Error', message: err.message || 'Readiness engine failed.' });
 } finally {
 setLoading(false);
 }
 };

 // Run initial evaluation on load
 useEffect(() => {
 runEvaluation();
 }, [selectedPreset]);

 return (
 <div className="space-y-6">
 {/* ─── SCENARIO SELECTION BUTTONS ───────────────────────────────────────── */}
 <div className="p-4 bg-white border editorial-border space-y-3">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-sm font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 <Cpu className="w-4 h-4 text-[var(--color-ink)]" />
 Production Readiness Engine — Signature Evaluation Suite
 </h2>
 <p className="text-xs text-[var(--color-industrial-grey)] mt-0.5">
 Deterministic mathematical material readiness. Evaluates approved physical stock minus hard reservations vs required yarn demand.
 </p>
 </div>
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[var(--color-ink)] border editorial-border">
 ASTM 4-Point Gating Active
 </span>
 </div>

 {/* 1-Click Scenario Preset Buttons */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t editorial-border">
 <button
 onClick={() => applyPreset('ready')}
 className={clsx(
 'p-2.5 border text-left transition-all',
 selectedPreset === 'ready'
 ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
 : 'bg-white editorial-border hover:editorial-border text-[var(--color-ink)]'
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Scenario 1</span>
 <span className="w-2 h-2 bg-emerald-400" />
 </div>
 <span className="text-xs font-bold block mt-1">Nordic Single Jersey</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">Status: READY (100% Stocked)</span>
 </button>

 <button
 onClick={() => applyPreset('at_risk')}
 className={clsx(
 'p-2.5 border text-left transition-all',
 selectedPreset === 'at_risk'
 ? 'bg-amber-950/60 border-amber-500 text-amber-200'
 : 'bg-white editorial-border hover:editorial-border text-[var(--color-ink)]'
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Scenario 2</span>
 <span className="w-2 h-2 bg-amber-400" />
 </div>
 <span className="text-xs font-bold block mt-1">Zara Crimson Poly</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">Status: AT RISK (PO in Transit)</span>
 </button>

 <button
 onClick={() => applyPreset('blocked')}
 className={clsx(
 'p-2.5 border text-left transition-all',
 selectedPreset === 'blocked'
 ? 'bg-rose-950/60 border-rose-500 text-rose-200'
 : 'bg-white editorial-border hover:editorial-border text-[var(--color-ink)]'
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">Scenario 3</span>
 <span className="w-2 h-2 bg-rose-400" />
 </div>
 <span className="text-xs font-bold block mt-1">Patagonia Navy Oxford</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">Status: BLOCKED (450kg Shortage)</span>
 </button>

 <button
 onClick={() => applyPreset('custom')}
 className={clsx(
 'p-2.5 border text-left transition-all',
 selectedPreset === 'custom'
 ? 'bg-[var(--color-paper)] editorial-border text-[var(--color-ink)]'
 : 'bg-white editorial-border hover:editorial-border text-[var(--color-ink)]'
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase text-[var(--color-ink)] font-bold">What-If Lab</span>
 <span className="w-2 h-2 bg-indigo-400" />
 </div>
 <span className="text-xs font-bold block mt-1">Custom Simulator</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">Custom meters & GSM conversion</span>
 </button>
 </div>
 </div>

 {/* ─── CUSTOM SIMULATOR INPUT DRAWER (IF CUSTOM OR EDITED) ──────────────── */}
 <div className="p-4 bg-white border editorial-border grid grid-cols-2 sm:grid-cols-6 gap-3">
 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-1">Order #</label>
 <input
 type="text"
 value={orderNumber}
 onChange={(e) => setOrderNumber(e.target.value)}
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-1">Target Meters</label>
 <input
 type="number"
 value={targetMeters}
 onChange={(e) => setTargetMeters(parseFloat(e.target.value) || 0)}
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-1">Fabric GSM</label>
 <input
 type="number"
 value={gsm}
 onChange={(e) => setGsm(parseFloat(e.target.value) || 0)}
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-1">Width (Inches)</label>
 <input
 type="number"
 value={widthInches}
 onChange={(e) => setWidthInches(parseFloat(e.target.value) || 0)}
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-1">Wastage %</label>
 <input
 type="number"
 step="0.01"
 value={wastageRate}
 onChange={(e) => setWastageRate(parseFloat(e.target.value) || 0)}
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div className="flex items-end">
 <Button
 type="button"
 variant="primary"
 size="sm"
 onClick={runEvaluation}
 disabled={loading}
 className="w-full"
 leftIcon={<Play className="w-3 h-3" />}
 >
 {loading ? 'Evaluating...' : 'Recalculate'}
 </Button>
 </div>
 </div>

 {/* ─── DETERMINISTIC CALCULATION VERDICT BANNER ────────────────────────── */}
 {result && (
 <div
 className={clsx(
 'p-5 border transition-all space-y-4',
 result.status === 'READY' && 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/20',
 result.status === 'AT_RISK' && 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/20',
 result.status === 'BLOCKED' && 'bg-rose-950/40 border-rose-500/80 ring-1 ring-rose-500/20'
 )}
 >
 {/* Header Status & Score */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b editorial-border">
 <div className="flex items-center gap-3">
 <div
 className={clsx(
 'w-12 h-12 flex items-center justify-center shrink-0 border ',
 result.status === 'READY' && 'bg-emerald-500/20 border-emerald-500 text-emerald-400',
 result.status === 'AT_RISK' && 'bg-amber-500/20 border-amber-500 text-amber-400',
 result.status === 'BLOCKED' && 'bg-rose-500/20 border-rose-500 text-rose-400'
 )}
 >
 {result.status === 'READY' && <CheckCircle2 className="w-6 h-6" />}
 {result.status === 'AT_RISK' && <AlertTriangle className="w-6 h-6" />}
 {result.status === 'BLOCKED' && <XCircle className="w-6 h-6" />}
 </div>

 <div>
 <div className="flex items-center gap-2">
 <span
 className={clsx(
 'text-lg font-bold font-display uppercase tracking-wider',
 result.status === 'READY' && 'text-emerald-400',
 result.status === 'AT_RISK' && 'text-amber-400',
 result.status === 'BLOCKED' && 'text-rose-400'
 )}
 >
 STATUS: {result.status.replace('_', ' ')}
 </span>
 <span className="text-xs font-mono px-2 py-0.5 rounded bg-white text-[var(--color-ink)] border editorial-border">
 Fulfillment Score: {result.overall_score_percent}%
 </span>
 </div>
 <p className="text-xs text-[var(--color-ink)] mt-1">{result.summary_verdict}</p>
 </div>
 </div>

 {/* Recommended Action Pill */}
 {result.recommended_action && (
 <div className="p-2.5 bg-white border editorial-border text-xs sm:max-w-xs shrink-0">
 <span className="text-[10px] font-mono uppercase text-[var(--color-ink)] block font-bold">
 Recommended Manager Action:
 </span>
 <span className="text-[var(--color-ink)] block mt-0.5">{result.recommended_action}</span>
 </div>
 )}
 </div>

 {/* Key Metrics Row */}
 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
 <div className="p-2.5 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[10px]">TOTAL REQUIRED YARN</span>
 <span className="text-[var(--color-ink)] font-bold text-sm">{result.total_required_kg.toLocaleString()} kg</span>
 </div>

 <div className="p-2.5 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[10px]">ELIGIBLE AVAILABLE</span>
 <span className="text-[var(--color-ink)] font-bold text-sm">
 {result.total_available_kg.toLocaleString()} kg
 </span>
 </div>

 <div className="p-2.5 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[10px]">NET SHORTAGE DEFICIT</span>
 <span
 className={clsx(
 'font-bold text-sm',
 result.total_shortage_kg > 0 ? 'text-rose-400' : 'text-emerald-400'
 )}
 >
 {result.total_shortage_kg > 0 ? `-${result.total_shortage_kg.toLocaleString()} kg` : '0.0 kg'}
 </span>
 </div>

 <div className="p-2.5 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[10px]">EARLIEST FEASIBLE START</span>
 <span className="text-[var(--color-ink)] font-bold text-sm">
 {result.earliest_feasible_start_date || 'Immediate'}
 </span>
 </div>

 <div className="p-2.5 bg-white border editorial-border">
 <span className="text-[var(--color-industrial-grey)] block text-[10px]">QUARANTINE BLOCKER?</span>
 <span
 className={clsx(
 'font-bold text-sm',
 result.has_quarantine_blocker ? 'text-amber-400' : 'text-[var(--color-industrial-grey)]'
 )}
 >
 {result.has_quarantine_blocker ? 'YES (Lots Held)' : 'None'}
 </span>
 </div>
 </div>

 {/* ─── MATERIAL-BY-MATERIAL BREAKDOWN TABLE ───────────────────────────── */}
 <div className="border editorial-border bg-white overflow-hidden">
 <div className="p-2.5 bg-white border-b editorial-border text-xs font-mono font-bold text-[var(--color-ink)] uppercase">
 Material Specification Fulfillment Breakdown
 </div>
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs font-sans">
 <thead className="bg-white text-[var(--color-industrial-grey)] font-mono text-[10px] uppercase border-b editorial-border">
 <tr>
 <th className="px-3 py-2.5">Yarn SKU & Type</th>
 <th className="px-3 py-2.5">Color Shade</th>
 <th className="px-3 py-2.5 text-right font-mono">Required (kg)</th>
 <th className="px-3 py-2.5 text-right font-mono">Physical (kg)</th>
 <th className="px-3 py-2.5 text-right font-mono">Reserved (kg)</th>
 <th className="px-3 py-2.5 text-right font-mono">Available (kg)</th>
 <th className="px-3 py-2.5 text-right font-mono">Shortage (kg)</th>
 <th className="px-3 py-2.5">Deterministic Reason & Evidence</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/80">
 {result.material_breakdowns.map((mb, idx) => (
 <tr key={idx} className="hover:bg-white">
 <td className="px-3 py-3">
 <span className="font-mono font-bold text-[var(--color-ink)] block">{mb.sku}</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)]">{mb.yarn_count} ({mb.fibre_composition})</span>
 </td>

 <td className="px-3 py-3">
 <div className="flex items-center gap-1.5">
 <span
 className="w-3 h-3 border editorial-border shrink-0"
 style={{ backgroundColor: mb.color_code }}
 />
 <span className="text-[var(--color-ink)] text-xs">{mb.color_name}</span>
 </div>
 </td>

 <td className="px-3 py-3 text-right font-mono font-semibold text-[var(--color-ink)]">
 {mb.required_yarn_kg.toLocaleString()}
 </td>

 <td className="px-3 py-3 text-right font-mono text-[var(--color-ink)]">
 {mb.eligible_physical_stock_kg.toLocaleString()}
 </td>

 <td className="px-3 py-3 text-right font-mono text-[var(--color-ink)]">
 {mb.existing_reservations_kg.toLocaleString()}
 </td>

 <td className="px-3 py-3 text-right font-mono font-bold text-[var(--color-ink)]">
 {mb.available_yarn_kg.toLocaleString()}
 </td>

 <td className="px-3 py-3 text-right font-mono font-bold">
 {mb.shortage_kg > 0 ? (
 <span className="text-rose-400">-{mb.shortage_kg.toLocaleString()}</span>
 ) : (
 <span className="text-emerald-400">0.0</span>
 )}
 </td>

 <td className="px-3 py-3 text-xs text-[var(--color-ink)] max-w-sm">
 <p className="leading-relaxed">{mb.reason}</p>
 {mb.incoming_po_number && (
 <span className="mt-1 inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-paper)] text-[var(--color-ink)] border editorial-border">
 Linked: {mb.incoming_po_number} (ETA {mb.incoming_po_date})
 </span>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Data Sources and Assumptions */}
 <div className="p-3 bg-white border editorial-border text-[11px] text-[var(--color-industrial-grey)] space-y-1">
 <span className="font-mono uppercase text-[var(--color-ink)] font-bold block text-[10px]">
 Audit Trail & Calculation Assumptions:
 </span>
 {result.data_sources_and_assumptions.map((ass, i) => (
 <p key={i} className="font-mono text-[10px]">
 • {ass}
 </p>
 ))}
 </div>
 </div>
 )}
 </div>
 );
};
