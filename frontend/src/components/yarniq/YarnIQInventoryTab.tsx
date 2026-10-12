import React, { useState, useMemo } from 'react';
import {
 Search,
 Filter,
 Layers,
 ShieldAlert,
 ShieldCheck,
 Clock,
 ChevronRight,
 ExternalLink,
 Package,
 Sparkles,
} from 'lucide-react';
import { YarnLot, QualityStatus } from '../../types/yarniq';
import { clsx } from 'clsx';

interface YarnIQInventoryTabProps {
 lots: YarnLot[];
 onSelectLot: (lotNumber: string) => void;
 onNavigateTab: (tab: string) => void;
}

export const YarnIQInventoryTab: React.FC<YarnIQInventoryTabProps> = ({
 lots,
 onSelectLot,
 onNavigateTab,
}) => {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedQuality, setSelectedQuality] = useState<string>('all');
 const [selectedFiber, setSelectedFiber] = useState<string>('all');

 // Extract unique fiber compositions for filter
 const uniqueFibers = useMemo(() => {
 return Array.from(new Set(lots.map((l) => l.fibre_composition)));
 }, [lots]);

 const filteredLots = useMemo(() => {
 return lots.filter((l) => {
 const q = searchQuery.toLowerCase();
 const matchesSearch =
 l.lot_number.toLowerCase().includes(q) ||
 l.sku.toLowerCase().includes(q) ||
 l.name.toLowerCase().includes(q) ||
 l.supplier_name.toLowerCase().includes(q) ||
 l.color_name.toLowerCase().includes(q);

 const matchesQuality = selectedQuality === 'all' || l.quality_status === selectedQuality;
 const matchesFiber = selectedFiber === 'all' || l.fibre_composition === selectedFiber;

 return matchesSearch && matchesQuality && matchesFiber;
 });
 }, [lots, searchQuery, selectedQuality, selectedFiber]);

 return (
 <div className="space-y-4">
 {/* Search and Filters Bar */}
 <div className="p-4 bg-white border editorial-border flex flex-col sm:flex-row items-center justify-between gap-3">
 {/* Search Input */}
 <div className="relative w-full sm:w-80">
 <Search className="w-4 h-4 text-[var(--color-industrial-grey)] absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search lot number, SKU, yarn count, supplier..."
 className="w-full pl-9 pr-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] placeholder-slate-500 focus:outline-none focus:editorial-border"
 />
 </div>

 {/* Filter Dropdowns */}
 <div className="flex items-center gap-2 w-full sm:w-auto">
 <select
 value={selectedQuality}
 onChange={(e) => setSelectedQuality(e.target.value)}
 className="px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 >
 <option value="all">All Quality Statuses</option>
 <option value="approved">Approved (Usable)</option>
 <option value="quarantined">Quarantined (Excluded)</option>
 <option value="pending">Pending QA Check</option>
 </select>

 <select
 value={selectedFiber}
 onChange={(e) => setSelectedFiber(e.target.value)}
 className="px-3 py-2 text-xs bg-white border editorial-border text-[var(--color-ink)] focus:outline-none focus:editorial-border"
 >
 <option value="all">All Fiber Blends</option>
 {uniqueFibers.map((f, i) => (
 <option key={i} value={f}>
 {f}
 </option>
 ))}
 </select>

 <button
 onClick={() => onNavigateTab('ledger')}
 className="text-xs px-3 py-2 bg-white hover:bg-white text-[var(--color-ink)] border editorial-border font-mono transition-colors shrink-0"
 >
 Audit Ledger
 </button>
 </div>
 </div>

 {/* Main Inventory Table */}
 <div className="border editorial-border bg-white overflow-hidden ">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-white text-[var(--color-industrial-grey)] font-mono uppercase text-[10px] border-b editorial-border tracking-wider">
 <tr>
 <th className="px-4 py-3">Lot # / SKU</th>
 <th className="px-4 py-3">Yarn Count & Type</th>
 <th className="px-4 py-3">Color Shade</th>
 <th className="px-4 py-3">Supplier</th>
 <th className="px-4 py-3">Location</th>
 <th className="px-4 py-3 text-right">Physical (kg)</th>
 <th className="px-4 py-3 text-right">Reserved (kg)</th>
 <th className="px-4 py-3 text-right">Usable (kg)</th>
 <th className="px-4 py-3 text-center">Quality Status</th>
 <th className="px-4 py-3 text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/80">
 {filteredLots.length === 0 ? (
 <tr>
 <td colSpan={10} className="px-4 py-8 text-center text-[var(--color-industrial-grey)]">
 No yarn lots match the selected search criteria.
 </td>
 </tr>
 ) : (
 filteredLots.map((lot) => {
 const isQuarantined = lot.quality_status === 'quarantined';
 const isApproved = lot.quality_status === 'approved';
 return (
 <tr
 key={lot.id}
 className={clsx(
 'hover:bg-white transition-colors',
 isQuarantined && 'bg-amber-950/20'
 )}
 >
 {/* Lot # & SKU */}
 <td className="px-4 py-3">
 <span className="font-mono font-bold text-[var(--color-ink)] block">{lot.lot_number}</span>
 <span className="text-[10px] font-mono text-[var(--color-industrial-grey)]">{lot.sku}</span>
 </td>

 {/* Count & Type */}
 <td className="px-4 py-3">
 <span className="font-semibold text-[var(--color-ink)] block">{lot.yarn_count}</span>
 <span className="text-[10px] text-[var(--color-industrial-grey)] block">{lot.fibre_composition}</span>
 </td>

 {/* Color Shade */}
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <span
 className="w-3.5 h-3.5 border editorial-border shrink-0 "
 style={{ backgroundColor: lot.color_code }}
 />
 <span className="text-[var(--color-ink)] truncate max-w-[110px]">{lot.color_name}</span>
 </div>
 </td>

 {/* Supplier */}
 <td className="px-4 py-3 text-[var(--color-ink)] font-sans">{lot.supplier_name}</td>

 {/* Storage Location */}
 <td className="px-4 py-3 font-mono text-[11px] text-[var(--color-industrial-grey)]">{lot.storage_location}</td>

 {/* Physical Stock */}
 <td className="px-4 py-3 text-right font-mono text-[var(--color-ink)]">
 {lot.physical_quantity_kg.toLocaleString()}
 </td>

 {/* Reserved Stock */}
 <td className="px-4 py-3 text-right font-mono text-[var(--color-ink)] font-semibold">
 {lot.reserved_quantity_kg > 0 ? `${lot.reserved_quantity_kg.toLocaleString()}` : '-'}
 </td>

 {/* Usable Stock */}
 <td className="px-4 py-3 text-right font-mono">
 {isQuarantined ? (
 <span className="text-amber-400 font-bold">0.0 (Held)</span>
 ) : (
 <span className="text-[var(--color-ink)] font-bold font-mono">
 {lot.available_quantity_kg.toLocaleString()}
 </span>
 )}
 </td>

 {/* Quality Status Badge */}
 <td className="px-4 py-3 text-center">
 <span
 className={clsx(
 'px-2 py-0.5 rounded text-[10px] font-mono uppercase inline-flex items-center gap-1 border',
 isApproved && 'bg-emerald-950 text-emerald-300 border-emerald-800',
 isQuarantined && 'bg-amber-950 text-amber-300 border-amber-800 font-bold',
 lot.quality_status === 'pending' && 'bg-blue-950 text-blue-300 border-blue-800'
 )}
 >
 {isApproved && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
 {isQuarantined && <ShieldAlert className="w-3 h-3 text-amber-400" />}
 {lot.quality_status}
 </span>
 </td>

 {/* Action */}
 <td className="px-4 py-3 text-right">
 <button
 onClick={() => {
 onSelectLot(lot.lot_number);
 onNavigateTab('traceability');
 }}
 className="px-2.5 py-1 text-xs rounded bg-white hover:bg-white text-[var(--color-ink)] border editorial-border transition-colors font-mono inline-flex items-center gap-1"
 >
 Trace <ChevronRight className="w-3 h-3" />
 </button>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>

 {/* Footer Summary */}
 <div className="p-3 bg-white border-t editorial-border flex items-center justify-between text-xs text-[var(--color-industrial-grey)] font-mono">
 <span>Showing {filteredLots.length} traceable yarn lots</span>
 <span>Units: Kilograms (kg) | Double-counting strictly prevented</span>
 </div>
 </div>
 </div>
 );
};
