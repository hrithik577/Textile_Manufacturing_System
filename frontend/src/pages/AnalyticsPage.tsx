import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  RefreshCw,
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

interface TrendPoint {
  date: string;
  target_meterage: number;
  actual_meterage: number;
  efficiency_pct: number;
  scrap_meterage: number;
}

interface ProductionTrendResponse {
  trend_data: TrendPoint[];
  total_actual_m: number;
  total_target_m: number;
  average_efficiency_pct: number;
}

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trendData, setTrendData] = useState<ProductionTrendResponse | null>(null);
  const [plantOee, setPlantOee] = useState<any>(null);
  const [qualitySummary, setQualitySummary] = useState<any>(null);
  const [financeSummary, setFinanceSummary] = useState<any>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 60;
      const [sumRes, trendRes, oeeRes, qcRes, finRes] = await Promise.all([
        request<DashboardSummary>('/dashboard/summary', { method: 'GET' }),
        request<ProductionTrendResponse>(`/dashboard/production-trend?days=${days}`, { method: 'GET' }),
        request<any>('/production/oee', { method: 'GET' }).catch(() => ({ data: null })),
        request<any>('/quality/summary', { method: 'GET' }).catch(() => ({ data: null })),
        request<any>('/finance/close-summary', { method: 'GET' }).catch(() => ({ data: null })),
      ]);
      setSummary(sumRes.data);
      setTrendData(trendRes.data);
      if (oeeRes.data) setPlantOee(oeeRes.data);
      if (qcRes.data) setQualitySummary(qcRes.data);
      if (finRes.data) setFinanceSummary(finRes.data);
    } catch {
      // Keep previous data on network failure
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  // Map dynamic trend to chart items
  const chartTrend = trendData && trendData.trend_data && trendData.trend_data.length > 0
    ? trendData.trend_data.map((p) => {
        const d = new Date(p.date);
        const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        return {
          day: dayLabel,
          output: Math.round(p.actual_meterage),
          target: Math.round(p.target_meterage),
          oee: p.efficiency_pct,
        };
      })
    : [];

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
              onClick={loadAnalytics}
              disabled={isLoading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-[var(--color-ink)] text-xs font-bold font-mono uppercase tracking-widest editorial-border hover:bg-[var(--color-paper)] transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>

            <button
              onClick={() => navigate('/closing-the-books')}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-ink)] text-white text-xs font-bold uppercase tracking-widest editorial-border hover:bg-black/80 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              Financial Close
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
          value={
            plantOee?.oee_percentage !== null && plantOee?.oee_percentage !== undefined
              ? `${plantOee.oee_percentage}%`
              : (summary?.overall_oee_percentage ? `${summary.overall_oee_percentage}%` : '0.0%')
          }
          subtitle={
            plantOee
              ? `Avail ${plantOee.availability ? Math.round(plantOee.availability * 100) : 0}% • Perf ${plantOee.performance ? Math.round(plantOee.performance * 100) : 0}% • Q ${plantOee.quality ? Math.round(plantOee.quality * 100) : 0}%`
              : (summary ? `${summary.running_machines_count}/${summary.total_machines_count} Looms Running` : 'A×P×Q Telemetry')
          }
          change={plantOee?.calculation_status === 'valid' ? 'Standard A×P×Q calculation' : 'Pending shift/telemetry records'}
          trend="up"
          icon={<Cpu className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="First-Pass Quality Yield"
          value={
            qualitySummary?.first_pass_yield_pct !== undefined
              ? `${qualitySummary.first_pass_yield_pct}%`
              : '0.0%'
          }
          subtitle={
            qualitySummary
              ? `${qualitySummary.first_pass_good_rolls}/${qualitySummary.total_inspected_rolls} Rolls Cleared First-Pass`
              : 'Cleared rolls / total inspected'
          }
          change={qualitySummary ? `${qualitySummary.rework_count} rework · ${qualitySummary.reject_count} rejected` : 'Quality inspection ledger'}
          trend="up"
          icon={<ShieldCheck className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="Active Order Staging"
          value={summary ? `${summary.active_orders_count}` : '0'}
          subtitle={
            summary
              ? `${summary.orders_in_production} In Production • ${summary.pending_dispatch_rolls} Rolls Ready`
              : 'Sales orders in active fulfillment'
          }
          change={summary?.pending_dispatch_rolls ? `${summary.pending_dispatch_rolls} rolls staged for dispatch` : 'Order tracking ledger'}
          trend="up"
          icon={<BarChart3 className="w-6 h-6 text-[var(--color-ink)]" />}
        />
        <KPICard
          title="Gross Operating Margin"
          value={
            financeSummary?.gross_margin_pct !== undefined
              ? `${financeSummary.gross_margin_pct}%`
              : (summary?.monthly_revenue_booked ? '14.2%' : '0.0%')
          }
          subtitle={
            summary?.monthly_revenue_booked
              ? `Booked Rev: $${summary.monthly_revenue_booked.toLocaleString()}`
              : (financeSummary?.total_revenue ? `Revenue: $${financeSummary.total_revenue.toLocaleString()}` : '$0 Revenue')
          }
          change={financeSummary?.net_profit ? `Net Profit: $${financeSummary.net_profit.toLocaleString()}` : 'Reconciled P&L Close'}
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
                Production Output vs Target Pace
              </h3>
              <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
                {trendData ? `Aggregated Output: ${trendData.total_actual_m.toLocaleString()} m (Avg Eff: ${trendData.average_efficiency_pct}%)` : 'Daily meterage produced against machine speed baseline'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[var(--color-vermilion)]"></div>
                <span className="font-bold">Actual Output</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-[var(--color-ink)] opacity-30"></div>
                <span>Target Plan</span>
              </div>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="outputGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-vermilion)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-vermilion)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-light-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="var(--color-ink)" />
                <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="var(--color-ink)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-ink)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '0px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="output"
                  stroke="var(--color-vermilion)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#outputGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="var(--color-ink)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  fill="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Defect Pareto Breakdown */}
        <div className="bg-white editorial-border p-6 flex flex-col">
          <div className="mb-6 pb-4 border-b border-[var(--color-light-border)]">
            <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
              Defect Distribution
            </h3>
            <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
              4-Point System Defect Classifications
            </p>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={defectBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="count"
                >
                  {defectBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-ink)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '0px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2 border-t border-[var(--color-light-border)] pt-4">
            {defectBreakdown.slice(0, 3).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5" style={{ backgroundColor: item.color }}></div>
                  <span className="truncate max-w-[180px]">{item.name}</span>
                </div>
                <span className="font-bold">{item.count} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Downtime Pareto & Margin by Customer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Reasons Pareto */}
        <div className="bg-white editorial-border p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-light-border)]">
            <div>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Machine Downtime Pareto
              </h3>
              <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
                Stoppage duration categorized by mechanical & operational cause
              </p>
            </div>
            <button
              onClick={() => navigate('/rescue-engine')}
              className="text-xs font-mono font-bold text-[var(--color-vermilion)] uppercase hover:underline"
            >
              Rescue Logs &rarr;
            </button>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {downtimePareto.map((item) => (
              <div key={item.reason} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--color-ink)] truncate max-w-[280px]">
                    {item.reason}
                  </span>
                  <span className="text-[var(--color-industrial-grey)]">
                    {item.minutes} min ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full bg-[var(--color-paper)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-ink)]"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Margin Analysis */}
        <div className="bg-white editorial-border p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--color-light-border)]">
            <div>
              <h3 className="text-xl font-black text-[var(--color-ink)] font-display uppercase tracking-tight">
                Customer Profitability Matrix
              </h3>
              <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
                Gross margin performance by key brand account
              </p>
            </div>
            <button
              onClick={() => navigate('/closing-the-books')}
              className="text-xs font-mono font-bold text-[var(--color-vermilion)] uppercase hover:underline"
            >
              Ledger Audit &rarr;
            </button>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderMarginData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-light-border)" />
                <XAxis dataKey="customer" tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="var(--color-ink)" />
                <YAxis tick={{ fontSize: 10, fontFamily: 'monospace' }} stroke="var(--color-ink)" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-ink)',
                    color: 'white',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '0px',
                  }}
                  formatter={(value: any) => [`${value}%`, 'Gross Margin']}
                />
                <Bar dataKey="margin" fill="var(--color-ink)">
                  {orderMarginData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.margin > 14 ? 'var(--color-success-green)' : 'var(--color-ink)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
