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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                Everest Rescue Engine™
              </h1>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono font-bold animate-pulse">
              AUTONOMOUS TRIAGE ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time operational problem detection, causal telemetry diagnosis, multi-factor recovery plan comparison, and management approval.
          </p>
        </div>
      </div>

      {/* Triage Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Critical Breaches</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-rose-400 block mt-0.5">
            {triageStats.critical}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Orders at Risk</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-amber-400 block mt-0.5">
            {triageStats.ordersAtRisk}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Machine Trips</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-white block mt-0.5">
            {triageStats.machineStops}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Quality Holds</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-teal-400 block mt-0.5">
            {triageStats.qualityHolds}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Dye Shortages</span>
          <span className="text-xl sm:text-2xl font-bold font-display text-indigo-400 block mt-0.5">
            {triageStats.materialShortages}
          </span>
        </div>
      </div>

      {/* Main Workspace: Left Column Issues Feed + Right Column Deep Dive & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (4 cols): Issue Triage List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
              Detected Incidents ({issues.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Heuristic Engine</span>
          </div>

          <div className="space-y-3">
            {issues.map((issue) => {
              const isSelected = issue.id === selectedIssueId;
              const isCritical = issue.severity === 'critical';

              return (
                <div
                  key={issue.id}
                  onClick={() => setSelectedIssueId(issue.id)}
                  className={clsx(
                    'p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 relative overflow-hidden',
                    isSelected
                      ? 'bg-slate-900 border-teal-500 shadow-md ring-1 ring-teal-500/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  )}
                >
                  {isCritical && (
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-rose-500" />
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono font-bold text-xs text-rose-400">
                      {issue.issueCode}
                    </span>
                    <StatusBadge status={issue.severity} size="sm" />
                  </div>

                  <h4 className="text-xs font-bold text-white font-display mt-1.5 leading-snug">
                    {issue.title}
                  </h4>

                  <div className="mt-2 text-[11px] text-slate-400 space-y-0.5">
                    {issue.affectedOrderNumber && (
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-slate-300">{issue.affectedOrderNumber}</span>
                        <span className="text-slate-400 truncate">({issue.customerName})</span>
                      </div>
                    )}
                    {issue.affectedMachineName && (
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{issue.affectedMachineName}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{issue.detectionTime}</span>
                    <span
                      className={clsx(
                        'uppercase font-bold',
                        issue.status === 'approved' ? 'text-emerald-400' : 'text-amber-400'
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
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                      {activeIssue.issueCode}
                    </span>
                    <StatusBadge status={activeIssue.severity} size="sm" />
                    <span className="text-xs text-slate-400 font-mono">Detected: {activeIssue.detectionTime}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-display mt-1">
                    {activeIssue.title}
                  </h2>
                </div>

                {activeIssue.status === 'approved' && (
                  <div className="p-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-mono font-bold flex items-center gap-1.5 shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>PLAN APPROVED</span>
                  </div>
                )}
              </div>

              {/* What Happened & Likely Root Cause */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                    ROOT CAUSE DIAGNOSIS:
                  </span>
                  <p className="text-slate-200 leading-relaxed">{activeIssue.likelyCause}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1">
                  <span className="text-[10px] font-mono uppercase text-rose-400 block font-bold">
                    OPERATIONAL IMPACT ANALYSIS:
                  </span>
                  <div className="flex items-center gap-2 text-rose-300 font-mono font-bold text-xs">
                    <span>Delay: +{activeIssue.impactAnalysis.delayDays} Days</span>
                    <span>|</span>
                    <span>Cost: +${activeIssue.impactAnalysis.costImpactUsd}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">
                    {activeIssue.impactAnalysis.description}
                  </p>
                </div>
              </div>

              {/* Operational Telemetry Evidence Log */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-2">
                  Supporting Sensor Evidence & Heuristic Indicators
                </h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  {activeIssue.evidence.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-teal-400 font-mono">›</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approval status banner if already approved */}
              {activeIssue.status === 'approved' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 space-y-1">
                  <div className="flex items-center justify-between font-mono font-bold">
                    <span>Approved by: {activeIssue.approvedBy}</span>
                    <span>{activeIssue.approvedAt}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{activeIssue.executionStatus}</p>
                </div>
              )}
            </div>

            {/* 2. Recovery Plan Comparison Matrix */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">
                    Recommended Recovery Plans ({activeIssue.recoveryPlans.length} Options Generated)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Compare lead time recovery, additional expediting costs, and operational trade-offs.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-teal-400 uppercase">Everest Heuristics</span>
              </div>

              {/* Plan Cards Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {activeIssue.recoveryPlans.map((plan) => {
                  const isPlanSelected = plan.id === selectedPlanId;
                  const isFeasible = plan.feasibilityScorePercent >= 90;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={clsx(
                        'p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between',
                        isPlanSelected
                          ? 'bg-teal-950/30 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-[11px] text-teal-300 truncate">
                            {plan.planCode.split(' ')[0]}
                          </span>
                          <span
                            className={clsx(
                              'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                              isFeasible ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                            )}
                          >
                            {plan.feasibilityScorePercent}% Match
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-white font-display mt-1 line-clamp-2">
                          {plan.title}
                        </h4>

                        <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {plan.summary}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800 space-y-1 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Schedule Gain:</span>
                          <span className="font-bold text-emerald-400">{plan.estimatedDelayChangeDays} Days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Extra Cost:</span>
                          <span className="font-bold text-white">${plan.estimatedCostUsd}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 text-[11px]">Risk Profile:</span>
                          <span className="capitalize text-slate-300">{plan.riskLevel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Plan Deep-Dive & Action Controls */}
              {activePlan && (
                <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">
                        SELECTED PLAN EXECUTION STRATEGY:
                      </span>
                      <h4 className="text-sm font-bold text-white font-display mt-0.5">
                        {activePlan.title}
                      </h4>
                    </div>
                    <span className="font-mono text-slate-400">Score: {activePlan.feasibilityScorePercent}/100</span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{activePlan.strategyDescription}</p>

                  {/* Steps */}
                  <div>
                    <h5 className="font-bold text-white uppercase font-mono text-[10px] mb-2">
                      Operational Action Steps:
                    </h5>
                    <div className="space-y-1.5">
                      {activePlan.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-slate-300">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-teal-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pros & Cons Matrix */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/40 space-y-1">
                      <span className="font-bold text-emerald-400 text-[10px] font-mono uppercase flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" /> Advantages:
                      </span>
                      {activePlan.pros.map((p, idx) => (
                        <p key={idx} className="text-slate-300 text-[11px] leading-relaxed">
                          • {p}
                        </p>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 space-y-1">
                      <span className="font-bold text-amber-400 text-[10px] font-mono uppercase flex items-center gap-1">
                        <ThumbsDown className="w-3 h-3" /> Trade-offs / Risks:
                      </span>
                      {activePlan.cons.map((c, idx) => (
                        <p key={idx} className="text-slate-300 text-[11px] leading-relaxed">
                          • {c}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400">
                      Required Sign-off: <strong className="text-slate-200">{activePlan.requiredApprovals.join(', ')}</strong>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRejectModalOpen(true)}
                        className="w-full sm:w-auto"
                      >
                        Reject Plan
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => setApprovalModalOpen(true)}
                        leftIcon={<Check className="w-4 h-4" />}
                        className="w-full sm:w-auto font-bold shadow-lg"
                      >
                        Approve & Execute Plan
                      </Button>
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
                <span>Budget: +${activePlan.estimatedCostUsd}</span>
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
