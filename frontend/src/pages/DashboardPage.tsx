import React, { useState } from 'react';
import { ArrowRight, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { isDemoMode, addToast, lastOrderEvent } = useApp();
  const navigate = useNavigate();

  return (
    <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-6rem)] flex flex-col pt-4">
      {/* Live Status indicator */}
      <div className="flex justify-between items-end border-b border-[var(--color-ink)] pb-2 mb-8">
        <div className="flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-vermilion)] animate-pulse" />
          <span className="editorial-label text-[var(--color-vermilion)] font-bold">
            {isDemoMode ? 'SIMULATION TELEMETRY ACTIVE' : 'LIVE FACTORY TELEMETRY'}
          </span>
        </div>
        <span className="editorial-label">Last Updated: Just Now</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 flex-1">
        
        {/* Left Column: Oversized Typography & Primary KPI */}
        <div className="col-span-1 lg:col-span-3 flex flex-col justify-between">
          <div>
            <h1 className="font-display text-7xl lg:text-[7rem] font-black leading-[0.85] tracking-tighter uppercase mb-6">
              FACTORY<br/>
              IN<br/>
              MOTION.
            </h1>
            <p className="font-sans text-sm text-[var(--color-industrial-grey)] max-w-[280px] font-medium leading-relaxed">
              Monitor real-time textile production, machine availability, quality audits, and delivery risks.
            </p>
          </div>
          
          <div className="mt-12 space-y-6">
            {/* Live Alert Box */}
            <div className="editorial-border border-[var(--color-vermilion)] bg-white p-5 hover:bg-rose-50 transition-colors cursor-pointer" onClick={() => navigate('/rescue-engine')}>
                <h3 className="editorial-label text-[var(--color-vermilion)] mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Critical Action Required
                </h3>
                <p className="text-sm font-bold leading-tight">Order PO-PROD-2026-03 is blocked.</p>
                <p className="text-xs text-[var(--color-industrial-grey)] mt-1">Loom #3 breakdown detected.</p>
                <button className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--color-vermilion)] hover:underline flex items-center gap-1">
                  Engage Rescue Engine <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {/* Mini KPI */}
            <div className="editorial-border-light-b pb-4 cursor-pointer group" onClick={() => navigate('/production')}>
              <span className="editorial-label">Fleet Utilization</span>
              <div className="font-display text-5xl font-bold tracking-tight mt-1 group-hover:text-[var(--color-vermilion)] transition-colors">81.4%</div>
              <span className="text-xs font-sans text-[var(--color-vermilion)] font-semibold">-Loom 3 offline</span>
            </div>
          </div>
        </div>

        {/* Center Column: Machinery Visual */}
        <div className="col-span-1 lg:col-span-6 relative flex flex-col min-h-[500px]">
          {/* Geometric Vermilion shape behind */}
          <div className="absolute top-12 -left-6 lg:-left-12 w-full h-[85%] bg-[var(--color-vermilion)] z-0 hidden lg:block"></div>
          {/* Image */}
          <div className="relative z-10 w-full flex-1 bg-[var(--color-ink)] editorial-border overflow-hidden">
              <img 
                src="/loom.jpg" 
                alt="Loom Machinery"
                className="w-full h-full object-cover opacity-85 mix-blend-luminosity grayscale hover:grayscale-0 transition-all duration-700"
              />
              {/* Overlay metrics */}
              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8 flex justify-between items-end text-white bg-gradient-to-t from-black/80 to-transparent">
                <div>
                    <span className="font-mono text-xs uppercase tracking-widest block opacity-70 mb-1">Shift 1 Output</span>
                    <span className="font-display text-5xl lg:text-7xl font-bold tracking-tighter leading-none">
                      15,420 <span className="text-2xl font-mono text-[var(--color-vermilion)]">M</span>
                    </span>
                </div>
                <div className="text-right">
                    <span className="font-mono text-xs uppercase tracking-widest block opacity-70 mb-1">Target</span>
                    <span className="font-display text-3xl lg:text-5xl font-bold tracking-tighter leading-none">96%</span>
                </div>
              </div>
          </div>
        </div>

        {/* Right Column: Operational Intelligence */}
        <div className="col-span-1 lg:col-span-3 flex flex-col gap-6">
          <h2 className="editorial-label editorial-border-b pb-2">Operational Intelligence</h2>
          
          <div className="space-y-6">
              <div className="group cursor-pointer" onClick={() => navigate('/orders')}>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans text-sm font-bold uppercase tracking-wider">Active Orders</span>
                    <span className="font-mono text-xs font-bold text-[var(--color-vermilion)]">+1</span>
                </div>
                <div className="font-display text-4xl font-bold tracking-tight mb-2">5</div>
                <div className="text-xs text-[var(--color-industrial-grey)]">67,000 m total book volume</div>
                <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
              </div>

              <div className="group cursor-pointer" onClick={() => navigate('/quality')}>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans text-sm font-bold uppercase tracking-wider">Quality Pass Rate</span>
                    <span className="font-mono text-xs font-bold text-[var(--color-vermilion)]">-0.4%</span>
                </div>
                <div className="font-display text-4xl font-bold tracking-tight mb-2">94.6%</div>
                <div className="text-xs text-[var(--color-industrial-grey)]">Batch DB-841 on hold</div>
                <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
              </div>

              <div className="group cursor-pointer" onClick={() => navigate('/finished-goods')}>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans text-sm font-bold uppercase tracking-wider">Finished Goods</span>
                    <span className="font-mono text-xs font-bold text-[var(--color-success-green)]">+4</span>
                </div>
                <div className="font-display text-4xl font-bold tracking-tight mb-2">24 Rolls</div>
                <div className="text-xs text-[var(--color-industrial-grey)]">11,400 m ready for export</div>
                <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
              </div>
              
              {/* Last Order Banner replacement */}
              {lastOrderEvent && (
                <div className="editorial-border bg-[var(--color-paper)] p-4 cursor-pointer hover:bg-black/5 transition-colors" onClick={() => navigate(`/orders?orderId=${lastOrderEvent.order.id}`)}>
                  <span className="font-mono text-[10px] uppercase font-bold text-[var(--color-vermilion)] block mb-2">NEW ORDER RECEIVED</span>
                  <div className="font-display text-xl font-bold leading-tight uppercase">
                    {lastOrderEvent.order.customerCompany}
                  </div>
                  <div className="text-sm font-bold mt-1">
                    {lastOrderEvent.order.orderedQuantity.toLocaleString()}m {lastOrderEvent.order.fabricType}
                  </div>
                  <div className="text-xs text-[var(--color-industrial-grey)] mt-2">
                    Target: {lastOrderEvent.order.deadlineDate}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
