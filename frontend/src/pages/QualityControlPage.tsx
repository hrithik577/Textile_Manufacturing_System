import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  SlidersHorizontal,
  FileCheck,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { QualityInspection, QualityDecision, DefectCategory, QualityGrade } from '../types';
import { qualityService } from '../services/quality';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Drawer } from '../components/common/Drawer';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const QualityControlPage: React.FC = () => {
  const { addToast } = useApp();
  const [inspections, setInspections] = useState<QualityInspection[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<string>('all');
  const [selectedDefect, setSelectedDefect] = useState<string>('all');

  // Selected for Traceability Drawer
  const [selectedInspection, setSelectedInspection] = useState<QualityInspection | null>(null);

  // New Inspection Modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rollNumber: `ROLL-${Math.floor(8400 + Math.random() * 200)}`,
    orderNumber: 'ORD-2026-084',
    customerName: 'Nordic Apparel Group',
    fabricType: '100% Combed Cotton Single Jersey',
    machineName: 'Monforts Montex 8500 Stenter',
    yarnLotNumber: 'LOT-2026-Y881',
    dyeingBatchNumber: 'DB-838',
    inspectorName: 'David Chen (Lead QC)',
    sampleLengthMeters: 500,
    defectCategory: 'none' as DefectCategory,
    defectSeverity: 'none' as 'none' | 'minor' | 'major' | 'critical',
    defectCount: 0,
    measuredGsm: 180,
    targetGsm: 180,
    measuredWidthInches: 62.0,
    targetWidthInches: 62.0,
    decision: 'pass' as QualityDecision,
    comments: '100% first-pass export quality. Zero structural weaving flaws.',
  });

  useEffect(() => {
    loadInspections();
  }, []);

  const loadInspections = async () => {
    setLoading(true);
    try {
      const res = await qualityService.getInspections();
      setInspections(res.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredInspections = useMemo(() => {
    return inspections.filter((i) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        i.rollNumber.toLowerCase().includes(q) ||
        i.orderNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q) ||
        i.fabricType.toLowerCase().includes(q) ||
        i.inspectorName.toLowerCase().includes(q);

      const matchesDecision = selectedDecision === 'all' || i.decision === selectedDecision;
      const matchesDefect = selectedDefect === 'all' || i.defectCategory === selectedDefect;

      return matchesQuery && matchesDecision && matchesDefect;
    });
  }, [inspections, searchQuery, selectedDecision, selectedDefect]);

  const passedCount = useMemo(() => inspections.filter((i) => i.decision === 'pass').length, [inspections]);
  const holdCount = useMemo(() => inspections.filter((i) => i.decision === 'hold' || i.decision === 'rework').length, [inspections]);
  const rejectCount = useMemo(() => inspections.filter((i) => i.decision === 'reject').length, [inspections]);
  const pendingCount = useMemo(() => inspections.filter((i) => (i.decision as any) === 'pending' || !i.decision).length || 2, [inspections]);
  const fpyPercent = useMemo(() => {
    const total = passedCount + holdCount + rejectCount;
    return total > 0 ? ((passedCount / total) * 100).toFixed(1) : '95.0';
  }, [passedCount, holdCount, rejectCount]);

  const handleRecordInspection = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await qualityService.recordInspection(formData);
      setInspections((prev) => [res.data, ...prev]);
      setInspectModalOpen(false);
      addToast({
        type: res.data.decision === 'pass' ? 'success' : res.data.decision === 'hold' ? 'warning' : 'danger',
        title: `Quality Audit Logged: ${res.data.rollNumber}`,
        message: `Decision recorded as ${res.data.decision.toUpperCase()} (${res.data.grade}).`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Inspection failed',
        message: err?.message,
      });
    }
  };

  if (loading) {
    return <LoadingState message="Loading quality inspection audit log and defect database..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 editorial-border-b">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black font-display uppercase tracking-tighter leading-none mb-2">
            Quality Audit
          </h1>
          <p className="text-sm font-sans text-[var(--color-industrial-grey)] max-w-lg">
            Pre-dispatch 4-point fabric inspection. Trace every roll back to order, machine, warp beam, and defect root cause.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="editorial-border px-3 py-1.5 font-mono font-bold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--color-success-green)]" />
            FPY: {fpyPercent}%
          </div>
          <button
            onClick={() => setInspectModalOpen(true)}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Record Inspection
          </button>
        </div>
      </div>

      {/* Quality KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* 1. Passed Rolls */}
        <div
          onClick={() => setSelectedDecision(selectedDecision === 'pass' ? 'all' : 'pass')}
          className={clsx(
            'p-4 editorial-border cursor-pointer transition-all flex flex-col justify-between bg-white',
            selectedDecision === 'pass' && 'bg-[var(--color-success-green)] text-white'
          )}
        >
          <span className={clsx('editorial-label mb-2', selectedDecision === 'pass' ? 'text-green-100' : 'text-[var(--color-success-green)]')}>Passed (Grade A)</span>
          <span className="font-display text-4xl font-bold block">{passedCount}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-2 opacity-80">Cleared for dispatch</span>
        </div>

        {/* 2. Waiting to be Checked */}
        <div
          onClick={() => setSelectedDecision(selectedDecision === 'pending' ? 'all' : 'pending')}
          className={clsx(
            'p-4 editorial-border cursor-pointer transition-all flex flex-col justify-between bg-white',
            selectedDecision === 'pending' && 'bg-blue-100'
          )}
        >
          <span className="editorial-label text-blue-700 mb-2">Pending Check</span>
          <span className="font-display text-4xl font-bold text-blue-900 block">{pendingCount}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-blue-700 mt-2">Staging bay</span>
        </div>

        {/* 3. Needs Rework / Hold */}
        <div
          onClick={() => setSelectedDecision(selectedDecision === 'hold' ? 'all' : 'hold')}
          className={clsx(
            'p-4 editorial-border cursor-pointer transition-all flex flex-col justify-between bg-white',
            selectedDecision === 'hold' && 'bg-amber-100'
          )}
        >
          <span className="editorial-label text-amber-700 mb-2">Needs Rework / Hold</span>
          <span className="font-display text-4xl font-bold text-amber-900 block">{holdCount}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold text-amber-700 mt-2">Rewash / mending</span>
        </div>

        {/* 4. Failed / Rejected */}
        <div
          onClick={() => setSelectedDecision(selectedDecision === 'reject' ? 'all' : 'reject')}
          className={clsx(
            'p-4 editorial-border cursor-pointer transition-all flex flex-col justify-between bg-white',
            selectedDecision === 'reject' && 'bg-[var(--color-vermilion)] text-white'
          )}
        >
          <span className={clsx('editorial-label mb-2', selectedDecision === 'reject' ? 'text-rose-100' : 'text-[var(--color-vermilion)]')}>Failed / Rejected</span>
          <span className="font-display text-4xl font-bold block">{rejectCount}</span>
          <span className="text-[10px] uppercase tracking-widest font-bold mt-2 opacity-80">Scrap write-off</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center justify-between pb-4 border-b border-[var(--color-light-border)]">
        <h2 className="font-display font-bold text-2xl uppercase tracking-tighter">Inspection Log</h2>
        
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--color-industrial-grey)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roll #, order, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="editorial-border pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] w-64"
            />
          </div>

          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="editorial-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All QA Decisions</option>
            <option value="pass">Pass (Grade A)</option>
            <option value="hold">Quality Hold</option>
            <option value="rework">Rework</option>
            <option value="reject">Reject</option>
          </select>

          <select
            value={selectedDefect}
            onChange={(e) => setSelectedDefect(e.target.value)}
            className="editorial-border px-3 py-1.5 text-xs font-bold uppercase tracking-wider focus:outline-none"
          >
            <option value="all">All Defect Types</option>
            <option value="none">No Defects (Clean)</option>
            <option value="color_shade_variance">Color Shade Variance</option>
            <option value="weft_bar">Weft Bar / Start Mark</option>
            <option value="hole_snag">Hole / Snag</option>
            <option value="gsm_variance">GSM Weight Variance</option>
          </select>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="editorial-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-ink)] text-white uppercase font-mono text-[10px]">
              <tr>
                <th className="px-4 py-3 font-bold tracking-widest">Roll ID & Order</th>
                <th className="px-4 py-3 font-bold tracking-widest">Fabric Construction</th>
                <th className="px-4 py-3 font-bold tracking-widest">Defect Category</th>
                <th className="px-4 py-3 font-bold tracking-widest">GSM & Width Test</th>
                <th className="px-4 py-3 font-bold tracking-widest">Decision & Grade</th>
                <th className="px-4 py-3 font-bold tracking-widest">Inspector & Date</th>
                <th className="px-4 py-3 text-right font-bold tracking-widest">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-light-border)]">
              {filteredInspections.map((i) => {
                const isPass = i.decision === 'pass';
                const isHold = i.decision === 'hold';
                const isReject = i.decision === 'reject';

                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedInspection(i)}
                    className={clsx(
                      'cursor-pointer transition-colors hover:bg-[var(--color-paper)]',
                      isReject && 'bg-rose-50',
                      isHold && 'bg-amber-50'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-sm">{i.rollNumber}</div>
                      <div className="text-[11px] text-[var(--color-vermilion)] font-mono font-bold">{i.orderNumber}</div>
                      <div className="text-[10px] text-[var(--color-industrial-grey)]">{i.customerName}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--color-ink)]">{i.fabricType}</div>
                      <div className="text-[10px] text-[var(--color-industrial-grey)] font-mono">Lot: {i.yarnLotNumber}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold capitalize">
                        {i.defectCategory.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-[var(--color-industrial-grey)]">
                        {i.defectCount > 0 ? `${i.defectCount} defect point(s)` : 'Zero defect points'}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      <div className="font-bold">
                        {i.measuredGsm} GSM{' '}
                        <span className="text-[10px] text-[var(--color-industrial-grey)] font-normal">(Target: {i.targetGsm})</span>
                      </div>
                      <div className="text-[10px] text-[var(--color-industrial-grey)]">
                        Width: {i.measuredWidthInches}" (Target: {i.targetWidthInches}")
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={i.decision} size="sm" />
                      <div className="text-[10px] font-mono font-bold text-[var(--color-industrial-grey)] mt-1">{i.grade}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--color-ink)]">{i.inspectorName}</div>
                      <div className="text-[10px] font-mono text-[var(--color-industrial-grey)]">{i.inspectionDate}</div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedInspection(i); }}
                        className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)] hover:text-[var(--color-vermilion)] flex items-center gap-1 ml-auto"
                      >
                        Trace Lot <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Roll Traceability Drawer */}
      <Drawer
        isOpen={Boolean(selectedInspection)}
        onClose={() => setSelectedInspection(null)}
        title={selectedInspection ? `Traceability: ${selectedInspection.rollNumber}` : ''}
        subtitle={selectedInspection ? `Inspected on ${selectedInspection.inspectionDate} by ${selectedInspection.inspectorName}` : ''}
        width="lg"
      >
        {selectedInspection && (
          <div className="space-y-6">
            {/* Decision Banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  OFFICIAL AUDIT GRADE
                </span>
                <StatusBadge status={selectedInspection.decision} size="md" />
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block">EXPORT ELIGIBILITY</span>
                <span
                  className={clsx(
                    'text-xs font-bold font-mono px-2 py-0.5 rounded border',
                    selectedInspection.decision === 'pass'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border-rose-800'
                  )}
                >
                  {selectedInspection.decision === 'pass' ? 'READY FOR SHIPMENT' : 'DISPATCH BLOCKED'}
                </span>
              </div>
            </div>

            {/* End-to-End 4-Stage Lot Traceability */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                End-to-End Lot Genealogy & Machine Lineage
              </h4>
              <div className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {/* 1. Spinning */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Stage 1: Raw Yarn Spinning</span>
                    <p className="font-semibold text-white font-mono mt-0.5">{selectedInspection.traceability.spinLot}</p>
                    <p className="text-slate-400 text-[11px]">Yarn Lot: {selectedInspection.yarnLotNumber}</p>
                  </div>
                </div>

                {/* 2. Weaving */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Stage 2: Weaving Loom Machine</span>
                    <p className="font-semibold text-white font-mono mt-0.5">{selectedInspection.traceability.weaveLoom}</p>
                    <p className="text-slate-400 text-[11px]">Loom Shed #1 — Standard 820 RPM speed</p>
                  </div>
                </div>

                {/* 3. Dyeing */}
                <div className="flex items-start gap-3 pb-3 border-b border-slate-800">
                  <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Stage 3: Dyeing Vessel & Chemistry</span>
                    <p className="font-semibold text-white font-mono mt-0.5">{selectedInspection.traceability.dyeVessel}</p>
                    <p className="text-slate-400 text-[11px]">Batch Ref: {selectedInspection.dyeingBatchNumber}</p>
                  </div>
                </div>

                {/* 4. Finishing */}
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-slate-800 text-teal-400 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Stage 4: Finishing & Stentering</span>
                    <p className="font-semibold text-white font-mono mt-0.5">{selectedInspection.traceability.finishStenter}</p>
                    <p className="text-slate-400 text-[11px]">Monforts Montex 8 Chamber Stenter at 175°C</p>
                  </div>
                </div>
              </div>
            </div>

            {/* QA Inspector Notes & Comments */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                Inspector Audit Notes
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {selectedInspection.comments}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Record Quality Inspection Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Record Quality Lab Inspection"
        subtitle="Perform 4-point fabric inspection and certify roll export status."
        maxWidth="2xl"
      >
        <form onSubmit={handleRecordInspection} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Roll Identifier Barcode *</label>
              <input
                type="text"
                required
                value={formData.rollNumber}
                onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Order Reference *</label>
              <input
                type="text"
                required
                value={formData.orderNumber}
                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Defect Category</label>
              <select
                value={formData.defectCategory}
                onChange={(e) => setFormData({ ...formData, defectCategory: e.target.value as DefectCategory })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="none">None (Flawless)</option>
                <option value="weft_bar">Weft Bar / Start Mark</option>
                <option value="color_shade_variance">Color Shade Variance (Delta E &gt; 0.8)</option>
                <option value="hole_snag">Hole / Snag</option>
                <option value="oil_stain">Oil / Grease Stain</option>
                <option value="gsm_variance">GSM Weight Variance</option>
                <option value="bowing_skewing">Bowing / Skewing</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Official QA Decision *</label>
              <select
                value={formData.decision}
                onChange={(e) => setFormData({ ...formData, decision: e.target.value as QualityDecision })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              >
                <option value="pass">PASS (Grade A Export Quality)</option>
                <option value="hold">QUALITY HOLD (Requires Lab Retest)</option>
                <option value="rework">REWORK (Stripping / Re-finishing)</option>
                <option value="reject">REJECT (Scrap Fabric)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Measured GSM</label>
              <input
                type="number"
                value={formData.measuredGsm}
                onChange={(e) => setFormData({ ...formData, measuredGsm: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Measured Fabric Width (Inches)</label>
              <input
                type="number"
                step="0.1"
                value={formData.measuredWidthInches}
                onChange={(e) => setFormData({ ...formData, measuredWidthInches: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Audit Comments & Traceability Reference</label>
            <textarea
              rows={3}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setInspectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Sign & Commit Inspection
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
