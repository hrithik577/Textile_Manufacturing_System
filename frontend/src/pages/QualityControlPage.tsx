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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Quality Assurance & Roll Traceability
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Fabric roll defect grading, 4-point inspection system, lab shade verification, and end-to-end lot genealogy.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setInspectModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Record Lab / Roll Inspection
        </Button>
      </div>

      {/* Quality KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">First-Pass Yield (FPY)</span>
            <span className="text-2xl font-bold font-display text-emerald-400 block mt-1">94.6%</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Grade A Export Rolls</span>
            <span className="text-2xl font-bold font-display text-white block mt-1">24 Rolls</span>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">On Quality Hold</span>
            <span className="text-2xl font-bold font-display text-amber-400 block mt-1">1 Batch</span>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Rejected Fabric (Scrap)</span>
            <span className="text-2xl font-bold font-display text-rose-400 block mt-1">1 Roll</span>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Roll # (ROLL-8401), order number, customer, or inspector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedDecision}
            onChange={(e) => setSelectedDecision(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
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
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
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
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Roll ID & Order</th>
                <th className="px-4 py-3">Fabric Construction</th>
                <th className="px-4 py-3">Defect Category</th>
                <th className="px-4 py-3">GSM & Width Test</th>
                <th className="px-4 py-3">Decision & Grade</th>
                <th className="px-4 py-3">Inspector & Date</th>
                <th className="px-4 py-3 text-right">Traceability</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInspections.map((i) => {
                const isPass = i.decision === 'pass';
                const isHold = i.decision === 'hold';
                const isReject = i.decision === 'reject';

                return (
                  <tr
                    key={i.id}
                    onClick={() => setSelectedInspection(i)}
                    className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-white text-xs">{i.rollNumber}</div>
                      <div className="text-[11px] text-teal-400 font-mono font-medium">{i.orderNumber}</div>
                      <div className="text-[10px] text-slate-400">{i.customerName}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-200 font-medium">{i.fabricType}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Lot: {i.yarnLotNumber}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-300 capitalize">
                        {i.defectCategory.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {i.defectCount > 0 ? `${i.defectCount} defect point(s)` : 'Zero defect points'}
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs">
                      <div>
                        {i.measuredGsm} GSM{' '}
                        <span className="text-[10px] text-slate-500">(Target: {i.targetGsm})</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Width: {i.measuredWidthInches}" (Target: {i.targetWidthInches}")
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={i.decision} size="sm" />
                      <div className="text-[10px] font-mono text-slate-400 mt-1">{i.grade}</div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-300 font-medium">{i.inspectorName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{i.inspectionDate}</div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedInspection(i)}>
                        Trace Lot
                      </Button>
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
