import React, { useState } from 'react';
import {
 Truck,
 Plus,
 Trash2,
 AlertTriangle,
 CheckCircle2,
 FileText,
 Upload,
 Calendar,
 Layers,
 ArrowRight,
 ShieldCheck,
 ShieldAlert,
 FileCheck,
} from 'lucide-react';
import { Button } from '../common/Button';
import {
 YarnSpecification,
 YarnPurchaseOrder,
 GoodsReceipt,
 GoodsReceiptCreateInput,
 GoodsReceiptLineInput,
} from '../../types/yarniq';
import { yarniqService } from '../../services/yarniq';
import { useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

interface YarnIQSmartGateTabProps {
 specifications: YarnSpecification[];
 purchaseOrders: YarnPurchaseOrder[];
 receipts: GoodsReceipt[];
 onRefreshData: () => void;
}

export const YarnIQSmartGateTab: React.FC<YarnIQSmartGateTabProps> = ({
 specifications,
 purchaseOrders,
 receipts,
 onRefreshData,
}) => {
 const { addToast } = useApp();
 const [modalOpen, setModalOpen] = useState(false);
 const [submitting, setSubmitting] = useState(false);
 const [ocrActive, setOcrActive] = useState(false);

 // Form State
 const [supplierId, setSupplierId] = useState<number>(1);
 const [selectedPoId, setSelectedPoId] = useState<number | null>(null);
 const [challanNumber, setChallanNumber] = useState('');
 const [vehicleNumber, setVehicleNumber] = useState('');
 const [driverName, setDriverName] = useState('');
 const [notes, setNotes] = useState('');

 const [lines, setLines] = useState<GoodsReceiptLineInput[]>([
 {
 specification_id: specifications[0]?.id || 1,
 supplier_lot_number: 'SUP-LOT-8891',
 ordered_quantity_kg: 2000.0,
 gross_weight_kg: 2060.0,
 net_weight_kg: 2000.0,
 storage_location: 'Warehouse A - Bay 1',
 quality_status: 'approved',
 },
 ]);

 // When PO is chosen, auto-populate supplier & lines
 const handleSelectPO = (poIdStr: string) => {
 if (!poIdStr) {
 setSelectedPoId(null);
 return;
 }
 const poId = parseInt(poIdStr);
 setSelectedPoId(poId);
 const po = purchaseOrders.find((p) => p.id === poId);
 if (po) {
 setSupplierId(po.supplier_id);
 if (po.lines && po.lines.length > 0) {
 setLines(
 po.lines.map((l) => ({
 specification_id: l.specification_id,
 supplier_lot_number: `SUP-LOT-${po.po_number.split('-').pop()}`,
 ordered_quantity_kg: l.ordered_quantity_kg,
 gross_weight_kg: Math.round(l.ordered_quantity_kg * 1.03),
 net_weight_kg: l.ordered_quantity_kg,
 storage_location: 'Warehouse A - Bay 1',
 quality_status: 'approved',
 }))
 );
 }
 }
 };

 const handleAddLine = () => {
 setLines([
 ...lines,
 {
 specification_id: specifications[0]?.id || 1,
 supplier_lot_number: `SUP-LOT-${Date.now() % 10000}`,
 ordered_quantity_kg: 1000.0,
 gross_weight_kg: 1030.0,
 net_weight_kg: 1000.0,
 storage_location: 'Warehouse A - Bay 1',
 quality_status: 'approved',
 },
 ]);
 };

 const handleRemoveLine = (idx: number) => {
 if (lines.length <= 1) return;
 setLines(lines.filter((_, i) => i !== idx));
 };

 const handleLineChange = (idx: number, field: keyof GoodsReceiptLineInput, val: any) => {
 const updated = [...lines];
 updated[idx] = { ...updated[idx], [field]: val };
 setLines(updated);
 };

 // Simulate OCR extraction from paper challan
 const handleSimulateOCR = () => {
 setOcrActive(true);
 setTimeout(() => {
 setChallanNumber(`CH-OCR-${Math.floor(1000 + Math.random() * 9000)}`);
 setVehicleNumber('GJ-05-BX-9082');
 setDriverName('Sukhdev Singh');
 setNotes('OCR Document scan extracted: Tare 50kg, Moisture 7.4%. Discrepancy checked.');
 addToast({
 type: 'success',
 title: 'Challan OCR Extraction Complete',
 message: 'Delivery challan fields extracted with 98.4% optical confidence. Review and save.',
 });
 setOcrActive(false);
 }, 700);
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!challanNumber.trim()) {
 addToast({ type: 'danger', title: 'Validation Error', message: 'Delivery Challan Number is required.' });
 return;
 }

 setSubmitting(true);
 try {
 const payload: GoodsReceiptCreateInput = {
 supplier_id: supplierId,
 po_id: selectedPoId,
 challan_number: challanNumber,
 vehicle_number: vehicleNumber || 'GATE-TRUCK',
 driver_name: driverName || 'Driver',
 lines,
 notes,
 };

 const res = await yarniqService.createGoodsReceipt(payload);
 addToast({
 type: res.data.has_discrepancy ? 'warning' : 'success',
 title: res.data.has_discrepancy ? 'Goods Receipt Logged with Discrepancy' : 'Goods Receipt Verified',
 message: res.data.message || `Receipt ${res.data.receipt_number} saved to PostgreSQL ledger.`,
 });
 setModalOpen(false);
 onRefreshData();
 } catch (err: any) {
 addToast({
 type: 'danger',
 title: 'Receipt Failed',
 message: err.message || 'Error recording goods receipt.',
 });
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="space-y-6">
 {/* Top Banner and Inward Receipt Button */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white border editorial-border">
 <div>
 <h2 className="text-base font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 <Truck className="w-5 h-5 text-[var(--color-ink)]" />
 Smart Gate — Yarn Goods Receipt & Weighbridge Verification
 </h2>
 <p className="text-xs text-[var(--color-industrial-grey)] mt-1">
 Automatic PO matching, weighbridge gross/tare reconciliation, discrepancy tolerance checking, and instant traceable lot generation.
 </p>
 </div>

 <Button
 variant="primary"
 size="md"
 onClick={() => setModalOpen(true)}
 leftIcon={<Plus className="w-4 h-4" />}
 >
 Receive Yarn Delivery
 </Button>
 </div>

 {/* Historical Goods Receipts Table */}
 <div className="border editorial-border bg-white overflow-hidden ">
 <div className="p-3 bg-white border-b editorial-border flex items-center justify-between">
 <span className="text-xs font-mono uppercase text-[var(--color-industrial-grey)] font-semibold flex items-center gap-2">
 <FileCheck className="w-4 h-4 text-[var(--color-ink)]" />
 Historical Gate Goods Receipts Ledger ({receipts.length} Recorded)
 </span>
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)]">Atomic PostgreSQL Receipts</span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-white text-[var(--color-industrial-grey)] font-mono uppercase text-[10px] border-b editorial-border tracking-wider">
 <tr>
 <th className="px-4 py-3">Receipt #</th>
 <th className="px-4 py-3">Challan # / PO</th>
 <th className="px-4 py-3">Supplier</th>
 <th className="px-4 py-3">Vehicle / Driver</th>
 <th className="px-4 py-3 text-right">Gross (kg)</th>
 <th className="px-4 py-3 text-right">Net Weight (kg)</th>
 <th className="px-4 py-3 text-center">PO Match Status</th>
 <th className="px-4 py-3">Timestamp</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/80">
 {receipts.map((gr) => (
 <tr key={gr.id} className="hover:bg-white transition-colors">
 <td className="px-4 py-3 font-mono font-bold text-[var(--color-ink)]">{gr.receipt_number}</td>
 <td className="px-4 py-3">
 <span className="font-semibold text-[var(--color-ink)] block">{gr.challan_number}</span>
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)]">
 {gr.po_number || 'Direct Inward'}
 </span>
 </td>
 <td className="px-4 py-3 text-[var(--color-ink)]">{gr.supplier_name}</td>
 <td className="px-4 py-3">
 <span className="text-[var(--color-ink)] block font-mono text-[11px]">{gr.vehicle_number || '-'}</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">{gr.driver_name || '-'}</span>
 </td>
 <td className="px-4 py-3 text-right font-mono text-[var(--color-industrial-grey)]">
 {gr.total_gross_weight_kg.toLocaleString()}
 </td>
 <td className="px-4 py-3 text-right font-mono font-bold text-[var(--color-ink)]">
 {gr.total_net_weight_kg.toLocaleString()}
 </td>
 <td className="px-4 py-3 text-center">
 {gr.has_discrepancy ? (
 <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-950 text-rose-300 border border-rose-800 inline-flex items-center gap-1">
 <AlertTriangle className="w-3 h-3 text-rose-400" />
 Discrepancy
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3 text-emerald-400" />
 Matched
 </span>
 )}
 </td>
 <td className="px-4 py-3 text-[var(--color-industrial-grey)] font-mono text-[11px]">
 {new Date(gr.receipt_timestamp).toLocaleString('en-IN', {
 dateStyle: 'short',
 timeStyle: 'short',
 })}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── MODAL: RECEIVE YARN DELIVERY (SMART GATE) ─────────────────────────── */}
 {modalOpen && (
 <div className="fixed inset-0 z-50 bg-white backdrop-blur-sm flex items-center justify-center p-4">
 <div className="bg-white border editorial-border w-full max-w-3xl max-h-[90vh] overflow-y-auto ">
 {/* Modal Header */}
 <div className="p-4 border-b editorial-border flex items-center justify-between bg-white sticky top-0 z-10">
 <div className="flex items-center gap-2">
 <Truck className="w-5 h-5 text-[var(--color-ink)]" />
 <h3 className="text-base font-bold font-display text-[var(--color-ink)]">
 Smart Gate — Inward Yarn Receipt
 </h3>
 </div>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleSimulateOCR}
 disabled={ocrActive}
 className="px-2.5 py-1 text-xs bg-[var(--color-paper)] hover:bg-[var(--color-paper)] text-[var(--color-ink)] border editorial-border font-mono flex items-center gap-1.5 transition-colors"
 >
 <Upload className="w-3 h-3" />
 {ocrActive ? 'Scanning Challan...' : 'Simulate Challan OCR'}
 </button>
 <button
 onClick={() => setModalOpen(false)}
 className="text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)] text-sm px-2 py-1 rounded"
 >
 ✕
 </button>
 </div>
 </div>

 {/* Modal Form */}
 <form onSubmit={handleSubmit} className="p-5 space-y-5">
 {/* Top Row: PO & Supplier */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-mono uppercase text-[var(--color-industrial-grey)] mb-1.5">
 Link Purchase Order (PO)
 </label>
 <select
 value={selectedPoId || ''}
 onChange={(e) => handleSelectPO(e.target.value)}
 className="w-full px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 >
 <option value="">Direct Gate Inward (No PO Link)</option>
 {purchaseOrders.map((p) => (
 <option key={p.id} value={p.id}>
 {p.po_number} ({p.supplier_name}) — {p.total_ordered_kg} kg
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-xs font-mono uppercase text-[var(--color-industrial-grey)] mb-1.5">
 Delivery Challan / Invoice # *
 </label>
 <input
 type="text"
 required
 value={challanNumber}
 onChange={(e) => setChallanNumber(e.target.value)}
 placeholder="e.g. DC-ARVI-8891"
 className="w-full px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 />
 </div>
 </div>

 {/* Vehicle & Driver */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <div>
 <label className="block text-xs font-mono uppercase text-[var(--color-industrial-grey)] mb-1.5">
 Vehicle Registration #
 </label>
 <input
 type="text"
 value={vehicleNumber}
 onChange={(e) => setVehicleNumber(e.target.value)}
 placeholder="e.g. GJ-05-BX-9082"
 className="w-full px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 />
 </div>

 <div>
 <label className="block text-xs font-mono uppercase text-[var(--color-industrial-grey)] mb-1.5">
 Driver Name & Contact
 </label>
 <input
 type="text"
 value={driverName}
 onChange={(e) => setDriverName(e.target.value)}
 placeholder="e.g. Sukhdev Singh (+91 98251 77201)"
 className="w-full px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 />
 </div>
 </div>

 {/* Multi-Line Yarn Items */}
 <div className="space-y-3 pt-3 border-t editorial-border">
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono uppercase text-[var(--color-ink)] font-bold">
 Yarn Line Items (Weighbridge Records)
 </span>
 <button
 type="button"
 onClick={handleAddLine}
 className="text-xs px-2.5 py-1 rounded bg-white hover:bg-white text-[var(--color-ink)] font-mono flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" /> Add Line
 </button>
 </div>

 {lines.map((line, idx) => {
 const orderedKg = line.ordered_quantity_kg || 0;
 const netKg = line.net_weight_kg || 0;
 const diff = netKg - orderedKg;
 const isDiscrepant = orderedKg > 0 && Math.abs(diff) > orderedKg * 0.05;

 return (
 <div
 key={idx}
 className={clsx(
 'p-3.5 border space-y-3 transition-colors',
 isDiscrepant
 ? 'bg-rose-950/20 border-rose-700/60'
 : 'bg-white editorial-border'
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-mono font-bold text-[var(--color-ink)]">Line #{idx + 1}</span>
 {lines.length > 1 && (
 <button
 type="button"
 onClick={() => handleRemoveLine(idx)}
 className="text-[var(--color-industrial-grey)] hover:text-rose-400 p-1"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Yarn Specification
 </label>
 <select
 value={line.specification_id}
 onChange={(e) =>
 handleLineChange(idx, 'specification_id', parseInt(e.target.value))
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)]"
 >
 {specifications.map((s) => (
 <option key={s.id} value={s.id}>
 {s.sku} ({s.yarn_count} - {s.color_name})
 </option>
 ))}
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Supplier Batch / Lot #
 </label>
 <input
 type="text"
 value={line.supplier_lot_number}
 onChange={(e) =>
 handleLineChange(idx, 'supplier_lot_number', e.target.value)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)]"
 />
 </div>

 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Storage Bay
 </label>
 <input
 type="text"
 value={line.storage_location}
 onChange={(e) =>
 handleLineChange(idx, 'storage_location', e.target.value)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)]"
 />
 </div>
 </div>

 {/* Weight Inputs */}
 <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Ordered (kg)
 </label>
 <input
 type="number"
 step="0.1"
 value={line.ordered_quantity_kg}
 onChange={(e) =>
 handleLineChange(idx, 'ordered_quantity_kg', parseFloat(e.target.value) || 0)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Gross Weight (kg)
 </label>
 <input
 type="number"
 step="0.1"
 value={line.gross_weight_kg}
 onChange={(e) =>
 handleLineChange(idx, 'gross_weight_kg', parseFloat(e.target.value) || 0)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono"
 />
 </div>

 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Net Weight (kg) *
 </label>
 <input
 type="number"
 step="0.1"
 required
 value={line.net_weight_kg}
 onChange={(e) =>
 handleLineChange(idx, 'net_weight_kg', parseFloat(e.target.value) || 0)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)] font-mono font-bold"
 />
 </div>

 <div>
 <label className="block text-[11px] font-mono text-[var(--color-industrial-grey)] mb-1">
 Initial Quality
 </label>
 <select
 value={line.quality_status || 'approved'}
 onChange={(e) =>
 handleLineChange(idx, 'quality_status', e.target.value as any)
 }
 className="w-full px-2.5 py-1.5 text-xs rounded bg-white border editorial-border text-[var(--color-ink)]"
 >
 <option value="approved">Approved (Usable)</option>
 <option value="quarantined">Quarantine (Moisture/Defect)</option>
 <option value="pending">Pending QA Lab</option>
 </select>
 </div>
 </div>

 {/* Discrepancy Alert Banner */}
 {isDiscrepant && (
 <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-xs text-rose-300 font-mono flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
 <span>
 PO Discrepancy Flagged: Net delivered is {diff > 0 ? `+${diff}` : diff} kg vs PO
 ordered quantity (exceeds 5% tolerance limit).
 </span>
 </div>
 )}
 </div>
 );
 })}
 </div>

 {/* Notes */}
 <div>
 <label className="block text-xs font-mono uppercase text-[var(--color-industrial-grey)] mb-1">
 Weighbridge & Physical Inspection Notes
 </label>
 <textarea
 rows={2}
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 placeholder="Record moisture readings, cone seal conditions, packaging damages..."
 className="w-full px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 />
 </div>

 {/* Modal Actions */}
 <div className="flex items-center justify-end gap-3 pt-3 border-t editorial-border">
 <Button
 type="button"
 variant="outline"
 size="md"
 onClick={() => setModalOpen(false)}
 >
 Cancel
 </Button>
 <Button
 type="submit"
 variant="primary"
 size="md"
 disabled={submitting}
 leftIcon={<CheckCircle2 className="w-4 h-4" />}
 >
 {submitting ? 'Recording Inward...' : 'Confirm & Generate Lots'}
 </Button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};
