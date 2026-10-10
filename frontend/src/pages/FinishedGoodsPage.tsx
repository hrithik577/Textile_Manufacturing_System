import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Search,
  Truck,
  CheckCircle2,
  Barcode,
  Layers,
  FileText,
  ExternalLink,
  ChevronRight,
  Filter,
  Clock,
  AlertTriangle,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { FinishedGoodsRoll } from '../types';
import { dispatchService } from '../services/dispatch';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const FinishedGoodsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rolls, setRolls] = useState<FinishedGoodsRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatusTab, setSelectedStatusTab] = useState<'all' | 'in_warehouse' | 'dispatched' | 'aging'>('all');

  useEffect(() => {
    loadFinishedGoods();
  }, []);

  const loadFinishedGoods = async () => {
    setLoading(true);
    try {
      const res = await dispatchService.getFinishedGoods();
      setRolls(res.data);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date('2026-10-10');

  // Compute aging for each roll
  const getRollAgeDays = (inspectionDate: string) => {
    const inspDate = new Date(inspectionDate);
    return Math.floor((today.getTime() - inspDate.getTime()) / (1000 * 3600 * 24));
  };

  const shelfStats = useMemo(() => {
    const sitting = rolls.filter((r) => r.status === 'in_warehouse');
    const dispatched = rolls.filter((r) => r.status === 'dispatched');
    const aging = sitting.filter((r) => getRollAgeDays(r.inspectionDate) >= 10);

    return {
      sittingCount: sitting.length,
      sittingMeters: sitting.reduce((s, r) => s + r.netLengthMeters, 0),
      sittingWeightKg: sitting.reduce((s, r) => s + r.grossWeightKg, 0),
      dispatchedCount: dispatched.length,
      dispatchedMeters: dispatched.reduce((s, r) => s + r.netLengthMeters, 0),
      agingCount: aging.length,
      agingMeters: aging.reduce((s, r) => s + r.netLengthMeters, 0),
    };
  }, [rolls]);

  const filteredRolls = useMemo(() => {
    return rolls.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesQuery =
        r.rollBarcode.toLowerCase().includes(q) ||
        r.orderNumber.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.fabricType.toLowerCase().includes(q) ||
        r.warehouseLocation.toLowerCase().includes(q);

      const matchesGrade = selectedGrade === 'all' || r.grade === selectedGrade;

      let matchesStatus = true;
      if (selectedStatusTab === 'in_warehouse') {
        matchesStatus = r.status === 'in_warehouse';
      } else if (selectedStatusTab === 'dispatched') {
        matchesStatus = r.status === 'dispatched';
      } else if (selectedStatusTab === 'aging') {
        matchesStatus = r.status === 'in_warehouse' && getRollAgeDays(r.inspectionDate) >= 10;
      }

      return matchesQuery && matchesGrade && matchesStatus;
    });
  }, [rolls, searchQuery, selectedGrade, selectedStatusTab]);

  if (loading) {
    return <LoadingState message="Loading finished goods warehouse inventory and roll barcodes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Finished Goods Warehouse & Store Shelf Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time tracking of fabric sitting on the shelf vs what has gone out, with automated aging alerts so nothing is forgotten in a corner.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/dispatch')}
          leftIcon={<Truck className="w-4 h-4" />}
        >
          Open Truck Dispatch Console
        </Button>
      </div>

      {/* Summary KPI Grid: Sitting on Shelf vs Dispatched Out vs Aging */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Sitting on the Shelf */}
        <div
          onClick={() => setSelectedStatusTab('in_warehouse')}
          className={clsx(
            'p-4 rounded-xl border cursor-pointer transition-all',
            selectedStatusTab === 'in_warehouse'
              ? 'bg-teal-950/40 border-teal-500 shadow-md ring-1 ring-teal-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">
              📦 SITTING ON STORE SHELF
            </span>
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-display text-white block mt-2">
            {shelfStats.sittingCount} Rolls
          </span>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>{shelfStats.sittingMeters.toLocaleString()} meters</span>
            <span>{shelfStats.sittingWeightKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* KPI 2: Gone Out / Dispatched */}
        <div
          onClick={() => setSelectedStatusTab('dispatched')}
          className={clsx(
            'p-4 rounded-xl border cursor-pointer transition-all',
            selectedStatusTab === 'dispatched'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
              🚚 GONE OUT (DISPATCHED)
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-display text-emerald-400 block mt-2">
            {shelfStats.dispatchedCount} Rolls
          </span>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-1 font-mono">
            <span>{shelfStats.dispatchedMeters.toLocaleString()} meters</span>
            <span>Locked from re-dispatch</span>
          </div>
        </div>

        {/* KPI 3: Aging in Corner Radar */}
        <div
          onClick={() => setSelectedStatusTab('aging')}
          className={clsx(
            'p-4 rounded-xl border cursor-pointer transition-all',
            selectedStatusTab === 'aging'
              ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/40'
              : shelfStats.agingCount > 0
              ? 'bg-amber-950/20 border-amber-600/50'
              : 'bg-slate-900 border-slate-800'
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-amber-300 font-bold">
              ⚠️ AGING IN CORNER (&gt;10 DAYS)
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-bold font-display text-amber-300 block mt-2">
            {shelfStats.agingCount} Rolls
          </span>
          <p className="text-[11px] text-slate-300 mt-1">
            {shelfStats.agingCount > 0 ? (
              <span>Stored in Bay 1 / Rack C-14 Corner for 14 days!</span>
            ) : (
              <span>Zero rolls forgotten in corners.</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Roll Barcode (ROLL-8401), order number, customer, or rack location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 sm:pb-0">
          {/* Status Tabs */}
          <button
            onClick={() => setSelectedStatusTab('all')}
            className={clsx(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors',
              selectedStatusTab === 'all'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            )}
          >
            All Rolls ({rolls.length})
          </button>
          <button
            onClick={() => setSelectedStatusTab('in_warehouse')}
            className={clsx(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors',
              selectedStatusTab === 'in_warehouse'
                ? 'bg-teal-950 text-teal-300 border border-teal-700'
                : 'text-slate-400 hover:text-white'
            )}
          >
            On Shelf ({shelfStats.sittingCount})
          </button>
          <button
            onClick={() => setSelectedStatusTab('dispatched')}
            className={clsx(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors',
              selectedStatusTab === 'dispatched'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Gone Out ({shelfStats.dispatchedCount})
          </button>
          <button
            onClick={() => setSelectedStatusTab('aging')}
            className={clsx(
              'px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors',
              selectedStatusTab === 'aging'
                ? 'bg-amber-950 text-amber-300 border border-amber-700'
                : 'text-slate-400 hover:text-white'
            )}
          >
            Aging Corner ({shelfStats.agingCount})
          </button>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500 shrink-0"
          >
            <option value="all">All Grades</option>
            <option value="Grade A (Export)">Grade A (Export)</option>
            <option value="Grade B (Quality Hold)">Grade B (Hold)</option>
          </select>
        </div>
      </div>

      {/* Rolls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRolls.map((roll) => {
          const ageDays = getRollAgeDays(roll.inspectionDate);
          const isAging = roll.status === 'in_warehouse' && ageDays >= 10;
          const isDispatched = roll.status === 'dispatched';

          return (
            <div
              key={roll.id}
              className={clsx(
                'rounded-xl border p-4 space-y-3 transition-colors shadow-sm',
                isDispatched
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  : isAging
                  ? 'bg-amber-950/20 border-amber-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-4 h-4 text-teal-400" />
                    <span className="font-mono font-bold text-white text-sm">{roll.rollBarcode}</span>
                  </div>
                  <p className="text-[11px] font-mono text-teal-400 font-semibold mt-0.5">{roll.orderNumber}</p>
                  <p className="text-xs text-slate-300 font-medium">{roll.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={clsx(
                    'text-[10px] px-2 py-0.5 rounded font-mono',
                    roll.grade.includes('Grade B')
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  )}>
                    {roll.grade}
                  </span>
                  {isDispatched ? (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700">
                      GONE OUT
                    </span>
                  ) : isAging ? (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-700">
                      AGING {ageDays} DAYS
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
                      ON SHELF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Fabric:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[160px]">{roll.fabricType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Net Length:</span>
                  <span className="font-mono font-bold text-white">{roll.netLengthMeters} meters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gross Weight:</span>
                  <span className="font-mono text-slate-300">{roll.grossWeightKg} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Warehouse Shelf:</span>
                  <span className={clsx(
                    'font-mono text-xs font-semibold',
                    isAging ? 'text-amber-400 font-bold' : isDispatched ? 'text-slate-500 line-through' : 'text-teal-300'
                  )}>
                    {roll.warehouseLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Inspected: {roll.inspectionDate}</span>
                {!isDispatched ? (
                  <button
                    onClick={() => navigate(`/dispatch?orderNumber=${roll.orderNumber}`)}
                    className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 font-mono"
                  >
                    Load Truck <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-emerald-400 font-mono text-[10px]">✓ Dispatched</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
