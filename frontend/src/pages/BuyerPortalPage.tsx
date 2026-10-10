import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  FileCheck,
  Download,
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Package,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { clsx } from 'clsx';

export const BuyerPortalPage: React.FC = () => {
  // Nordic Apparel Group buyer view
  const buyerOrders = [
    {
      id: 'ord-100',
      orderNumber: 'ORD-2026-084',
      customerPo: 'PO-NOR-9921',
      buyerCompany: 'Nordic Apparel Corp (Stockholm, Sweden)',
      fabricType: '100% Combed Cotton Single Jersey (Organic)',
      color: 'Nordic Navy (Pantone 19-4024 TCX)',
      gsm: 180,
      width: '62 inches tubular',
      orderedMeters: 12000,
      approvedInspectedMeters: 11400,
      allocatedRolls: 24,
      status: 'ready_to_dispatch',
      orderDate: '2026-09-15',
      deadlineDate: '2026-10-14',
      estimatedDelivery: '2026-10-11 (3 Days Ahead)',
      currentStage: 'Packing & Shipment Staging',
      progressPercent: 95,
      carrier: 'Maersk Line Integrated Logistics',
      trackingNumber: 'MSK-EU-99214482',
      qualityReport: {
        passRate: '100% Grade A (Export Quality)',
        labTestDeltaE: '0.28 (Within strict tolerance)',
        dimensionalStability: '-2.1% (Pass < 3.0%)',
        certificateNumber: 'CERT-QA-2026-8812',
      },
    },
    {
      id: 'ord-105',
      orderNumber: 'ORD-2026-071',
      customerPo: 'PO-NOR-9840',
      buyerCompany: 'Nordic Apparel Corp',
      fabricType: 'French Terry 100% Organic Cotton',
      color: 'Heather Charcoal',
      gsm: 320,
      width: '60 inches open width',
      orderedMeters: 8000,
      approvedInspectedMeters: 8000,
      allocatedRolls: 16,
      status: 'completed',
      orderDate: '2026-08-20',
      deadlineDate: '2026-09-28',
      estimatedDelivery: '2026-09-25 (Delivered)',
      currentStage: 'Delivered to Gothenburg Hub',
      progressPercent: 100,
      carrier: 'DHL Global Forwarding',
      trackingNumber: 'DHL-EU-8840112',
      qualityReport: {
        passRate: '100% Grade A',
        labTestDeltaE: '0.35',
        dimensionalStability: '-1.8%',
        certificateNumber: 'CERT-QA-2026-7790',
      },
    },
  ];

  const [activeOrder, setActiveOrder] = useState(buyerOrders[0]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Buyer Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(20,184,166,0.3)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white tracking-tight">
                  Nordic Apparel Sourcing Portal
                </h1>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
                  Certified Buyer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Direct mill order tracking, certified lab test certificates, and dispatch logistics for Nordic Apparel Corp.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">AUTHENTICATED ACCOUNT:</span>
            <span className="text-xs font-bold text-white">sarah.j@nordicapparel.com</span>
          </div>
        </div>
      </div>

      {/* Orders Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {buyerOrders.map((order) => {
          const isSelected = order.id === activeOrder.id;

          return (
            <div
              key={order.id}
              onClick={() => setActiveOrder(order)}
              className={clsx(
                'p-5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative overflow-hidden',
                isSelected
                  ? 'bg-slate-900 border-teal-500 shadow-lg ring-1 ring-teal-500/40'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-white">{order.orderNumber}</span>
                  <span className="text-xs text-slate-400 block mt-0.5">PO: {order.customerPo}</span>
                </div>
                <StatusBadge status={order.status} size="sm" />
              </div>

              <p className="text-xs font-semibold text-slate-200 mt-3">{order.fabricType}</p>
              <p className="text-[11px] text-teal-400 font-mono mt-0.5">{order.color}</p>

              {/* Progress */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400 text-[11px]">Production Progress</span>
                  <span className="font-bold text-white">{order.progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${order.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{order.orderedMeters.toLocaleString()} meters</span>
                <span className="text-emerald-400 font-semibold">{order.estimatedDelivery}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Order Detailed Tracking Dashboard */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-sm">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-base text-white">{activeOrder.orderNumber}</span>
              <span className="text-xs font-mono text-slate-400">({activeOrder.customerPo})</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">{activeOrder.fabricType}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => alert(`Downloading Quality Certificate: ${activeOrder.qualityReport.certificateNumber}`)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              QA Test Certificate
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => alert(`Tracking shipment via ${activeOrder.carrier}: ${activeOrder.trackingNumber}`)}
              leftIcon={<Truck className="w-3.5 h-3.5" />}
            >
              Track Carrier
            </Button>
          </div>
        </div>

        {/* Milestone Tracker */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-4">
            Production & Delivery Milestones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>1. Yarn & Weaving</span>
              </div>
              <p className="text-slate-400 text-[11px]">100% Organic Ring Spun Completed</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>2. Eco Dyeing</span>
              </div>
              <p className="text-slate-400 text-[11px]">Nordic Navy Shade Certified</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>3. QA Inspection</span>
              </div>
              <p className="text-slate-400 text-[11px]">24 Export Rolls Graded Grade A</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-teal-500/60 space-y-1">
              <div className="flex items-center gap-1.5 text-teal-300 font-bold">
                <Truck className="w-4 h-4" />
                <span>4. Shipment Staged</span>
              </div>
              <p className="text-slate-400 text-[11px] font-mono">Maersk Ocean Container</p>
            </div>
          </div>
        </div>

        {/* EXACT LIVE FLOOR STATUS RADAR (Whether still being woven, checked, or ready to ship) */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-teal-950/40 via-slate-950 to-slate-950 border border-teal-500/40 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div>
                <h4 className="text-sm font-bold font-display text-white">
                  Mill Digital Twin · Live Factory Status (Zero Delay)
                </h4>
                <p className="text-xs text-slate-400">
                  Real-time telemetry direct from looms, dye vats, inspection frames, and warehouse dispatch gates.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold shrink-0">
              ● Live Floor Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 1. Being Woven? */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-mono">1. Weaving Looms</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  100% COMPLETE
                </span>
              </div>
              <p className="font-semibold text-white mt-1">Air Jet Loom #W-04 (Weave Shed B)</p>
              <p className="text-[11px] text-slate-400">12,000m woven at 720 RPM. Zero fabric defects reported during greige cut.</p>
            </div>

            {/* 2. Being Checked? */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-mono">2. QA Inspection Frame</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  PASSED & CERTIFIED
                </span>
              </div>
              <p className="font-semibold text-white mt-1">Inspection Frame INSP-02 (QA Lab A)</p>
              <p className="text-[11px] text-slate-400">All 24 rolls inspected by David Chen. 100% Grade A certified export quality.</p>
            </div>

            {/* 3. Ready to Ship? */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-teal-500/40 space-y-1 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px] font-mono">3. Dispatch Warehouse</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-700 font-mono font-bold">
                  READY TO SHIP
                </span>
              </div>
              <p className="font-semibold text-teal-300 mt-1">Warehouse Bay 2 · Rack FG-B2</p>
              <p className="text-[11px] text-slate-300">Staged on Pallet P-14. Scheduled for container loading tomorrow at 14:00 IST.</p>
            </div>
          </div>
        </div>

        {/* Certified Quality Lab Summary */}
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs font-display">
              <ShieldCheck className="w-5 h-5" />
              <span>Certified Mill Laboratory Audit Results</span>
            </div>
            <span className="text-xs font-mono text-slate-400">{activeOrder.qualityReport.certificateNumber}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">4-Point Pass Rate:</span>
              <span className="text-sm font-bold text-emerald-400 block mt-0.5">
                {activeOrder.qualityReport.passRate}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Spectrophotometer Delta E:</span>
              <span className="text-sm font-bold text-teal-400 block mt-0.5">
                {activeOrder.qualityReport.labTestDeltaE}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Wash Shrinkage Tolerance:</span>
              <span className="text-sm font-bold text-white block mt-0.5">
                {activeOrder.qualityReport.dimensionalStability}
              </span>
            </div>
          </div>
        </div>

        {/* Shipment Details */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">FREIGHT LOGISTICS & CARRIER:</span>
            <p className="font-bold text-white mt-0.5">{activeOrder.carrier}</p>
            <p className="text-slate-400 font-mono mt-0.5">Tracking Number: {activeOrder.trackingNumber}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">ESTIMATED PORT ARRIVAL:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">{activeOrder.estimatedDelivery}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
