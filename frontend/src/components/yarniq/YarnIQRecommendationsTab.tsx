import React, { useState } from 'react';
import {
 Sparkles,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 Clock,
 ArrowRight,
 ShieldCheck,
 Send,
 RotateCcw,
} from 'lucide-react';
import { Button } from '../common/Button';
import { YarnRecommendation, RecommendationStatus } from '../../types/yarniq';
import { yarniqService } from '../../services/yarniq';
import { useApp } from '../../context/AppContext';
import { clsx } from 'clsx';

interface YarnIQRecommendationsTabProps {
 recommendations: YarnRecommendation[];
 onRefreshData: () => void;
 onNavigateTab: (tab: string) => void;
}

export const YarnIQRecommendationsTab: React.FC<YarnIQRecommendationsTabProps> = ({
 recommendations,
 onRefreshData,
 onNavigateTab,
}) => {
 const { addToast } = useApp();
 const [processingId, setProcessingId] = useState<number | null>(null);

 const handleAction = async (recId: number, action: 'approve' | 'reject' | 'execute') => {
 setProcessingId(recId);
 try {
 const res = await yarniqService.handleRecommendationAction(recId, action);
 addToast({
 type: action === 'approve' ? 'success' : action === 'reject' ? 'warning' : 'info',
 title: action === 'approve' ? 'Action Approved' : 'Action Updated',
 message: res.data.message || 'Recommendation updated successfully.',
 });
 onRefreshData();
 } catch (err: any) {
 addToast({
 type: 'danger',
 title: 'Action Error',
 message: err.message || 'Failed to update recommendation.',
 });
 } finally {
 setProcessingId(null);
 }
 };

 return (
 <div className="space-y-6">
 {/* Top Banner */}
 <div className="p-4 bg-white border editorial-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
 <div>
 <h2 className="text-base font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-[var(--color-ink)]" />
 Corrective Action Recommendations & Shortage Prevention
 </h2>
 <p className="text-xs text-[var(--color-industrial-grey)] mt-1">
 YarnIQ evaluates active bottlenecks and formulates transparent proposals (hot-freight expedite, lab de-humidification, stock reallocation).
 </p>
 </div>

 <span className="text-xs font-mono text-[var(--color-industrial-grey)]">
 Ranked by Shortage Recovery & Loom Lead-time Impact
 </span>
 </div>

 {/* Recommendations Cards Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {recommendations.map((rec) => {
 const isCritical = rec.priority === 'critical';
 const isApproved = rec.status === 'approved';
 const isProposed = rec.status === 'proposed';

 return (
 <div
 key={rec.id}
 className={clsx(
 'p-5 border transition-all space-y-4 ',
 isApproved
 ? 'bg-white border-emerald-500/40 ring-1 ring-emerald-500/20'
 : isCritical
 ? 'bg-white border-rose-500/40 ring-1 ring-rose-500/20'
 : 'bg-white editorial-border'
 )}
 >
 {/* Header */}
 <div className="flex items-start justify-between gap-3 border-b editorial-border pb-3">
 <div>
 <div className="flex items-center gap-2">
 <span className="font-mono font-bold text-xs text-[var(--color-ink)]">
 {rec.recommendation_code}
 </span>
 <span
 className={clsx(
 'text-[10px] font-mono px-2 py-0.5 rounded uppercase border font-bold',
 rec.priority === 'critical' && 'bg-rose-950 text-rose-300 border-rose-800',
 rec.priority === 'high' && 'bg-amber-950 text-amber-300 border-amber-800',
 rec.priority === 'medium' && 'bg-blue-950 text-blue-300 border-blue-800'
 )}
 >
 {rec.priority} PRIORITY
 </span>
 </div>
 <h3 className="text-sm font-bold font-display text-[var(--color-ink)] mt-1">{rec.title}</h3>
 </div>

 <span
 className={clsx(
 'px-2 py-0.5 rounded text-[10px] font-mono uppercase border shrink-0',
 rec.status === 'approved' && 'bg-emerald-950 text-emerald-400 border-emerald-800 font-bold',
 rec.status === 'proposed' && 'bg-white text-[var(--color-ink)] editorial-border',
 rec.status === 'rejected' && 'bg-rose-950 text-rose-400 border-rose-800'
 )}
 >
 {rec.status}
 </span>
 </div>

 {/* Problem & Proposed Action */}
 <div className="space-y-2 text-xs">
 <div>
 <span className="text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] block font-bold">
 Detected Bottleneck:
 </span>
 <p className="text-[var(--color-ink)] leading-relaxed mt-0.5">{rec.problem_statement}</p>
 </div>

 <div className="p-3 bg-white border editorial-border">
 <span className="text-[10px] font-mono uppercase text-[var(--color-ink)] block font-bold">
 Proposed Actionable Remediation:
 </span>
 <p className="text-[var(--color-ink)] font-medium mt-0.5">{rec.proposed_action}</p>
 </div>
 </div>

 {/* Benefits & Tradeoffs */}
 <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t editorial-border">
 <div className="p-2 rounded bg-emerald-950/20 border border-emerald-900/40 text-emerald-300">
 <span className="block font-bold text-[9px] uppercase">Expected Benefit:</span>
 <span className="block mt-0.5 font-sans leading-tight">{rec.expected_benefit}</span>
 </div>

 <div className="p-2 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300">
 <span className="block font-bold text-[9px] uppercase">Risks & Trade-offs:</span>
 <span className="block mt-0.5 font-sans leading-tight">{rec.risks_tradeoffs}</span>
 </div>
 </div>

 {/* Shortage Resolved & Action Buttons */}
 <div className="flex items-center justify-between pt-2 border-t editorial-border">
 <span className="text-xs font-mono text-[var(--color-industrial-grey)]">
 Shortage Resolved:{' '}
 <span className="text-[var(--color-ink)] font-bold">{rec.shortage_resolved_kg} kg</span>
 </span>

 <div className="flex items-center gap-2">
 {isProposed ? (
 <>
 <button
 onClick={() => handleAction(rec.id, 'reject')}
 disabled={processingId === rec.id}
 className="px-2.5 py-1 text-xs rounded bg-white hover:bg-white text-[var(--color-industrial-grey)] font-mono transition-colors"
 >
 Dismiss
 </button>
 <button
 onClick={() => handleAction(rec.id, 'approve')}
 disabled={processingId === rec.id}
 className="px-3 py-1.5 text-xs bg-[var(--color-paper)] hover:bg-teal-500 text-[var(--color-ink)] font-mono font-bold transition-all flex items-center gap-1.5"
 >
 <CheckCircle2 className="w-3.5 h-3.5" /> Approve Action
 </button>
 </>
 ) : (
 <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
 <ShieldCheck className="w-4 h-4" /> Action Approved
 </span>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
};
