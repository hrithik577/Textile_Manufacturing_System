import React, { useState } from 'react';
import {
 FileText,
 Search,
 Filter,
 CheckCircle2,
 Clock,
 Layers,
 ArrowRight,
 ShieldCheck,
 ShieldAlert,
} from 'lucide-react';
import { StockLedgerEntry, StockTransactionType } from '../../types/yarniq';
import { clsx } from 'clsx';

interface YarnIQAuditLogTabProps {
 entries: StockLedgerEntry[];
}

export const YarnIQAuditLogTab: React.FC<YarnIQAuditLogTabProps> = ({ entries }) => {
 const [searchQuery, setSearchQuery] = useState('');
 const [typeFilter, setTypeFilter] = useState<string>('all');

 const filteredEntries = entries.filter((e) => {
 const q = searchQuery.toLowerCase();
 const matchesSearch =
 e.entry_number.toLowerCase().includes(q) ||
 e.sku.toLowerCase().includes(q) ||
 (e.lot_number && e.lot_number.toLowerCase().includes(q)) ||
 e.reference_id.toLowerCase().includes(q) ||
 (e.notes && e.notes.toLowerCase().includes(q));

 const matchesType = typeFilter === 'all' || e.transaction_type === typeFilter;
 return matchesSearch && matchesType;
 });

 return (
 <div className="space-y-4">
 {/* Search and Filters */}
 <div className="p-4 bg-white border editorial-border flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="relative w-full sm:w-80">
 <Search className="w-4 h-4 text-[var(--color-industrial-grey)] absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search entry #, SKU, lot, or reference..."
 className="w-full pl-9 pr-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] placeholder-slate-500 focus:outline-none focus:editorial-border"
 />
 </div>

 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border w-full sm:w-auto"
 >
 <option value="all">All Transaction Types</option>
 <option value="goods_receipt">Goods Receipt</option>
 <option value="reservation">Reservation</option>
 <option value="quality_hold">Quality Hold</option>
 <option value="quality_release">Quality Release</option>
 <option value="consumption">Consumption</option>
 <option value="adjustment">Adjustment</option>
 </select>
 </div>

 {/* Main Ledger Table */}
 <div className="border editorial-border bg-white overflow-hidden ">
 <div className="p-3 bg-white border-b editorial-border flex items-center justify-between">
 <span className="text-xs font-mono uppercase text-[var(--color-industrial-grey)] font-semibold flex items-center gap-2">
 <FileText className="w-4 h-4 text-[var(--color-ink)]" />
 Immutable Yarn Stock Ledger ({entries.length} Logged Entries)
 </span>
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)]">Append-Only Audit Trail</span>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-white text-[var(--color-industrial-grey)] font-mono uppercase text-[10px] border-b editorial-border tracking-wider">
 <tr>
 <th className="px-4 py-3">Entry #</th>
 <th className="px-4 py-3">Transaction Type</th>
 <th className="px-4 py-3">SKU & Yarn Name</th>
 <th className="px-4 py-3">Lot #</th>
 <th className="px-4 py-3 text-right">Quantity Delta (kg)</th>
 <th className="px-4 py-3 text-right">Balance Post (kg)</th>
 <th className="px-4 py-3">Reference</th>
 <th className="px-4 py-3">Timestamp</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/80">
 {filteredEntries.map((e) => {
 const isReceipt = e.transaction_type === 'goods_receipt';
 const isHold = e.transaction_type === 'quality_hold';
 const isReservation = e.transaction_type === 'reservation';

 return (
 <tr key={e.id} className="hover:bg-white transition-colors">
 <td className="px-4 py-3 font-mono font-bold text-[var(--color-ink)]">{e.entry_number}</td>

 <td className="px-4 py-3">
 <span
 className={clsx(
 'px-2 py-0.5 rounded text-[10px] font-mono uppercase border inline-block',
 isReceipt && 'bg-emerald-950 text-emerald-300 border-emerald-800',
 isReservation && 'bg-[var(--color-paper)] text-[var(--color-ink)] editorial-border',
 isHold && 'bg-amber-950 text-amber-300 border-amber-800'
 )}
 >
 {e.transaction_type.replace('_', ' ')}
 </span>
 </td>

 <td className="px-4 py-3">
 <span className="font-mono text-[var(--color-ink)] font-semibold block">{e.sku}</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">{e.yarn_name}</span>
 </td>

 <td className="px-4 py-3 font-mono text-[var(--color-ink)]">{e.lot_number || '-'}</td>

 <td className="px-4 py-3 text-right font-mono font-bold">
 <span className={clsx(isReceipt ? 'text-emerald-400' : 'text-[var(--color-ink)]')}>
 {isReceipt ? '+' : ''}
 {e.quantity_kg.toLocaleString()}
 </span>
 </td>

 <td className="px-4 py-3 text-right font-mono text-[var(--color-ink)] font-semibold">
 {e.balance_after_kg.toLocaleString()}
 </td>

 <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-industrial-grey)]">
 <span className="text-[var(--color-ink)] block">{e.reference_id}</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] uppercase">{e.reference_type}</span>
 </td>

 <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-industrial-grey)]">
 {new Date(e.timestamp).toLocaleString('en-IN', {
 dateStyle: 'short',
 timeStyle: 'short',
 })}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
};
