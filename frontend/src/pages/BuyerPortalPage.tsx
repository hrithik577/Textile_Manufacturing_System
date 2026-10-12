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
      <div className="p-6 bg-[var(--color-ink)] text-white editorial-border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-vermilion)] text-white flex items-center justify-center shrink-0 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black font-mono tracking-widest uppercase text-white">
                  Nordic Apparel Sourcing Portal
                </h1>
                <span className="text-[9px] font-mono uppercase px-2 py-0.5 bg-[var(--color-vermilion)] text-white font-bold">
                  Certified Buyer
                </span>
              </div>
              <p className="text-xs font-mono text-white/50 mt-1 uppercase">
                Direct mill order tracking, certified lab test certificates, and dispatch logistics for Nordic Apparel Corp.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0 font-mono text-xs">
            <span className="text-[9px] uppercase text-white/40 block">AUTHENTICATED ACCOUNT:</span>
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
                'p-5 editorial-border text-left cursor-pointer transition-colors',
                isSelected
                  ? 'bg-white border-2 border-[var(--color-vermilion)]'
                  : 'bg-white hover:bg-[var(--color-paper)]'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[var(--color-ink)]">{order.orderNumber}</span>
                  <span className="text-xs text-[var(--color-industrial-grey)] block font-mono mt-0.5">PO: {order.customerPo}</span>
                </div>
                <StatusBadge status={order.status} size="sm" />
              </div>

              <p className="text-xs font-bold text-[var(--color-ink)] mt-3 font-mono uppercase">{order.fabricType}</p>
              <p className="text-[11px] text-[var(--color-vermilion)] font-mono mt-0.5">{order.color}</p>

              {/* Progress */}
              <div className="mt-4 space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[var(--color-industrial-grey)]">Production Status</span>
                  <span className="font-bold">{order.progressPercent}%</span>
                </div>
                <div className="w-full bg-[var(--color-paper)] h-1.5 overflow-hidden">
                  <div
                    className="bg-[var(--color-vermilion)] h-full"
                    style={{ width: `${order.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Order Deep Dive Panel */}
      <div className="bg-white editorial-border p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 editorial-border-b">
          <div>
            <span className="editorial-label text-[var(--color-vermilion)]">Order Tracking & Lab Reports</span>
            <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-[var(--color-ink)] mt-1">
              {activeOrder.orderNumber} · {activeOrder.fabricType}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--color-ink)] px-3 py-1 bg-[var(--color-paper)] editorial-border">
            Current Stage: {activeOrder.currentStage}
          </span>
        </div>

        {/* 2x2 Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-light-border)] text-xs font-mono">
          <div className="bg-[var(--color-paper)] p-3 space-y-1">
            <span className="text-[9px] font-bold text-[var(--color-industrial-grey)] uppercase block">Ordered Volume</span>
            <span className="text-base font-bold block">{activeOrder.orderedMeters.toLocaleString()} m</span>
          </div>
          <div className="bg-[var(--color-paper)] p-3 space-y-1">
            <span className="text-[9px] font-bold text-[var(--color-industrial-grey)] uppercase block">Pass Inspected</span>
            <span className="text-base font-bold text-[var(--color-success-green)] block">{activeOrder.approvedInspectedMeters.toLocaleString()} m</span>
          </div>
          <div className="bg-[var(--color-paper)] p-3 space-y-1">
            <span className="text-[9px] font-bold text-[var(--color-industrial-grey)] uppercase block">Logistics Carrier</span>
            <span className="font-bold block truncate">{activeOrder.carrier}</span>
          </div>
          <div className="bg-[var(--color-paper)] p-3 space-y-1">
            <span className="text-[9px] font-bold text-[var(--color-industrial-grey)] uppercase block">Waybill Tracking</span>
            <span className="font-bold text-[var(--color-vermilion)] block truncate">{activeOrder.trackingNumber}</span>
          </div>
        </div>

        {/* Lab Test Certificate Card */}
        <div className="p-4 bg-[var(--color-paper)] editorial-border space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[var(--color-light-border)] pb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--color-vermilion)]" />
              <span className="font-bold uppercase">Certified Laboratory Test Inspection Report</span>
            </div>
            <span className="text-[10px] text-[var(--color-industrial-grey)]">{activeOrder.qualityReport.certificateNumber}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[9px] text-[var(--color-industrial-grey)] block uppercase">Pass Rating:</span>
              <span className="font-bold text-[var(--color-success-green)]">{activeOrder.qualityReport.passRate}</span>
            </div>
            <div>
              <span className="text-[9px] text-[var(--color-industrial-grey)] block uppercase">Color Delta E:</span>
              <span className="font-bold">{activeOrder.qualityReport.labTestDeltaE}</span>
            </div>
            <div>
              <span className="text-[9px] text-[var(--color-industrial-grey)] block uppercase">Dimensional Stability:</span>
              <span className="font-bold">{activeOrder.qualityReport.dimensionalStability}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerPortalPage;
