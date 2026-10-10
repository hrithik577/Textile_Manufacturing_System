import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  Package,
  Layers,
  ArrowRight,
  TrendingUp,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mockMachines, mockOrders, mockRescueIssues } from '../services/mock-data';

export const DashboardPage: React.FC = () => {
  const { alerts, isDemoMode, addToast } = useApp();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Production Planned vs Actual (Meters)
  const productionTrendData = [
    { time: '06:00', planned: 2000, actual: 1950 },
    { time: '08:00', planned: 4500, actual: 4400 },
    { time: '10:00', planned: 7000, actual: 6850 },
    { time: '12:00', planned: 9500, actual: 9100 },
    { time: '14:00', planned: 12000, actual: 11450 },
    { time: '16:00', planned: 14500, actual: 13900 },
    { time: '18:00', planned: 16000, actual: 15420 },
  ];

  // Process Output Breakdown
  const processOutputData = [
    { process: 'Spinning', actual: 8140, target: 9500, unit: 'm', efficiency: 92.8 },
    { process: 'Weaving', actual: 3390, target: 4600, unit: 'm', efficiency: 73.6 },
    { process: 'Dyeing', actual: 2800, target: 6200, unit: 'm', efficiency: 45.1 },
    { process: 'Finishing', actual: 5100, target: 6000, unit: 'm', efficiency: 92.8 },
    { process: 'Inspection', actual: 4800, target: 5500, unit: 'm', efficiency: 96.8 },
  ];

  // Defect Categories Data
  const defectDistributionData = [
    { name: 'Weft Bar', count: 12, color: '#f43f5e' },
    { name: 'Shade Variance', count: 8, color: '#f59e0b' },
    { name: 'Hole / Snag', count: 5, color: '#3b82f6' },
    { name: 'Oil Stain', count: 3, color: '#8b5cf6' },
    { name: 'GSM Variance', count: 2, color: '#06b6d4' },
  ];

  // Order Delivery Status
  const orderStatusData = [
    { name: 'On Track', value: 3, color: '#10b981' },
    { name: 'Ready to Ship', value: 1, color: '#0d9488' },
    { name: 'Quality Hold', value: 1, color: '#f59e0b' },
    { name: 'Critical Risk', value: 1, color: '#f43f5e' },
  ];

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      addToast({
        type: 'info',
        title: 'Factory Telemetry Polled',
        message: 'Refreshed 9 machine nodes, 5 active production orders, and QA logs.',
      });
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Factory Overview
            </h1>
            <DataSourceBadge source={isDemoMode ? 'SIMULATED' : 'LIVE'} />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Monitor real-time textile production, machine availability, quality audits, and delivery risks.
          </p>
        </div>

        {/* Date Selector & Actions */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === 'today' ? 'Today (Shift 1)' : range === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Active Orders"
          value="5"
          subtitle="67,000 m total book"
          change="+1 new order"
          trend="up"
          trendGood={true}
          icon={<ShoppingBag className="w-5 h-5 text-blue-400" />}
          onClick={() => navigate('/orders')}
        />
        <KPICard
          title="Output Today"
          value="15,420"
          unit="meters"
          subtitle="Target: 16,000 m (96%)"
          change="+4.2% vs avg"
          trend="up"
          trendGood={true}
          icon={<Cpu className="w-5 h-5 text-teal-400" />}
          onClick={() => navigate('/production')}
        />
        <KPICard
          title="Fleet Utilization"
          value="81.4%"
          subtitle="7 of 9 machines active"
          change="Loom #3 in breakdown"
          trend="down"
          trendGood={false}
          icon={<Activity className="w-5 h-5 text-amber-400" />}
          variant="warning"
          onClick={() => navigate('/production')}
        />
        <KPICard
          title="Quality Pass Rate"
          value="94.6%"
          subtitle="Target: >=95.0%"
          change="Batch DB-841 on hold"
          trend="down"
          trendGood={false}
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
          onClick={() => navigate('/quality')}
        />
        <KPICard
          title="Orders At Risk"
          value="1"
          subtitle="Patagonia (Slip +5.2d)"
          change="Action required"
          trend="down"
          trendGood={false}
          icon={<AlertTriangle className="w-5 h-5 text-rose-400" />}
          variant="danger"
          onClick={() => navigate('/rescue-engine')}
        />
        <KPICard
          title="Finished Goods"
          value="24"
          unit="rolls"
          subtitle="11,400 m ready for export"
          change="Nordic ready to ship"
          trend="up"
          trendGood={true}
          icon={<Package className="w-5 h-5 text-indigo-400" />}
          onClick={() => navigate('/finished-goods')}
        />
      </div>

      {/* Critical Operational Banner (Rescue Engine Quick Bar) */}
      <div className="rounded-xl bg-gradient-to-r from-rose-950/50 via-slate-900 to-slate-900 border border-rose-500/40 p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 animate-pulse">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                  Rescue Alert #RESCUE-2026-001
                </span>
                <span className="text-xs text-slate-400">Detected 07:42 AM</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display mt-1">
                Loom #3 Servo Trip — Critical 5.2 Day Delivery Slip on Patagonia Order (₹82.5k)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
                Everest Rescue Engine has prepared 3 recovery plans. Recommended Plan A (Airjet Loom Reallocation) restores the schedule within 72 hours for ₹1,450.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={() => navigate('/rescue-engine?issueId=resc-001')}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="shrink-0 font-semibold"
          >
            Review & Approve Recovery Plan
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Planned vs Actual Production (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">
                Planned vs. Actual Production Telemetry (Meters)
              </h3>
              <p className="text-xs text-slate-400">Cumulative shift progress across all production lines</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-slate-300 font-medium">Actual (15,420 m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-600 border border-slate-500" />
                <span className="text-slate-400">Planned (16,000 m)</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={productionTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="planned" stroke="#64748b" strokeDasharray="4 4" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="actual" stroke="#14b8a6" fillOpacity={1} fill="url(#actualGradient)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Delivery Status (1 Col) */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold font-display text-white">Order Delivery Status</h3>
              <span className="text-[10px] font-mono text-slate-400">5 ACTIVE ORDERS</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">SLA deadline feasibility by order volume</p>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
            {orderStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-semibold text-white font-mono">{item.value} order{item.value > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Process Output vs Defect Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Output by Process (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">
                Shift Output & Target by Process Stage
              </h3>
              <p className="text-xs text-slate-400">Spinning, Weaving, Dyeing, Finishing, and Inspection throughput</p>
            </div>
            <span className="text-xs text-slate-400">Unit: Meters</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processOutputData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="process" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="actual" fill="#0d9488" name="Shift Actual (m)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" fill="#334155" name="Target (m)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quality Defect Categories (1 Col) */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">Defects by Category</h3>
              <p className="text-xs text-slate-400">Defect occurrences in last 24h inspection logs</p>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {defectDistributionData.map((defect) => {
              const maxCount = 15;
              const percent = Math.round((defect.count / maxCount) * 100);
              return (
                <div key={defect.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{defect.name}</span>
                    <span className="font-mono text-slate-400 font-semibold">{defect.count} rolls</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: defect.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Defective Rolls: <strong className="text-white font-mono">30</strong></span>
            <button
              onClick={() => navigate('/quality')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              Inspect Queue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Live Machine Status & Recent Production Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Status Summary (1 Col) */}
        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold font-display text-white">Machine Fleet Status</h3>
            <button
              onClick={() => navigate('/production')}
              className="text-xs text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1"
            >
              Floor Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {mockMachines.slice(0, 5).map((machine) => (
              <div
                key={machine.id}
                onClick={() => navigate('/production')}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-white">{machine.code}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{machine.type}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{machine.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={machine.status} size="sm" />
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {machine.shiftOutputMeters} / {machine.targetOutputMeters}m
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Factory Events & Production Activity Feed (2 Cols) */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900/90 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold font-display text-white">
                Live Factory Telemetry & Operations Feed
              </h3>
              <p className="text-xs text-slate-400">Chronological production, inventory, quality and dispatch events</p>
            </div>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Live Stream</span>
          </div>

          <div className="space-y-3">
            {[
              {
                time: '10:05 AM',
                title: 'Roll #ROLL-8402 Passed Automated Quality Inspection',
                desc: 'Uster FabricScan passed roll with Grade A (Export Quality) for Nordic Apparel.',
                type: 'quality',
                status: 'pass',
              },
              {
                time: '09:40 AM',
                title: 'Dyeing Batch DB-838 Reached Equilibrium',
                desc: 'Thies Eco-Master Vessel DYE-01 spectrophotometer reading: Delta E = 0.42 (Pass).',
                type: 'production',
                status: 'running',
              },
              {
                time: '08:30 AM',
                title: 'Raw Material Lot Issued to Spinning Line A',
                desc: '1,250 kg Organic Combed Cotton Yarn (LOT-2026-Y881) released for Zara Twill.',
                type: 'inventory',
                status: 'in_stock',
              },
              {
                time: '07:42 AM',
                title: 'CRITICAL: Loom WEAVE-03 Drive Inverter Overheated',
                desc: 'Everest Rescue Engine triggered triage for Patagonia Order ORD-2026-097.',
                type: 'rescue',
                status: 'breakdown',
              },
              {
                time: 'Yesterday',
                title: 'Export Shipment DSP-2026-041 Dispatched via Maersk',
                desc: '4 rolls (2,000m) dispatched for Nordic Apparel Group. Challan DC-2026-0091 generated.',
                type: 'dispatch',
                status: 'ready_to_dispatch',
              },
            ].map((event, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 text-teal-400 border border-slate-700 shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white font-display truncate">
                      {event.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{event.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{event.desc}</p>
                </div>
                <StatusBadge status={event.status} size="sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
