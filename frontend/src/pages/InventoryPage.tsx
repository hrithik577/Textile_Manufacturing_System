import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  PackageCheck,
  AlertOctagon,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { InventoryItem, StockMovement, InventoryCategory } from '../types';
import { inventoryService } from '../services/inventory';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const InventoryPage: React.FC = () => {
  const { addToast } = useApp();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'materials' | 'movements' | 'reorder'>('materials');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Stock Adjustment Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(100);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Routine physical audit variance reconciliation');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [invRes, movRes] = await Promise.all([
        inventoryService.getInventory(),
        inventoryService.getStockMovements(),
      ]);
      setItems(invRes.data);
      setMovements(movRes.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.lotNumber.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q);

      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesQuery && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.status === 'low_stock' || i.status === 'critical').length;
  }, [items]);

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;

    try {
      await inventoryService.recordStockAdjustment(
        selectedItemForAdjust.id,
        adjustmentQty,
        adjustmentReason
      );

      // Add movement log
      const newMovement: StockMovement = {
        id: `mov-${Date.now()}`,
        itemId: selectedItemForAdjust.id,
        itemName: selectedItemForAdjust.name,
        sku: selectedItemForAdjust.sku,
        type: adjustmentQty > 0 ? 'receipt' : 'scrap',
        quantity: Math.abs(adjustmentQty),
        unit: selectedItemForAdjust.unit,
        referenceNumber: `ADJ-AUDIT-${Math.floor(100 + Math.random() * 900)}`,
        performedBy: 'Vikram Mehta (Plant Mgr)',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        notes: adjustmentReason,
      };

      setMovements((prev) => [newMovement, ...prev]);
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItemForAdjust.id
            ? {
                ...i,
                quantity: i.quantity + adjustmentQty,
                availableQuantity: i.availableQuantity + adjustmentQty,
              }
            : i
        )
      );

      setAdjustmentModalOpen(false);
      addToast({
        type: 'success',
        title: 'Inventory Adjustment Recorded',
        message: `Updated balance for ${selectedItemForAdjust.sku}. Movement logged.`,
      });
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Adjustment Failed',
        message: err?.message,
      });
    }
  };

  if (loading) {
    return <LoadingState message="Fetching warehouse stock ledgers and movement logs..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Inventory & Supply Ledgers
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Authoritative warehouse stock levels, raw yarn, dyestuffs, chemicals, and stock audit trails.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('materials')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'materials' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              Stock Balances
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'movements' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <History className="w-3.5 h-3.5" />
              Movement Ledger
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInventoryData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Critical Low Stock Warning Banner */}
      {lowStockCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-display">
                Material Reorder Warning ({lowStockCount} Items Low)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong>Reactive Blue 220 Dye Powder (DYE-REC-BLU-220)</strong> is at 15 kg (critical threshold: 200 kg). Dyeing line DYE-02 is waiting for replenishment.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('dyes_chemicals');
              setSelectedStatus('critical');
            }}
            className="shrink-0 text-amber-300 border-amber-800 hover:bg-amber-950/60"
          >
            Filter Critical Dyes
          </Button>
        </div>
      )}

      {/* Tab 1: Materials & Chemicals Balances */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU, material name, lot number (LOT-2026-Y881), supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Categories</option>
                <option value="raw_yarn">Raw Yarn</option>
                <option value="dyes_chemicals">Dyes & Chemistry</option>
                <option value="greige_fabric">Greige Loom-State</option>
                <option value="packaging_material">Packaging</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="critical">Critical Low</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Material SKU & Description</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Lot Number</th>
                    <th className="px-4 py-3">Location (Rack/Bin)</th>
                    <th className="px-4 py-3">Total Qty</th>
                    <th className="px-4 py-3">Available / Reserved</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map((item) => {
                    const isLow = item.status === 'low_stock' || item.status === 'critical';

                    return (
                      <tr key={item.id} className="hover:bg-slate-800/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-white text-xs">{item.sku}</div>
                          <div className="text-[11px] text-slate-200 font-medium">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.specification}</div>
                        </td>

                        <td className="px-4 py-3 uppercase font-mono text-[10px] text-slate-400">
                          {item.category.replace(/_/g, ' ')}
                        </td>

                        <td className="px-4 py-3 font-mono text-teal-400 font-semibold">
                          {item.lotNumber}
                        </td>

                        <td className="px-4 py-3 text-slate-300">
                          <div className="font-mono text-xs text-slate-200">{item.warehouseRack}</div>
                          <div className="text-[10px] text-slate-400">{item.warehouseBin}</div>
                        </td>

                        <td className="px-4 py-3 font-mono font-bold text-white text-xs">
                          {item.quantity.toLocaleString()} {item.unit}
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-mono text-emerald-400 font-semibold">
                            {item.availableQuantity.toLocaleString()} {item.unit} avail
                          </div>
                          <div className="font-mono text-amber-400 text-[10px]">
                            {item.reservedQuantity.toLocaleString()} {item.unit} reserved
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <StatusBadge status={item.status} size="sm" />
                        </td>

                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItemForAdjust(item);
                              setAdjustmentModalOpen(true);
                            }}
                          >
                            Adjust
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movements Audit Ledger */}
      {activeTab === 'movements' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">
                Traceable Stock Movement Audit Trail
              </h3>
              <p className="text-xs text-slate-400">All inbound receipts, production issues, transfers, and scraps</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Immutable Ledger</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {movements.map((mov) => {
              const isReceipt = mov.type === 'receipt';
              return (
                <div key={mov.id} className="p-4 flex items-start justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg shrink-0',
                        isReceipt
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      )}
                    >
                      {isReceipt ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white">{mov.referenceNumber}</span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {mov.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-200 mt-0.5">{mov.itemName}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{mov.notes}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={clsx(
                        'font-mono font-bold text-xs',
                        isReceipt ? 'text-emerald-400' : 'text-slate-200'
                      )}
                    >
                      {isReceipt ? '+' : '-'}{mov.quantity.toLocaleString()} {mov.unit}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{mov.timestamp}</div>
                    <div className="text-[10px] text-slate-500">{mov.performedBy}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={adjustmentModalOpen}
        onClose={() => setAdjustmentModalOpen(false)}
        title={selectedItemForAdjust ? `Adjust Stock Balance: ${selectedItemForAdjust.sku}` : ''}
        subtitle="Record physical stock count variance or scrap. Requires plant audit rationale."
        maxWidth="md"
      >
        {selectedItemForAdjust && (
          <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Current Ledger Balance:</span>
                <span className="font-mono font-bold text-white">
                  {selectedItemForAdjust.quantity} {selectedItemForAdjust.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Warehouse Location:</span>
                <span className="font-mono text-teal-400">
                  {selectedItemForAdjust.warehouseRack} / {selectedItemForAdjust.warehouseBin}
                </span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Quantity Delta (+ for Inbound Receipt, - for Scrap / Issue)
              </label>
              <input
                type="number"
                required
                value={adjustmentQty}
                onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                Adjustment Reason / Audit Reference *
              </label>
              <input
                type="text"
                required
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="e.g. Physical inventory count variance reconciliation"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="secondary" size="sm" type="button" onClick={() => setAdjustmentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Commit Stock Adjustment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
