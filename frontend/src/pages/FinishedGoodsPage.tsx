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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--color-light-border)] editorial-border-b">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-[var(--color-ink)] uppercase tracking-tight">
            Finished Goods Ledger
          </h1>
          <p className="mt-2 text-sm font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest max-w-2xl">
            Real-time tracking of fabric on shelf vs dispatched, with aging alerts.
          </p>
        </div>

        <button
          onClick={() => navigate('/dispatch')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-ink)] text-white text-xs font-bold uppercase tracking-widest editorial-border hover:bg-black/80 transition-colors"
        >
          <Truck className="w-4 h-4" />
          Open Truck Dispatch Console
        </button>
      </div>

      {/* Summary KPI Grid: Sitting on Shelf vs Dispatched Out vs Aging */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* KPI 1: Sitting on the Shelf */}
        <div
          onClick={() => setSelectedStatusTab('in_warehouse')}
          className={clsx(
            'p-6 bg-white editorial-border cursor-pointer transition-colors',
            selectedStatusTab === 'in_warehouse'
              ? 'ring-2 ring-[var(--color-ink)] border-[var(--color-ink)]'
              : 'hover:bg-[var(--color-paper)]'
          )}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-light-border)] mb-4">
            <span className="text-xs font-mono uppercase text-[var(--color-ink)] font-bold tracking-widest">
              Sitting on Shelf
            </span>
            <div className="w-8 h-8 editorial-border flex items-center justify-center bg-[var(--color-paper)] text-[var(--color-ink)]">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <span className="text-4xl font-black font-display text-[var(--color-ink)] block">
            {shelfStats.sittingCount} <span className="text-lg">Rolls</span>
          </span>
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-industrial-grey)] mt-4 font-mono uppercase tracking-widest border-t border-[var(--color-light-border)] pt-4">
            <span>{shelfStats.sittingMeters.toLocaleString()} m</span>
            <span>{shelfStats.sittingWeightKg.toFixed(1)} kg</span>
          </div>
        </div>

        {/* KPI 2: Gone Out / Dispatched */}
        <div
          onClick={() => setSelectedStatusTab('dispatched')}
          className={clsx(
            'p-6 bg-white editorial-border cursor-pointer transition-colors',
            selectedStatusTab === 'dispatched'
              ? 'ring-2 ring-[var(--color-success-green)] border-[var(--color-success-green)]'
              : 'hover:bg-[var(--color-paper)]'
          )}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-light-border)] mb-4">
            <span className="text-xs font-mono uppercase text-[var(--color-success-green)] font-bold tracking-widest">
              Gone Out (Dispatched)
            </span>
            <div className="w-8 h-8 editorial-border flex items-center justify-center bg-[var(--color-paper)] text-[var(--color-success-green)] border-[var(--color-success-green)]">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <span className="text-4xl font-black font-display text-[var(--color-success-green)] block">
            {shelfStats.dispatchedCount} <span className="text-lg">Rolls</span>
          </span>
          <div className="flex items-center justify-between text-xs font-bold text-[var(--color-industrial-grey)] mt-4 font-mono uppercase tracking-widest border-t border-[var(--color-light-border)] pt-4">
            <span>{shelfStats.dispatchedMeters.toLocaleString()} m</span>
            <span>Locked</span>
          </div>
        </div>

        {/* KPI 3: Aging in Corner Radar */}
        <div
          onClick={() => setSelectedStatusTab('aging')}
          className={clsx(
            'p-6 bg-white editorial-border cursor-pointer transition-colors',
            selectedStatusTab === 'aging'
              ? 'ring-2 ring-[var(--color-vermilion)] border-[var(--color-vermilion)]'
              : shelfStats.agingCount > 0
              ? 'ring-1 ring-[var(--color-vermilion)] bg-[var(--color-paper)]'
              : 'hover:bg-[var(--color-paper)]'
          )}
        >
          <div className="flex items-center justify-between pb-4 border-b border-[var(--color-light-border)] mb-4">
            <span className={clsx(
              "text-xs font-mono uppercase font-bold tracking-widest",
              shelfStats.agingCount > 0 ? "text-[var(--color-vermilion)]" : "text-[var(--color-ink)]"
            )}>
              Aging (&gt;10 Days)
            </span>
            <div className={clsx(
              "w-8 h-8 editorial-border flex items-center justify-center bg-[var(--color-paper)]",
              shelfStats.agingCount > 0 ? "text-[var(--color-vermilion)] border-[var(--color-vermilion)]" : "text-[var(--color-ink)]"
            )}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <span className={clsx(
            "text-4xl font-black font-display block",
            shelfStats.agingCount > 0 ? "text-[var(--color-vermilion)]" : "text-[var(--color-ink)]"
          )}>
            {shelfStats.agingCount} <span className="text-lg">Rolls</span>
          </span>
          <p className="text-[10px] font-bold font-mono text-[var(--color-industrial-grey)] uppercase tracking-widest mt-4 border-t border-[var(--color-light-border)] pt-4">
            {shelfStats.agingCount > 0 ? (
              <span className="text-[var(--color-vermilion)]">Stored in Bay 1 / Rack C-14!</span>
            ) : (
              <span>Zero rolls forgotten in corners.</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-white editorial-border">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-[var(--color-industrial-grey)] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Roll Barcode (ROLL-8401), order number, customer, or rack location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[var(--color-light-border)] pl-12 pr-4 py-3 text-xs font-bold font-mono text-[var(--color-ink)] placeholder:text-[var(--color-industrial-grey)] focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] uppercase tracking-widest"
          />
        </div>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex bg-[var(--color-paper)] editorial-border p-1">
            <button
              onClick={() => setSelectedStatusTab('all')}
              className={clsx(
                'px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors',
                selectedStatusTab === 'all'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)]'
              )}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatusTab('in_warehouse')}
              className={clsx(
                'px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors',
                selectedStatusTab === 'in_warehouse'
                  ? 'bg-[var(--color-ink)] text-white'
                  : 'text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)]'
              )}
            >
              On Shelf
            </button>
            <button
              onClick={() => setSelectedStatusTab('dispatched')}
              className={clsx(
                'px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors',
                selectedStatusTab === 'dispatched'
                  ? 'bg-[var(--color-success-green)] text-white'
                  : 'text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)]'
              )}
            >
              Out
            </button>
            <button
              onClick={() => setSelectedStatusTab('aging')}
              className={clsx(
                'px-4 py-2 text-[10px] font-bold font-mono uppercase tracking-widest transition-colors',
                selectedStatusTab === 'aging'
                  ? 'bg-[var(--color-vermilion)] text-white'
                  : 'text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)]'
              )}
            >
              Aging
            </button>
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-white border border-[var(--color-light-border)] px-4 py-3 text-[10px] font-bold font-mono text-[var(--color-ink)] uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-[var(--color-ink)] shrink-0 editorial-border"
          >
            <option value="all">All Grades</option>
            <option value="Grade A (Export)">Grade A</option>
            <option value="Grade B (Quality Hold)">Grade B (Hold)</option>
          </select>
        </div>
      </div>

      {/* Rolls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRolls.map((roll) => {
          const ageDays = getRollAgeDays(roll.inspectionDate);
          const isAging = roll.status === 'in_warehouse' && ageDays >= 10;
          const isDispatched = roll.status === 'dispatched';

          return (
            <div
              key={roll.id}
              className={clsx(
                'editorial-border p-6 space-y-4 transition-colors',
                isDispatched
                  ? 'bg-[var(--color-paper)] opacity-75'
                  : isAging
                  ? 'bg-white ring-1 ring-[var(--color-vermilion)]'
                  : 'bg-white hover:bg-[var(--color-paper)]'
              )}
            >
              <div className="flex items-start justify-between border-b border-[var(--color-light-border)] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Barcode className="w-5 h-5 text-[var(--color-ink)]" />
                    <span className="font-mono font-black text-[var(--color-ink)] text-lg">{roll.rollBarcode}</span>
                  </div>
                  <p className="text-xs font-mono text-[var(--color-industrial-grey)] font-bold mt-1 uppercase tracking-widest">{roll.orderNumber}</p>
                  <p className="text-sm text-[var(--color-ink)] font-black uppercase tracking-tight mt-1">{roll.customerName}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={clsx(
                    'text-[10px] px-2 py-1 font-mono font-bold uppercase tracking-widest editorial-border',
                    roll.grade.includes('Grade B')
                      ? 'bg-white text-[var(--color-vermilion)] border-[var(--color-vermilion)]'
                      : 'bg-white text-[var(--color-success-green)] border-[var(--color-success-green)]'
                  )}>
                    {roll.grade.replace(' (Export)', '').replace(' (Quality Hold)', '')}
                  </span>
                  {isDispatched ? (
                    <span className="text-[10px] font-mono font-bold text-white bg-[var(--color-success-green)] px-2 py-1 editorial-border uppercase tracking-widest">
                      GONE OUT
                    </span>
                  ) : isAging ? (
                    <span className="text-[10px] font-mono font-bold text-white bg-[var(--color-vermilion)] px-2 py-1 editorial-border uppercase tracking-widest">
                      AGING {ageDays} DAYS
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-white bg-[var(--color-ink)] px-2 py-1 editorial-border uppercase tracking-widest">
                      ON SHELF
                    </span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-[var(--color-paper)] editorial-border space-y-2 text-xs font-mono font-bold uppercase tracking-widest">
                <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                  <span className="text-[var(--color-industrial-grey)]">Fabric:</span>
                  <span className="text-[var(--color-ink)] truncate max-w-[160px] text-right">{roll.fabricType}</span>
                </div>
                <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                  <span className="text-[var(--color-industrial-grey)]">Net Length:</span>
                  <span className="text-[var(--color-ink)] font-black text-sm">{roll.netLengthMeters} m</span>
                </div>
                <div className="flex justify-between items-end border-b border-dashed border-[var(--color-light-border)] pb-2">
                  <span className="text-[var(--color-industrial-grey)]">Gross Wgt:</span>
                  <span className="text-[var(--color-ink)]">{roll.grossWeightKg} kg</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--color-industrial-grey)]">Warehouse Shelf:</span>
                  <span className={clsx(
                    'font-black',
                    isAging ? 'text-[var(--color-vermilion)]' : isDispatched ? 'text-[var(--color-industrial-grey)] line-through' : 'text-[var(--color-ink)]'
                  )}>
                    {roll.warehouseLocation}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-4 font-mono font-bold uppercase tracking-widest">
                <span className="text-[var(--color-industrial-grey)]">Inspected: {roll.inspectionDate}</span>
                {!isDispatched ? (
                  <button
                    onClick={() => navigate(`/dispatch?orderNumber=${roll.orderNumber}`)}
                    className="text-[var(--color-ink)] hover:text-black font-black flex items-center gap-1 border-b border-[var(--color-ink)]"
                  >
                    Load Truck <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[var(--color-success-green)] font-black">✓ Dispatched</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
