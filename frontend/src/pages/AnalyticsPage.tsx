import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  PieChart as PieIcon,
  ShieldCheck,
  Cpu,
  DollarSign,
  Download,
} from 'lucide-react';
import { KPICard } from '../components/common/KPICard';
import { Button } from '../components/common/Button';
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

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Weekly Production & OEE trend
  const weeklyTrend = [
    { day: 'Mon', output: 14800, target: 16000, oee: 88.5 },
    { day: 'Tue', output: 15600, target: 16000, oee: 92.1 },
    { day: 'Wed', output: 16200, target: 16000, oee: 95.0 },
    { day: 'Thu', output: 13900, target: 16000, oee: 79.4 },
    { day: 'Fri', output: 15420, target: 16000, oee: 91.5 },
    { day: 'Sat', output: 12500, target: 14000, oee: 85.0 },
    { day: 'Sun', output: 11000, target: 12000, oee: 82.0 },
  ];

  // Downtime Reasons Pareto
  const downtimePareto = [
    { reason: 'Rapier Drive / Motor Overheat', minutes: 285, percentage: 38 },
    { reason: 'Weft Insertion Breakage', minutes: 165, percentage: 22 },
    { reason: 'Dye Staging / Liquor Wait', minutes: 120, percentage: 16 },
    { reason: 'Pin-chain Lubrication / Cleaning', minutes: 90, percentage: 12 },
    { reason: 'Doffing & Beam Mounting', minutes: 90, percentage: 12 },
  ];

  // Defect Pareto Breakdown
  const defectBreakdown = [
    { name: 'Weft Bar (Starting Mark)', count: 42, color: '#f43f5e' },
    { name: 'Color Shade Variance (Delta E > 0.8)', count: 28, color: '#f59e0b' },
    { name: 'Hole / Snag / Needle Mark', count: 18, color: '#3b82f6' },
    { name: 'Oil & Grease Contamination', count: 12, color: '#8b5cf6' },
    { name: 'GSM / Dimensional Variance', count: 8, color: '#06b6d4' },
  ];

  // Order Margin Analysis
  const orderMarginData = [
    { customer: 'Zara Inditex', revenue: 79200, cost: 67400, margin: 14.9 },
    { customer: 'Patagonia Ripstop', revenue: 82500, cost: 74000, margin: 10.3 },
    { customer: 'H&M Oxford', revenue: 92400, cost: 81800, margin: 11.5 },
    { customer: 'Levi Denim', revenue: 137500, cost: 122300, margin: 11.1 },
    { customer: 'Nordic Basic', revenue: 45600, cost: 37700, margin: 17.3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-6 border-b border-[var(--color-light-border)] editorial-border-b">
        <div>
          <h1 className="text-3xl sm:text-5xl font-black font-display text-[var(--color-ink)] uppercase tracking-tight">
            Operational Analytics
          </h1>
          <p className="mt-2 text-sm font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest max-w-2xl">
            Overall Equipment Effectiveness (OEE) & Financial Yield Analysis
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex bg-white editorial-border">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-widest transition-colors ${
                  timeRange === range
                    ? 'bg-[var(--color-ink)] text-white'
                    : 'text-[var(--color-industrial-grey)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
                }`}
              >
                {range === 'week' ? 'Week' : range === 'month' ? 'Month' : 'Quarter'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/closing-the-books')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-white text-xs font-bold uppercase tracking-widest editorial-border hover:bg-black/80 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Owner's Month-End Books
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-[var(--color-ink)] text-xs font-bold uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Primary Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Factory OEE Efficiency"
          value="88.4%"
          subtitle="Availability 91% • Perf 94% • Q 98%"
          change="+2.1% vs last month"
          trend="up"
          icon={<Cpu className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="First-Pass Quality Yield"
          value="94.6%"
          subtitle="Pass initial roll count / total rolls"
          change="+0.8% YoY"
          trend="up"
          icon={<ShieldCheck className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="On-Time Delivery Rate"
          value="96.2%"
          subtitle="Target: >=95.0% contractual"
          change="1 order rescued"
          trend="up"
          icon={<BarChart3 className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="Gross Operating Margin"
          value="13.2%"
          subtitle="Total Revenue: ₹437,200"
          change="Cost per meter: ₹3.18"
          trend="up"
          icon={<DollarSign className="w-6 h-6 text-[var(--color-ink)]" />}
        />
      </div>

      {/* Row 1: Output Trend & Defect Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Output Trend */}
        <div className="lg:col-span-2 bg-white editorial-border p-6 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--color-light-border)]">
            <div>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Weekly Production Output
              </h3>
              <p className="text-[10px] font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest mt-1">Total meters produced against benchmark</p>
            </div>
            <div className="editorial-label shrink-0">
              OEE TRAJECTORY
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="day" stroke="#111111" tick={{ fill: '#111111', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <YAxis stroke="#111111" tick={{ fill: '#111111', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#111111',
                    borderWidth: '2px',
                    borderRadius: '0px',
                    color: '#111111',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                />
                <Area type="monotone" dataKey="target" stroke="#858585" strokeDasharray="4 4" fill="transparent" strokeWidth={2} name="Target (m)" />
                <Area type="monotone" dataKey="output" stroke="#111111" fillOpacity={1} fill="url(#analyticsOutput)" strokeWidth={3} name="Actual (m)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Distribution */}
        <div className="bg-white editorial-border p-6 flex flex-col justify-between">
          <div>
            <div className="mb-6 pb-4 border-b border-[var(--color-light-border)]">
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight mb-1">
                Defect Pareto
              </h3>
              <p className="text-[10px] font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest">108 inspected rolls</p>
            </div>

            <div className="h-44 w-full mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={2}
                    dataKey="count"
                    stroke="none"
                  >
                    {defectBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        index === 0 ? '#111111' :
                        index === 1 ? '#F04424' :
                        index === 2 ? '#858585' :
                        index === 3 ? '#E5E5E5' : '#444444'
                      } />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#111111',
                      borderWidth: '2px',
                      borderRadius: '0px',
                      color: '#111111',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      fontFamily: 'monospace',
                      textTransform: 'uppercase'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-3 text-xs font-bold font-mono">
            {defectBreakdown.slice(0, 4).map((item, index) => {
              const bgColors = ['#111111', '#F04424', '#858585', '#E5E5E5'];
              return (
                <div key={item.name} className="flex items-center justify-between border-b border-dashed border-[var(--color-light-border)] pb-2">
                  <div className="flex items-center gap-3 truncate pr-2">
                    <span className="w-3 h-3 border border-[var(--color-ink)] shrink-0" style={{ backgroundColor: bgColors[index] }} />
                    <span className="text-[var(--color-industrial-grey)] truncate uppercase tracking-widest text-[10px]">{item.name}</span>
                  </div>
                  <span className="font-black text-[var(--color-ink)] shrink-0">{item.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Downtime Pareto & Order Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Reasons */}
        <div className="bg-white p-6 editorial-border flex flex-col">
          <div className="mb-6 pb-4 border-b border-[var(--color-light-border)] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Machine Downtime Pareto
              </h3>
              <p className="text-[10px] font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest mt-1">750 stoppage minutes logged this month</p>
            </div>
          </div>

          <div className="space-y-5">
            {downtimePareto.map((item, idx) => (
              <div key={item.reason} className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold font-mono uppercase tracking-widest">
                  <span className="text-[var(--color-ink)]">{item.reason}</span>
                  <span className="text-[var(--color-industrial-grey)]">
                    <strong className="text-[var(--color-ink)] font-black">{item.minutes}m</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="h-3 w-full border border-[var(--color-ink)] bg-[var(--color-paper)] relative">
                  <div
                    className={clsx(
                      "h-full absolute top-0 left-0",
                      idx === 0 ? "bg-[var(--color-vermilion)]" : "bg-[var(--color-ink)]"
                    )}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Order Profitability */}
        <div className="bg-white p-6 editorial-border flex flex-col">
          <div className="mb-6 pb-4 border-b border-[var(--color-light-border)] flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Order Profitability
              </h3>
              <p className="text-[10px] font-mono font-bold text-[var(--color-industrial-grey)] uppercase tracking-widest mt-1">Contract value vs total manufacturing cost</p>
            </div>
            <div className="editorial-label">MARGINS</div>
          </div>

          <div className="h-56 w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderMarginData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="customer" stroke="#111111" tick={{ fill: '#111111', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <YAxis stroke="#111111" tick={{ fill: '#111111', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }} />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#111111',
                    borderWidth: '2px',
                    borderRadius: '0px',
                    color: '#111111',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold', fontFamily: 'monospace' }} iconType="square" />
                <Bar dataKey="revenue" fill="#111111" name="Revenue ($)" />
                <Bar dataKey="cost" fill="#858585" name="Total Cost ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
