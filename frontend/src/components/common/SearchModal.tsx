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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <input
            type="text"
            placeholder="Search orders, machines, yarn lots, dye batches, rescue issues... (Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent border-none text-white placeholder:text-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-slate-800/50">
          {query.trim() === '' ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              <p className="font-medium text-slate-400 mb-1">Quick Navigation Suggestions</p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                <button
                  onClick={() => handleSelect('/rescue-engine')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Everest Rescue Engine
                </button>
                <button
                  onClick={() => handleSelect('/production')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <Cpu className="w-3.5 h-3.5 text-teal-400" />
                  Production Floor
                </button>
                <button
                  onClick={() => handleSelect('/orders')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  Customer Orders
                </button>
                <button
                  onClick={() => handleSelect('/buyer/orders')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Buyer Portal
                </button>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No matching orders, machines, or inventory records found for "{query}".
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.url)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/90 cursor-pointer transition-colors group"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate font-display group-hover:text-teal-300 transition-colors">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-mono">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0 group-hover:text-teal-400" />
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Navigate with mouse or keyboard</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
