import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, X, Layers, Cpu, FileText, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockMachines, mockOrders, mockInventory, mockRescueIssues } from '../../services/mock-data';

export const SearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const machineResults = mockMachines
      .filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.type.includes(q))
      .map((m) => ({
        id: m.id,
        category: 'Machine',
        icon: <Cpu className="w-4 h-4 text-teal-400" />,
        title: `${m.code} - ${m.name}`,
        subtitle: `Status: ${m.status.toUpperCase()} | Output: ${m.shiftOutputMeters}m`,
        url: `/production?select=${m.id}`,
      }));

    const orderResults = mockOrders
      .filter((o) => o.orderNumber.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.fabricType.toLowerCase().includes(q))
      .map((o) => ({
        id: o.id,
        category: 'Customer Order',
        icon: <FileText className="w-4 h-4 text-blue-400" />,
        title: `${o.orderNumber} — ${o.customerName}`,
        subtitle: `${o.fabricType} | ${o.orderedQuantity}m | ${o.status}`,
        url: `/orders?orderId=${o.id}`,
      }));

    const inventoryResults = mockInventory
      .filter((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q) || i.lotNumber.toLowerCase().includes(q))
      .map((i) => ({
        id: i.id,
        category: 'Inventory',
        icon: <Layers className="w-4 h-4 text-amber-400" />,
        title: `${i.sku} — ${i.name}`,
        subtitle: `Lot: ${i.lotNumber} | Stock: ${i.quantity} ${i.unit} (${i.status})`,
        url: `/inventory`,
      }));

    const rescueResults = mockRescueIssues
      .filter((r) => r.title.toLowerCase().includes(q) || r.issueCode.toLowerCase().includes(q) || r.likelyCause.toLowerCase().includes(q))
      .map((r) => ({
        id: r.id,
        category: 'Rescue Engine Issue',
        icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
        title: `${r.issueCode}: ${r.title}`,
        subtitle: `Severity: ${r.severity.toUpperCase()} | Status: ${r.status}`,
        url: `/rescue-engine?issueId=${r.id}`,
      }));

    return [...rescueResults, ...orderResults, ...machineResults, ...inventoryResults].slice(0, 8);
  }, [query]);

  if (!searchModalOpen) return null;

  const handleSelect = (url: string) => {
    setSearchModalOpen(false);
    setQuery('');
    navigate(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-none bg-white editorial-border shadow-2xl overflow-hidden text-[var(--color-ink)]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 bg-[var(--color-ink)] text-white">
          <Search className="w-4 h-4 text-[var(--color-vermilion)] shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search orders, looms, lots, defects, rescue plans... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-white placeholder:text-white/40 text-xs font-mono uppercase focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-white/60 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto bg-[var(--color-paper)] divide-y divide-[var(--color-light-border)]">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-xs">
              <p className="font-mono text-[10px] uppercase font-bold text-[var(--color-industrial-grey)] mb-1">
                OPERATIONAL SHORTCUTS
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => handleSelect('/rescue-engine')}
                  className="px-3 py-1.5 bg-white editorial-border hover:bg-[var(--color-paper)] text-[var(--color-ink)] font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[var(--color-vermilion)]" />
                  Rescue Engine
                </button>
                <button
                  onClick={() => handleSelect('/production')}
                  className="px-3 py-1.5 bg-white editorial-border hover:bg-[var(--color-paper)] text-[var(--color-ink)] font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                  Production Floor
                </button>
                <button
                  onClick={() => handleSelect('/orders')}
                  className="px-3 py-1.5 bg-white editorial-border hover:bg-[var(--color-paper)] text-[var(--color-ink)] font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-[var(--color-ink)]" />
                  Customer Orders
                </button>
                <button
                  onClick={() => handleSelect('/buyer/orders')}
                  className="px-3 py-1.5 bg-white editorial-border hover:bg-[var(--color-paper)] text-[var(--color-ink)] font-mono text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[var(--color-vermilion)]" />
                  Buyer Portal
                </button>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-industrial-grey)] font-mono text-xs">
              No matching orders, looms, or inventory records found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.url)}
                className="flex items-center justify-between p-3.5 bg-white hover:bg-[var(--color-paper)] cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-[var(--color-paper)] editorial-border shrink-0 text-[var(--color-ink)]">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-[var(--color-ink)] group-hover:text-[var(--color-vermilion)] transition-colors truncate">
                        {item.title}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-[var(--color-ink)] text-white uppercase font-mono font-bold shrink-0">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[var(--color-industrial-grey)] truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--color-industrial-grey)] group-hover:text-[var(--color-vermilion)] group-hover:translate-x-1 transition-all ml-2 shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[var(--color-paper)] border-t border-[var(--color-light-border)] flex items-center justify-between text-[10px] font-mono uppercase text-[var(--color-industrial-grey)]">
          <span>Navigate with cursor or keys</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
