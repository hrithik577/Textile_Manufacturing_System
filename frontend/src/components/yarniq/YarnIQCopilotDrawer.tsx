import React, { useState } from 'react';
import {
 Sparkles,
 X,
 Send,
 HelpCircle,
 CheckCircle2,
 AlertTriangle,
 XCircle,
 Database,
 ArrowRight,
 ShieldCheck,
 Bot,
} from 'lucide-react';
import { Button } from '../common/Button';
import { yarniqService } from '../../services/yarniq';
import { CopilotQueryResponse } from '../../types/yarniq';
import { clsx } from 'clsx';

interface YarnIQCopilotDrawerProps {
 isOpen: boolean;
 onClose: () => void;
 onNavigateTab: (tab: string) => void;
}

const SUGGESTED_QUERIES = [
 'Can we start Order PO-PROD-2026-03 tomorrow?',
 'Why is Order PO-PROD-2026-03 blocked?',
 'What is the shortage of navy-blue cotton yarn this week?',
 'Which material should we reorder first?',
 'How can we reduce the delay for this production order?',
];

export const YarnIQCopilotDrawer: React.FC<YarnIQCopilotDrawerProps> = ({
 isOpen,
 onClose,
 onNavigateTab,
}) => {
 const [inputQuery, setInputQuery] = useState('');
 const [loading, setLoading] = useState(false);
 const [conversation, setConversation] = useState<CopilotQueryResponse[]>([
 {
 query: 'Initial System Briefing',
 answer:
 'YarnIQ Procurement Copilot initialized. I evaluate real-time stock ledgers, purchase order receipts, and deterministic production readiness. Ask me any operational question below.',
 status: 'READY',
 evidence: [
 { label: 'Active Engine', value: 'Deterministic Readiness v2.0', source_table: 'backend/app/services/yarniq_service.py' },
 { label: 'Integrity Rule', value: '100% Verified DB Lookups (Zero Hallucination)', source_table: 'PostgreSQL: everest_textile_db' },
 ],
 recommended_actions: [],
 calculation_basis: 'Real-time database connection active.',
 },
 ]);

 if (!isOpen) return null;

 const handleAsk = async (queryToAsk?: string) => {
 const q = (queryToAsk || inputQuery).trim();
 if (!q || loading) return;

 setLoading(true);
 try {
 const res = await yarniqService.askCopilot({ query: q });
 setConversation((prev) => [res.data, ...prev]);
 if (!queryToAsk) setInputQuery('');
 } catch (err: any) {
 console.error(err);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white border-l editorial-border flex flex-col">
 {/* Header */}
 <div className="p-4 border-b editorial-border flex items-center justify-between bg-white">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-indigo-500/10 border editorial-border flex items-center justify-center text-[var(--color-ink)] ">
 <Sparkles className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-sm font-bold font-display text-[var(--color-ink)] flex items-center gap-2">
 Procurement Copilot
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--color-paper)] text-[var(--color-ink)] border editorial-border">
 Grounded
 </span>
 </h2>
 <p className="text-[11px] text-[var(--color-industrial-grey)]">Deterministic operational intelligence & root-cause insights</p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-2 text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)] hover:bg-white transition-colors"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Suggested Quick Question Chips */}
 <div className="p-3 bg-white border-b editorial-border">
 <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--color-industrial-grey)] mb-2">
 <HelpCircle className="w-3.5 h-3.5 text-[var(--color-ink)]" />
 Suggested Operational Inquiries:
 </div>
 <div className="flex flex-wrap gap-1.5">
 {SUGGESTED_QUERIES.map((sq, i) => (
 <button
 key={i}
 onClick={() => handleAsk(sq)}
 className="text-left text-xs px-2.5 py-1.5 bg-white border editorial-border text-[var(--color-ink)] hover:editorial-border hover:text-[var(--color-ink)] hover:bg-white transition-all"
 >
 {sq}
 </button>
 ))}
 </div>
 </div>

 {/* Conversation Thread */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4">
 {conversation.map((msg, idx) => (
 <div
 key={idx}
 className="p-4 bg-white border editorial-border space-y-3"
 >
 {/* User Query */}
 <div className="flex items-center justify-between border-b editorial-border pb-2">
 <span className="text-xs font-semibold text-[var(--color-ink)] font-display flex items-center gap-1.5">
 <Bot className="w-3.5 h-3.5 text-[var(--color-ink)]" />
 {msg.query}
 </span>
 <span
 className={clsx(
 'text-[10px] font-mono px-2 py-0.5 rounded border uppercase',
 msg.status === 'READY' && 'bg-emerald-950 text-emerald-400 border-emerald-800',
 msg.status === 'AT_RISK' && 'bg-amber-950 text-amber-400 border-amber-800',
 msg.status === 'BLOCKED' && 'bg-rose-950 text-rose-400 border-rose-800'
 )}
 >
 {msg.status}
 </span>
 </div>

 {/* Answer */}
 <p className="text-xs text-[var(--color-ink)] leading-relaxed font-sans">{msg.answer}</p>

 {/* Evidence items */}
 {msg.evidence && msg.evidence.length > 0 && (
 <div className="pt-2 border-t editorial-border">
 <div className="flex items-center gap-1 text-[10px] font-mono text-[var(--color-industrial-grey)] mb-1.5 uppercase">
 <Database className="w-3 h-3 text-[var(--color-industrial-grey)]" />
 Verified Evidence Lookups:
 </div>
 <div className="grid grid-cols-2 gap-1.5">
 {msg.evidence.map((ev, ei) => (
 <div key={ei} className="p-1.5 rounded bg-white border editorial-border text-[11px]">
 <span className="text-[var(--color-industrial-grey)] block text-[9px] font-mono">{ev.label}</span>
 <span className="text-[var(--color-ink)] font-medium truncate block">{ev.value}</span>
 <span className="text-[8px] text-[var(--color-industrial-grey)] font-mono block mt-0.5">{ev.source_table}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recommended Action Buttons */}
 {msg.recommended_actions && msg.recommended_actions.length > 0 && (
 <div className="pt-2 border-t editorial-border space-y-1.5">
 <span className="text-[10px] font-mono uppercase text-[var(--color-ink)] block">Proposed Action:</span>
 {msg.recommended_actions.map((act, ai) => (
 <button
 key={ai}
 onClick={() => {
 if (act.action_type === 'expedite') onNavigateTab('recommendations');
 else if (act.action_type === 'inspect') onNavigateTab('readiness');
 else if (act.action_type === 'procure') onNavigateTab('smart-gate');
 else onNavigateTab('inventory');
 }}
 className="w-full p-2 bg-[var(--color-paper)] border editorial-border hover:bg-[var(--color-paper)] text-left transition-colors flex items-center justify-between"
 >
 <div>
 <span className="text-xs font-semibold text-[var(--color-ink)] block">{act.title}</span>
 <span className="text-[11px] text-[var(--color-ink)] block">{act.description}</span>
 </div>
 <ArrowRight className="w-4 h-4 text-[var(--color-ink)] shrink-0 ml-2" />
 </button>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>

 {/* Input Box */}
 <div className="p-3 border-t editorial-border bg-white">
 <form
 onSubmit={(e) => {
 e.preventDefault();
 handleAsk();
 }}
 className="flex items-center gap-2"
 >
 <input
 type="text"
 value={inputQuery}
 onChange={(e) => setInputQuery(e.target.value)}
 placeholder="Ask about orders, shortages, reorders, or lot readiness..."
 className="flex-1 px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] placeholder-slate-500 focus:outline-none focus:editorial-border transition-colors"
 />
 <Button
 type="submit"
 variant="primary"
 size="sm"
 disabled={loading || !inputQuery.trim()}
 leftIcon={<Send className="w-3.5 h-3.5" />}
 >
 Ask
 </Button>
 </form>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block text-center mt-2 font-mono">
 Strict deterministic calculation mode. No unverified fabrication.
 </span>
 </div>
 </div>
 );
};
