import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Cpu,
  ShoppingBag,
  Layers,
  ChevronRight,
  Check,
  FileCheck,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Info,
  RotateCcw,
} from 'lucide-react';
import { RescueIssue, RecoveryPlan, RescueSeverity, RescueStatus } from '../types';
import { rescueEngineService } from '../services/rescue-engine';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const RescueEnginePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, addToast } = useApp();

  const [issues, setIssues] = useState<RescueIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Selected Issue for Deep Dive
  const [selectedIssueId, setSelectedIssueId] = useState<string>('resc-001');

  // Selected Plan for Approval
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan-001-a');
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approvalNotes, setApprovalNotes] = useState('Approved per emergency floor protocol. Transfer warp beam immediately.');

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    setLoading(true);
    try {
      const res = await rescueEngineService.getIssues();
      setIssues(res.data);

      const issueParam = searchParams.get('issueId');
      if (issueParam) {
        setSelectedIssueId(issueParam);
      } else if (res.data.length > 0) {
        setSelectedIssueId(res.data[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const activeIssue = useMemo(() => {
    return issues.find((i) => i.id === selectedIssueId) || issues[0];
  }, [issues, selectedIssueId]);

  // Set default plan when active issue changes
  useEffect(() => {
    if (activeIssue && activeIssue.recoveryPlans.length > 0) {
      setSelectedPlanId(activeIssue.selectedPlanId || activeIssue.recoveryPlans[0].id);
    }
  }, [activeIssue]);

  const activePlan = useMemo(() => {
    if (!activeIssue) return null;
    return activeIssue.recoveryPlans.find((p) => p.id === selectedPlanId) || activeIssue.recoveryPlans[0];
  }, [activeIssue, selectedPlanId]);

  // High-level triage counters
  const triageStats = useMemo(() => {
    return {
      critical: issues.filter((i) => i.severity === 'critical').length,
      ordersAtRisk: issues.filter((i) => Boolean(i.affectedOrderId)).length,
      machineStops: issues.filter((i) => i.category === 'machine_breakdown').length,
      qualityHolds: issues.filter((i) => i.category === 'quality_spike').length,
      materialShortages: issues.filter((i) => i.category === 'material_shortage').length,
    };
  }, [issues]);

  const handleApprovePlan = async () => {
    if (!activeIssue || !activePlan) return;

    try {
      await rescueEngineService.approveRecoveryPlan(
        activeIssue.id,
        activePlan.id,
        currentUser.name,
        approvalNotes
      );

      // Update state locally to reflect approved state
      setIssues((prev) =>
        prev.map((i) =>
          i.id === activeIssue.id
            ? {
                ...i,
                status: 'approved',
                selectedPlanId: activePlan.id,
                approvedBy: `${currentUser.name} (${currentUser.role.replace(/_/g, ' ')})`,
                approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
                executionStatus: 'Plan authorized. Dispatching work order to production floor.',
              }
            : i
        )
      );

      setApprovalModalOpen(false);
      addToast({
        type: 'success',
        title: 'Recovery Plan Approved & Dispatched',
        message: `${activePlan.planCode} authorized by ${currentUser.name}. Machine reassignment queued.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Plan approval failed',
        message: err?.message,
      });
    }
  };

  const handleRejectPlan = async () => {
    if (!activeIssue || !activePlan) return;

    try {
      await rescueEngineService.rejectPlan(activeIssue.id, activePlan.id, rejectReason);

      setIssues((prev) =>
        prev.map((i) =>
          i.id === activeIssue.id
            ? {
                ...i,
                status: 'evaluating',
                resolutionNotes: `Plan ${activePlan.planCode} rejected: ${rejectReason}`,
              }
            : i
        )
      );

      setRejectModalOpen(false);
      addToast({
        type: 'warning',
        title: 'Recovery Plan Rejected',
        message: 'Plan marked as rejected. Alternative recovery strategy requested.',
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Rejection failed',
        message: err?.message,
      });
    }
  };

  if (loading) {
    return <LoadingState message="Everest Rescue Engine analyzing machine bottlenecks and heuristic recovery options..." />;
  }

  return (
    <div className="space-y-6">
      {/* Signature Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 editorial-border-b">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl lg:text-6xl font-black font-display text-[var(--color-vermilion)] uppercase tracking-tighter leading-none flex items-center gap-4">
              <ShieldAlert className="w-10 h-10 lg:w-14 lg:h-14" />
              Rescue Engine™
            </h1>
            <span className="text-[10px] px-2 py-1 border border-[var(--color-vermilion)] text-[var(--color-vermilion)] uppercase font-mono font-bold animate-pulse">
              AUTONOMOUS TRIAGE ACTIVE
            </span>
          </div>
          <p className="text-sm font-sans text-[var(--color-industrial-grey)] max-w-xl">
            Real-time operational problem detection, causal telemetry diagnosis, multi-factor recovery plan comparison, and management approval.
          </p>
        </div>
      </div>

      {/* Triage Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-4 editorial-border bg-white flex flex-col justify-between">
          <span className="editorial-label text-[var(--color-vermilion)] mb-2">Critical Breaches</span>
          <span className="font-display text-4xl font-bold text-[var(--color-vermilion)]">
            {triageStats.critical}
          </span>
        </div>
        <div className="p-4 editorial-border bg-white flex flex-col justify-between">
          <span className="editorial-label text-amber-600 mb-2">Orders at Risk</span>
          <span className="font-display text-4xl font-bold text-amber-600">
            {triageStats.ordersAtRisk}
          </span>
        </div>
        <div className="p-4 editorial-border bg-white flex flex-col justify-between">
          <span className="editorial-label text-[var(--color-ink)] mb-2">Machine Trips</span>
          <span className="font-display text-4xl font-bold text-[var(--color-ink)]">
            {triageStats.machineStops}
          </span>
        </div>
        <div className="p-4 editorial-border bg-white flex flex-col justify-between">
          <span className="editorial-label text-[var(--color-industrial-grey)] mb-2">Quality Holds</span>
          <span className="font-display text-4xl font-bold text-[var(--color-ink)]">
            {triageStats.qualityHolds}
          </span>
        </div>
        <div className="p-4 editorial-border bg-white flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="editorial-label text-[var(--color-industrial-grey)] mb-2">Dye Shortages</span>
          <span className="font-display text-4xl font-bold text-[var(--color-ink)]">
            {triageStats.materialShortages}
          </span>
        </div>
      </div>

      {/* Main Workspace: Left Column Issues Feed + Right Column Deep Dive & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Issue Triage List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--color-light-border)]">
            <h3 className="editorial-label text-[var(--color-ink)]">
              Detected Incidents ({issues.length})
            </h3>
            <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase tracking-wider font-bold">Heuristic Engine</span>
          </div>

          <div className="space-y-4">
            {issues.map((issue) => {
              const isSelected = issue.id === selectedIssueId;
              const isCritical = issue.severity === 'critical';

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={clsx(
                    'p-4 editorial-border text-left cursor-pointer transition-all duration-150 relative bg-white',
                    isSelected ? (isCritical ? 'border-[var(--color-vermilion)] ring-1 ring-[var(--color-vermilion)] shadow-sm' : 'border-[var(--color-ink)] ring-1 ring-[var(--color-ink)] shadow-sm') : 'hover:bg-black/5'
                  )}
                >
                  {isCritical && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[var(--color-vermilion)]" />
                  )}

                  <div className={clsx("flex items-start justify-between gap-2", isCritical ? "ml-2" : "")}>
                    <span className={clsx("font-display font-bold text-sm tracking-widest uppercase", isCritical ? "text-[var(--color-vermilion)]" : "text-[var(--color-ink)]")}>
                      {issue.issueCode}
                    </span>
                    <StatusBadge status={issue.severity} size="sm" />
                  </div>

                  <h4 className={clsx("text-sm font-bold font-sans mt-2 leading-snug", isCritical ? "ml-2" : "")}>
                    {issue.title}
                  </h4>

                  <div className={clsx("mt-3 text-[11px] font-bold text-[var(--color-industrial-grey)] space-y-1", isCritical ? "ml-2" : "")}>
                    {issue.affectedOrderNumber && (
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="font-mono text-[var(--color-ink)] uppercase tracking-widest">{issue.affectedOrderNumber}</span>
                        <span className="truncate">({issue.customerName})</span>
                      </div>
                    )}
                    {issue.affectedMachineName && (
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        <span className="truncate uppercase">{issue.affectedMachineName}</span>
                      </div>
                    )}
                  </div>

                  <div className={clsx("mt-4 pt-3 border-t border-[var(--color-light-border)] flex items-center justify-between text-[10px] font-mono", isCritical ? "ml-2" : "")}>
                    <span className="text-[var(--color-industrial-grey)] font-bold">{issue.detectionTime}</span>
                    <span
                      className={clsx(
                        'uppercase font-bold tracking-widest',
                        issue.status === 'approved' ? 'text-[var(--color-success-green)]' : 'text-amber-600'
                      )}
                    >
                      {issue.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (8 cols): Incident Deep Dive, Impact & Recovery Plan Matrix */}
        {activeIssue && (
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Incident Diagnosis & Impact Card */}
            <div className="editorial-border bg-white p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 editorial-border-b">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-display font-bold text-sm tracking-widest uppercase text-[var(--color-vermilion)] border border-[var(--color-vermilion)] px-2 py-0.5">
                      {activeIssue.issueCode}
                    </span>
                    <StatusBadge status={activeIssue.severity} size="sm" />
                    <span className="text-xs text-[var(--color-industrial-grey)] font-mono font-bold">Detected: {activeIssue.detectionTime}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold uppercase tracking-tight">
                    {activeIssue.title}
                  </h2>
                </div>

                {activeIssue.status === 'approved' && (
                  <div className="px-4 py-2 bg-[var(--color-success-green)] text-white text-xs font-mono font-bold flex items-center gap-2 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    PLAN APPROVED
                  </div>
                )}
              </div>

              {/* Root Cause & Impact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-light-border)] space-y-2">
                  <span className="editorial-label text-[var(--color-ink)]">Root Cause Diagnosis</span>
                  <p className="text-sm font-sans leading-relaxed">{activeIssue.likelyCause}</p>
                </div>

                <div className="p-4 bg-rose-50 border border-[var(--color-vermilion)] space-y-2">
                  <span className="editorial-label text-[var(--color-vermilion)]">Operational Impact</span>
                  <div className="font-display font-bold text-xl text-[var(--color-vermilion)] flex gap-4">
                    <span>+{activeIssue.impactAnalysis.delayDays}D Delay</span>
                    <span>₹{activeIssue.impactAnalysis.costImpactUsd}</span>
                  </div>
                  <p className="text-xs text-[var(--color-ink)] leading-relaxed font-medium">
                    {activeIssue.impactAnalysis.description}
                  </p>
                </div>
              </div>

              {/* Evidence Log */}
              <div>
                <h4 className="editorial-label text-[var(--color-ink)] mb-3">
                  Supporting Sensor Evidence & Heuristic Indicators
                </h4>
                <div className="p-4 bg-[var(--color-paper)] border border-[var(--color-light-border)] space-y-2">
                  {activeIssue.evidence.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm">
                      <span className="text-[var(--color-vermilion)] font-mono font-bold text-base leading-none mt-0.5">›</span>
                      <span className="font-sans">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval banner */}
              {activeIssue.status === 'approved' && (
                <div className="p-4 bg-[var(--color-success-green)] text-white space-y-1">
                  <div className="flex items-center justify-between font-mono font-bold text-sm">
                    <span>Approved by: {activeIssue.approvedBy}</span>
                    <span>{activeIssue.approvedAt}</span>
                  </div>
                  <p className="text-xs opacity-90">{activeIssue.executionStatus}</p>
                </div>
              )}
            </div>

            {/* 2. Recovery Plan Comparison Matrix */}
            <div className="editorial-border bg-white p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 editorial-border-b">
                <div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-tight">
                    Recovery Plans ({activeIssue.recoveryPlans.length} Options)
                  </h3>
                  <p className="text-xs text-[var(--color-industrial-grey)] mt-1 font-sans">
                    Compare lead time recovery, expediting costs, and operational trade-offs.
                  </p>
                </div>
                <span className="editorial-label text-[var(--color-industrial-grey)]">Everest Heuristics</span>
              </div>

              {/* Plan Cards Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeIssue.recoveryPlans.map((plan) => {
                  const isPlanSelected = plan.id === selectedPlanId;
                  const isFeasible = plan.feasibilityScorePercent >= 90;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={clsx(
                        'p-4 editorial-border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between bg-white',
                        isPlanSelected
                          ? 'border-[var(--color-ink)] ring-2 ring-[var(--color-ink)] shadow-md'
                          : 'hover:bg-black/5'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-display font-bold text-sm uppercase tracking-widest">
                            {plan.planCode.split(' ')[0]}
                          </span>
                          <span
                            className={clsx(
                              'text-[10px] font-mono font-bold px-2 py-0.5 uppercase',
                              isFeasible ? 'bg-[var(--color-success-green)] text-white' : 'bg-[var(--color-paper)] text-[var(--color-industrial-grey)] border border-[var(--color-light-border)]'
                            )}
                          >
                            {plan.feasibilityScorePercent}%
                          </span>
                        </div>

                        <h4 className="text-sm font-bold font-sans mt-1 line-clamp-2 leading-snug">
                          {plan.title}
                        </h4>

                        <p className="text-[11px] text-[var(--color-industrial-grey)] mt-2 line-clamp-3 leading-relaxed font-sans">
                          {plan.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[var(--color-light-border)] space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest text-[10px]">Schedule Gain:</span>
                          <span className="font-bold text-[var(--color-success-green)]">{plan.estimatedDelayChangeDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest text-[10px]">Extra Cost:</span>
                          <span className="font-bold">₹{plan.estimatedCostUsd}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--color-industrial-grey)] font-bold uppercase tracking-widest text-[10px]">Risk Profile:</span>
                          <span className="capitalize font-bold">{plan.riskLevel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Plan Deep-Dive & Action Controls */}
              {activePlan && (
                <div className="p-6 bg-[var(--color-paper)] border border-[var(--color-light-border)] space-y-5">
                  <div className="flex items-center justify-between pb-3 editorial-border-b">
                    <div>
                      <span className="editorial-label text-[var(--color-ink)]">
                        Selected Plan Execution Strategy
                      </span>
                      <h4 className="font-display text-xl font-bold uppercase tracking-tight mt-1">
                        {activePlan.title}
                      </h4>
                    </div>
                    <div className="editorial-border px-3 py-1.5 font-mono font-bold text-sm">
                      {activePlan.feasibilityScorePercent}/100
                    </div>
                  </div>

                  <p className="text-sm font-sans leading-relaxed">{activePlan.strategyDescription}</p>

                  {/* Steps */}
                  <div>
                    <h5 className="editorial-label text-[var(--color-ink)] mb-3">
                      Operational Action Steps:
                    </h5>
                    <div className="space-y-2">
                      {activePlan.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-5 h-5 bg-[var(--color-ink)] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="font-sans">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pros & Cons Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-[var(--color-light-border)] space-y-2">
                      <span className="editorial-label text-[var(--color-success-green)] flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5" /> Advantages
                      </span>
                      {activePlan.pros.map((p, idx) => (
                        <p key={idx} className="text-sm font-sans leading-relaxed">
                          • {p}
                        </p>
                      ))}
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-300 space-y-2">
                      <span className="editorial-label text-amber-700 flex items-center gap-1">
                        <ThumbsDown className="w-3.5 h-3.5" /> Trade-offs / Risks
                      </span>
                      {activePlan.cons.map((c, idx) => (
                        <p key={idx} className="text-sm font-sans leading-relaxed text-amber-900">
                          • {c}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-5 border-t border-[var(--color-light-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs text-[var(--color-industrial-grey)] font-bold">
                      Required Sign-off: <span className="text-[var(--color-ink)] font-bold">{activePlan.requiredApprovals.join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest editorial-border hover:bg-black/5 transition-colors w-full sm:w-auto"
                      >
                        Reject Plan
                      </button>
                      <button
                        onClick={() => setApprovalModalOpen(true)}
                        className="px-6 py-2.5 text-xs font-bold uppercase tracking-widest bg-[var(--color-ink)] text-white hover:bg-black/80 transition-colors flex items-center gap-2 w-full sm:w-auto"
                      >
                        <Check className="w-4 h-4" />
                        Approve & Execute
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Approve Plan Modal */}
      <Modal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        title={activePlan ? `Approve ${activePlan.planCode}` : 'Approve Recovery Plan'}
        subtitle={`Authorizing by ${currentUser.name} (${currentUser.role.replace(/_/g, ' ')})`}
        maxWidth="lg"
      >
        {activePlan && (
          <div className="space-y-4 text-xs text-slate-300">
            <div className="p-4 rounded-xl bg-teal-950/30 border border-teal-500/40 space-y-2">
              <h4 className="font-bold text-white text-sm font-display">{activePlan.title}</h4>
              <div className="flex items-center gap-3 text-slate-300 font-mono text-xs">
                <span>Schedule: {activePlan.estimatedDelayChangeDays} Days</span>
                <span>•</span>
                <span>Budget: +₹{activePlan.estimatedCostUsd}</span>
                <span>•</span>
                <span>Feasibility: {activePlan.feasibilityScorePercent}%</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Management Approval Rationale / Floor Instruction *
              </label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-[11px] text-slate-400">
                Logged in as: <strong className="text-white">{currentUser.name}</strong>
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => setApprovalModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleApprovePlan} leftIcon={<Check className="w-4 h-4" />}>
                  Authorize Recovery Execution
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Plan Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Proposed Recovery Plan"
        subtitle="Provide reason for rejection to prompt the Rescue Engine for revision."
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium block mb-1">Rejection Reason *</label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Excessive overtime cost; prefer splitting batch or customer buffer."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectPlan}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
