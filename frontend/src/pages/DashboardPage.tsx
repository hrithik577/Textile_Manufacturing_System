import React, { useState, useEffect } from 'react';
import { ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { request } from '../services/api-client';

interface DashboardSummary {
  active_orders_count: number;
  orders_in_production: number;
  pending_dispatch_rolls: number;
  active_alerts_count: number;
  critical_alerts_count: number;
  low_stock_items_count: number;
  running_machines_count: number;
  total_machines_count: number;
  overall_oee_percentage: number;
  today_production_output_m: number;
  monthly_revenue_booked: number;
  monthly_collected_cash: number;
  active_workers_on_shift: number;
}

interface AlertItem {
  id: number;
  category: string;
  severity: string;
  title: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  status: string;
}

export const DashboardPage: React.FC = () => {
  const { isDemoMode, lastOrderEvent } = useApp();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [criticalAlert, setCriticalAlert] = useState<AlertItem | null>(null);
  const [qualityPassRate, setQualityPassRate] = useState<string>('0.0%');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('Just Now');

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, alertsRes, qcRes] = await Promise.all([
        request<DashboardSummary>('/dashboard/summary', { method: 'GET' }),
        request<AlertItem[]>('/dashboard/alerts?limit=5', { method: 'GET' }),
        request<any>('/quality/summary', { method: 'GET' }).catch(() => ({ data: null })),
      ]);
      setSummary(sumRes.data);
      if (alertsRes.data && alertsRes.data.length > 0) {
        const crit = alertsRes.data.find((a) => a.severity.toLowerCase() === 'critical') || alertsRes.data[0];
        setCriticalAlert(crit);
      }
      if (qcRes.data && qcRes.data.first_pass_yield_pct !== undefined) {
        setQualityPassRate(`${qcRes.data.first_pass_yield_pct}%`);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch {
      // Keep previous state if any
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const fleetUtilization = summary && summary.total_machines_count > 0
    ? ((summary.running_machines_count / summary.total_machines_count) * 100).toFixed(1)
    : '0.0';

  const fleetOfflineCount = summary
    ? summary.total_machines_count - summary.running_machines_count
    : 0;

  const todayOutput = summary
    ? Math.round(summary.today_production_output_m).toLocaleString()
    : '0';

  const activeOrdersCount = summary ? summary.active_orders_count : 0;
  const pendingDispatch = summary ? summary.pending_dispatch_rolls : 0;

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
        <div className="flex items-center gap-4">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="editorial-label flex items-center gap-1.5 hover:text-[var(--color-vermilion)] transition-colors cursor-pointer"
            title="Refresh dashboard KPIs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span className="editorial-label">Last Updated: {lastRefreshed}</span>
        </div>
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
            <div
              className="editorial-border border-[var(--color-vermilion)] bg-white p-5 hover:bg-rose-50 transition-colors cursor-pointer"
              onClick={() => navigate('/rescue-engine')}
            >
              <h3 className="editorial-label text-[var(--color-vermilion)] mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Action Required
              </h3>
              <p className="text-sm font-bold leading-tight">
                {criticalAlert ? criticalAlert.title : 'Order PO-PROD-2026-03 is blocked.'}
              </p>
              <p className="text-xs text-[var(--color-industrial-grey)] mt-1 line-clamp-2">
                {criticalAlert ? criticalAlert.description : 'Loom #3 breakdown detected.'}
              </p>
              <button className="mt-5 text-xs font-bold uppercase tracking-wider text-[var(--color-vermilion)] hover:underline flex items-center gap-1 cursor-pointer">
                Engage Rescue Engine <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Mini KPI */}
            <div className="editorial-border-light-b pb-4 cursor-pointer group" onClick={() => navigate('/production')}>
              <span className="editorial-label">Fleet Utilization</span>
              <div className="font-display text-5xl font-bold tracking-tight mt-1 group-hover:text-[var(--color-vermilion)] transition-colors">
                {fleetUtilization}%
              </div>
              <span className="text-xs font-sans text-[var(--color-vermilion)] font-semibold">
                {fleetOfflineCount > 0 ? `-${fleetOfflineCount} Loom${fleetOfflineCount > 1 ? 's' : ''} offline` : 'All Looms Operational'}
              </span>
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
                <span className="font-mono text-xs uppercase tracking-widest block opacity-70 mb-1">Today's Output</span>
                <span className="font-display text-5xl lg:text-7xl font-bold tracking-tighter leading-none">
                  {todayOutput} <span className="text-2xl font-mono text-[var(--color-vermilion)]">M</span>
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs uppercase tracking-widest block opacity-70 mb-1">Target Pace (OEE)</span>
                <span className="font-display text-3xl lg:text-5xl font-bold tracking-tighter leading-none">
                  {summary?.overall_oee_percentage !== undefined ? `${summary.overall_oee_percentage}%` : '0.0%'}
                </span>
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
                <span className="font-mono text-xs font-bold text-[var(--color-vermilion)]">
                  {summary ? `${summary.orders_in_production} In Prod` : '0 In Prod'}
                </span>
              </div>
              <div className="font-display text-4xl font-bold tracking-tight mb-2">
                {activeOrdersCount}
              </div>
              <div className="text-xs text-[var(--color-industrial-grey)]">
                {summary?.monthly_revenue_booked
                  ? `$${summary.monthly_revenue_booked.toLocaleString()} booked sales volume`
                  : '$0 booked sales volume'}
              </div>
              <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
            </div>

            <div className="group cursor-pointer" onClick={() => navigate('/quality')}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-sans text-sm font-bold uppercase tracking-wider">Quality Pass Rate</span>
                <span className="font-mono text-xs font-bold text-[var(--color-vermilion)]">{qualityPassRate}</span>
              </div>
              <div className="font-display text-4xl font-bold tracking-tight mb-2">{qualityPassRate}</div>
              <div className="text-xs text-[var(--color-industrial-grey)]">
                {summary?.critical_alerts_count ? `${summary.critical_alerts_count} quality/floor alerts` : 'First-pass roll inspections'}
              </div>
              <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
            </div>

            <div className="group cursor-pointer" onClick={() => navigate('/finished-goods')}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-sans text-sm font-bold uppercase tracking-wider">Finished Goods</span>
                <span className="font-mono text-xs font-bold text-[var(--color-success-green)]">
                  {pendingDispatch > 0 ? `+${pendingDispatch}` : 'Ready'}
                </span>
              </div>
              <div className="font-display text-4xl font-bold tracking-tight mb-2">
                {pendingDispatch} Rolls
              </div>
              <div className="text-xs text-[var(--color-industrial-grey)]">
                Audited & cleared for delivery challan
              </div>
              <div className="h-[1px] w-full bg-[var(--color-light-border)] mt-4 group-hover:bg-[var(--color-ink)] transition-colors"></div>
            </div>
            
            {/* Last Order Banner replacement */}
            {lastOrderEvent && (
              <div
                className="editorial-border bg-[var(--color-paper)] p-4 cursor-pointer hover:bg-black/5 transition-colors"
                onClick={() => navigate(`/orders?orderId=${lastOrderEvent.order.id}`)}
              >
                <span className="font-mono text-[10px] uppercase font-bold text-[var(--color-vermilion)] block mb-2">
                  NEW ORDER RECEIVED
                </span>
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

export default DashboardPage;
