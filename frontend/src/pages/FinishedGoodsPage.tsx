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
} from 'lucide-react';
import { FinishedGoodsRoll } from '../types';
import { dispatchService } from '../services/dispatch';
import { StatusBadge } from '../components/common/StatusBadge';
import { Button } from '../components/common/Button';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';

export const FinishedGoodsPage: React.FC = () => {
  const navigate = useNavigate();
  const [rolls, setRolls] = useState<FinishedGoodsRoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

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

      return matchesQuery && matchesGrade;
    });
  }, [rolls, searchQuery, selectedGrade]);

  const totalMeters = useMemo(() => {
    return rolls.reduce((sum, r) => sum + r.netLengthMeters, 0);
  }, [rolls]);

  const totalWeight = useMemo(() => {
    return rolls.reduce((sum, r) => sum + r.grossWeightKg, 0);
  }, [rolls]);

  if (loading) {
    return <LoadingState message="Loading finished goods warehouse inventory and roll barcodes..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Finished Goods Warehouse
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            QA-certified export fabric rolls, rack storage allocations, packaging weights, and staging bays.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/dispatch')}
          leftIcon={<Truck className="w-4 h-4" />}
        >
          Open Dispatch Console
        </Button>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Rolls Stored</span>
            <span className="text-2xl font-bold font-display text-white block mt-1">{rolls.length} Rolls</span>
          </div>
          <div className="p-2.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Total Net Meters</span>
            <span className="text-2xl font-bold font-display text-emerald-400 block mt-1">
              {totalMeters.toLocaleString()} m
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400">Gross Export Weight</span>
            <span className="text-2xl font-bold font-display text-indigo-400 block mt-1">
              {totalWeight.toFixed(1)} kg
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Barcode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
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

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Quality Grades</option>
            <option value="Grade A (Export)">Grade A (Export)</option>
            <option value="Grade B">Grade B</option>
          </select>
        </div>
      </div>

      {/* Rolls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRolls.map((roll) => (
          <div
            key={roll.id}
            className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3 hover:border-slate-700 transition-colors shadow-sm"
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
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                {roll.grade}
              </span>
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
              <div className="flex justify-between">
                <span className="text-slate-400">Warehouse Rack:</span>
                <span className="font-mono text-amber-400">{roll.warehouseLocation}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Inspector: {roll.inspectorName}</span>
              <button
                onClick={() => navigate(`/dispatch?orderNumber=${roll.orderNumber}`)}
                className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
              >
                Dispatch <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
