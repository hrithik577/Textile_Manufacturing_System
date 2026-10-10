import React, { useState } from 'react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Operational Analytics & Financial Yield
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Overall Equipment Effectiveness (OEE), First-Pass Quality Yield (FPY), downtime Pareto analysis, and order profit margins.
          </p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            {(['week', 'month', 'quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Quarter'}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* Primary Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Factory OEE Efficiency"
          value="88.4%"
          subtitle="Availability 91% • Perf 94% • Q 98%"
          change="+2.1% vs last month"
          trend="up"
          icon={<Cpu className="w-5 h-5 text-teal-400" />}
        />
        <KPICard
          title="First-Pass Quality Yield (FPY)"
          value="94.6%"
          subtitle="Formula: Pass initial roll count / total rolls"
          change="+0.8% YoY"
          trend="up"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        />
        <KPICard
          title="On-Time Delivery Rate (OTD)"
          value="96.2%"
          subtitle="Target: >=95.0% contractual"
          change="1 order rescued"
          trend="up"
          icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
        />
        <KPICard
          title="Gross Operating Margin"
          value="13.2%"
          subtitle="Total Revenue: ₹437,200"
          change="Cost per meter: ₹3.18"
          trend="up"
          icon={<DollarSign className="w-5 h-5 text-indigo-400" />}
        />
      </div>

      {/* Row 1: Output Trend & Defect Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Output Trend */}
        <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-display">
                Weekly Production Output & OEE (%) Trajectory
              </h3>
              <p className="text-xs text-slate-400">Total meters produced daily against target benchmark</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="analyticsOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
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
                <Area type="monotone" dataKey="target" stroke="#64748b" strokeDasharray="4 4" fill="transparent" strokeWidth={1.5} name="Target (m)" />
                <Area type="monotone" dataKey="output" stroke="#14b8a6" fillOpacity={1} fill="url(#analyticsOutput)" strokeWidth={2.5} name="Actual (m)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Distribution */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white font-display mb-1">
              Defect Distribution Pareto
            </h3>
            <p className="text-xs text-slate-400 mb-4">Frequency breakdown across 108 inspected rolls</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={defectBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {defectBreakdown.map((entry, index) => (
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
            {defectBreakdown.slice(0, 4).map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2 truncate pr-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-semibold text-white font-mono shrink-0">{item.count} rolls</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Downtime Pareto & Order Profitability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Reasons */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-display">
                Machine Downtime Pareto Analysis
              </h3>
              <p className="text-xs text-slate-400">Total 750 stoppage minutes logged this month</p>
            </div>
          </div>

          <div className="space-y-3">
            {downtimePareto.map((item) => (
              <div key={item.reason} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{item.reason}</span>
                  <span className="font-mono text-slate-400">
                    <strong className="text-white">{item.minutes} mins</strong> ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Order Profitability */}
        <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white font-display">
                Order Profitability & Revenue Realization
              </h3>
              <p className="text-xs text-slate-400">Contract value vs total manufacturing cost</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderMarginData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="customer" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
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
                <Bar dataKey="revenue" fill="#0d9488" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" fill="#334155" name="Total Cost ($)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
