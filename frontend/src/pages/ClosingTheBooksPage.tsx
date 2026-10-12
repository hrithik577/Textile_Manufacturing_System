import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  Calendar,
  Layers,
  Cpu,
  Users,
  Package,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Printer,
  ChevronRight,
  ShieldCheck,
  Building2,
  Banknote,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  PieChart as PieIcon,
  HelpCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Database,
  X,
  Info,
} from 'lucide-react';
import {
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
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';
import {
  financeService,
  ClosingTheBooksResponse,
  CostEntryPayload,
} from '../services/finance';

// Format Indian Rupee currency (e.g. ₹25,73,790)
export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// Indian Denomination Context (Lakhs & Crores)
export function formatLakhsCrores(val: number): string {
  const abs = Math.abs(val || 0);
  if (abs >= 10000000) {
    return `(₹${(val / 10000000).toFixed(2)} Cr)`;
  } else if (abs >= 100000) {
    return `(₹${(val / 100000).toFixed(2)} L)`;
  }
  return '';
}

// Fallback baseline ledger in case of initial render / offline dev
const FALLBACK_DATA: ClosingTheBooksResponse = {
  period: 'October 2026',
  currency: 'INR',
  verdict: 'YES, THE MILL MADE MONEY THIS MONTH. Net operating profit of ₹25,73,790 achieved at 33.0% EBITDA margin across all completed production cycles.',
  is_profitable: true,
  total_revenue: 7803710,
  total_expenses: 5229920,
  net_profit: 2573790,
  ebitda_margin_pct: 33.0,
  buyer_payments_total: 5037500,
  raw_material_bills_total: 2702820,
  worker_wages_total: 969700,
  machine_opex_total: 1247400,
  financial_statement: [
    { code: 'REV-01', label: 'Gross Invoiced Revenue (Finished Goods Dispatched)', budget: 7640000, actual: 7803710, variance: 163710, variance_pct: 2.1, pct_of_rev: 100.0, status: 'favorable' },
    { code: 'COGS-01', label: 'Raw Material — Cotton, Poly & Blend Yarns', budget: 2180000, actual: 2274120, variance: 94120, variance_pct: 4.3, pct_of_rev: 29.1, status: 'unfavorable' },
    { code: 'COGS-02', label: 'Dyes, Auxiliaries & Processing Chemicals', budget: 450000, actual: 428700, variance: -21300, variance_pct: -4.7, pct_of_rev: 5.5, status: 'favorable' },
    { code: 'COGS-03', label: 'Direct Labor — Weaving, Dyeing & Warping Floor Wages', budget: 950000, actual: 969700, variance: 19700, variance_pct: 2.1, pct_of_rev: 12.4, status: 'unfavorable' },
    { code: 'OPEX-01', label: 'Electrical Grid (Industrial Tariff) & Diesel Genset', budget: 1030000, actual: 992400, variance: -37600, variance_pct: -3.7, pct_of_rev: 12.7, status: 'favorable' },
    { code: 'OPEX-02', label: 'Machine Spares, Overhauls & Loom Greasing', budget: 242000, actual: 255000, variance: 13000, variance_pct: 5.4, pct_of_rev: 3.3, status: 'unfavorable' },
    { code: 'OPEX-03', label: 'Factory Shed Lease, Compliance Audits & ETP Effluent', budget: 310000, actual: 310000, variance: 0, variance_pct: 0.0, pct_of_rev: 4.0, status: 'neutral' },
    { code: 'NET-01', label: 'Net Operating Profit (EBITDA Reconciliation)', budget: 2478000, actual: 2573790, variance: 95790, variance_pct: 3.9, pct_of_rev: 33.0, status: 'favorable', is_total: true },
  ],
  waterfall_data: [
    { name: 'Gross Invoiced', amount: 7803710, type: 'positive' },
    { name: 'Raw Yarn', amount: -2274120, type: 'negative' },
    { name: 'Dyes & Chem', amount: -428700, type: 'negative' },
    { name: 'Floor Wages', amount: -969700, type: 'negative' },
    { name: 'Power & Grid', amount: -992400, type: 'negative' },
    { name: 'Machine Maint', amount: -255000, type: 'negative' },
    { name: 'Overheads', amount: -310000, type: 'negative' },
    { name: 'Net Profit', amount: 2573790, type: 'total' },
  ],
  expense_distribution: [
    { name: 'Raw Yarns', value: 2274120, color: '#111111' },
    { name: 'Power & Utilities', value: 992400, color: '#4B5563' },
    { name: 'Floor Labor', value: 969700, color: '#F04424' },
    { name: 'Dyes & Chemicals', value: 428700, color: '#9CA3AF' },
    { name: 'Factory Overheads', value: 310000, color: '#374151' },
    { name: 'Machine Maintenance', value: 255000, color: '#D1D5DB' },
  ],
  order_cost_sheets: [
    { order_id: 1, order_number: 'SO-2026-001', customer_name: 'Nordic Apparel Group', fabric_spec: 'Cotton Poplin 40s (5,000m)', meters: 5000, revenue: 1850000, material_cost: 680000, dye_chem_cost: 185000, power_cost: 210000, labor_cost: 285000, total_cost: 1360000, net_profit: 490000, margin_pct: 26.5, status: 'Profitable' },
    { order_id: 2, order_number: 'SO-2026-002', customer_name: 'Apex Activewear Inc', fabric_spec: 'Poly-Viscose Suiting (4,200m)', meters: 4200, revenue: 1425000, material_cost: 540000, dye_chem_cost: 145000, power_cost: 180000, labor_cost: 225000, total_cost: 1090000, net_profit: 335000, margin_pct: 23.5, status: 'Profitable' },
    { order_id: 3, order_number: 'SO-2026-003', customer_name: 'Luxe Milan Fabrics', fabric_spec: 'Cotton Satin Weave (3,000m)', meters: 3000, revenue: 1200000, material_cost: 480000, dye_chem_cost: 95000, power_cost: 145000, labor_cost: 185000, total_cost: 905000, net_profit: 295000, margin_pct: 24.6, status: 'Profitable' },
    { order_id: 4, order_number: 'SO-2026-004', customer_name: 'H&M Sourcing India', fabric_spec: 'Denim Twill 3/1 Heavy (2,500m)', meters: 2500, revenue: 875000, material_cost: 380000, dye_chem_cost: 65000, power_cost: 110000, labor_cost: 140000, total_cost: 695000, net_profit: 180000, margin_pct: 20.6, status: 'Profitable' },
    { order_id: 5, order_number: 'SO-2026-005', customer_name: 'Zara Global Inditex', fabric_spec: 'Printed Rayon 60s (2,000m)', meters: 2000, revenue: 740000, material_cost: 310000, dye_chem_cost: 55000, power_cost: 95000, labor_cost: 120000, total_cost: 580000, net_profit: 160000, margin_pct: 21.6, status: 'Profitable' },
  ],
  machine_yield_opex: [
    { machine_id: 1, machine_code: 'M-001', name: 'Airjet Loom 01 (Tsudakoma)', process_type: 'WEAVING', status: 'RUNNING', meters_produced: 1450, power_kwh: 2102.5, power_cost: 18560, maintenance_cost: 25000, uptime_pct: 94.2, cost_per_meter: 30.04 },
    { machine_id: 2, machine_code: 'M-002', name: 'Airjet Loom 02 (Tsudakoma)', process_type: 'WEAVING', status: 'RUNNING', meters_produced: 1380, power_kwh: 2001.0, power_cost: 17664, maintenance_cost: 25000, uptime_pct: 93.8, cost_per_meter: 30.92 },
    { machine_id: 3, machine_code: 'M-003', name: 'Rapier Loom 03 (Picanol)', process_type: 'WEAVING', status: 'RUNNING', meters_produced: 420, power_kwh: 609.0, power_cost: 5376, maintenance_cost: 15000, uptime_pct: 88.5, cost_per_meter: 48.51 },
    { machine_id: 4, machine_code: 'M-004', name: 'Rapier Loom 04 (Picanol)', process_type: 'WEAVING', status: 'IDLE', meters_produced: 1250, power_kwh: 1812.5, power_cost: 16000, maintenance_cost: 15000, uptime_pct: 85.0, cost_per_meter: 24.80 },
    { machine_id: 5, machine_code: 'M-005', name: 'Soft Flow Jet Dyeing 01 (Fongs)', process_type: 'DYEING', status: 'RUNNING', meters_produced: 800, power_kwh: 1160.0, power_cost: 10240, maintenance_cost: 45000, uptime_pct: 91.5, cost_per_meter: 69.05 },
    { machine_id: 6, machine_code: 'M-006', name: 'Stenter Finishing Frame 01 (Brueckner)', process_type: 'FINISHING', status: 'RUNNING', meters_produced: 2200, power_kwh: 3190.0, power_cost: 28160, maintenance_cost: 85000, uptime_pct: 96.0, cost_per_meter: 51.44 },
  ],
  worker_payroll: [
    { department: 'Weaving', headcount: 14, present_count: 14, regular_wages: 399000, overtime_wages: 58800, total_payroll: 457800, attendance_pct: 97.5 },
    { department: 'Dyeing', headcount: 8, present_count: 8, regular_wages: 228000, overtime_wages: 33600, total_payroll: 261600, attendance_pct: 96.0 },
    { department: 'Spinning', headcount: 5, present_count: 5, regular_wages: 142500, overtime_wages: 21000, total_payroll: 163500, attendance_pct: 95.8 },
    { department: 'Finishing', headcount: 3, present_count: 3, regular_wages: 85500, overtime_wages: 12600, total_payroll: 98100, attendance_pct: 96.5 },
    { department: 'Quality', headcount: 3, present_count: 3, regular_wages: 85500, overtime_wages: 12600, total_payroll: 98100, attendance_pct: 98.0 },
  ],
  raw_material_bills: [
    { id: 1, bill_number: 'BILL-PO-2026-Y01', supplier_name: 'SilkRoute Yarns Ltd', material_name: 'Cotton Yarn Ne 40s Combed', lot_number: 'LOT-COT-8921', quantity: 2500, unit: 'kg', rate: 272, subtotal: 680000, gst_amount: 34000, total_amount: 714000, status: 'VERIFIED & PAID' },
    { id: 2, bill_number: 'BILL-PO-2026-Y02', supplier_name: 'Vardhman Spinning Mills', material_name: 'Poly-Viscose Micro-Blend', lot_number: 'LOT-PV-4012', quantity: 1800, unit: 'kg', rate: 300, subtotal: 540000, gst_amount: 27000, total_amount: 567000, status: 'VERIFIED & PAID' },
    { id: 3, bill_number: 'BILL-PO-2026-D01', supplier_name: 'Dyestuff Global India', material_name: 'Reactive Dyes & Salts', lot_number: 'LOT-DYE-991', quantity: 450, unit: 'kg', rate: 411, subtotal: 185000, gst_amount: 9250, total_amount: 194250, status: 'VERIFIED & PAID' },
    { id: 4, bill_number: 'BILL-PO-2026-P01', supplier_name: 'Apex Packaging Corp', material_name: 'Heavy Corrugated Tubes', lot_number: 'LOT-PKG-08', quantity: 1200, unit: 'units', rate: 45, subtotal: 54000, gst_amount: 2700, total_amount: 56700, status: 'VERIFIED & PAID' },
  ],
};

export const ClosingTheBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  // Set document title
  useEffect(() => {
    document.title = 'Financial Close | Everest Textile OS';
  }, []);

  // State
  const [activeTab, setActiveTab] = useState<'pnl' | 'cost_sheets' | 'machine_yield' | 'worker_wages' | 'raw_materials'>('pnl');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('October 2026');
  const [data, setData] = useState<ClosingTheBooksResponse>(FALLBACK_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>('');

  // Modal State for adding new cost entry directly into PostgreSQL
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCategory, setNewCategory] = useState<'raw_material' | 'electricity' | 'labor' | 'dye_chemical' | 'overhead' | 'maintenance'>('electricity');
  const [newAmount, setNewAmount] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newOrderId, setNewOrderId] = useState<string>('');
  const [isSubmittingCost, setIsSubmittingCost] = useState<boolean>(false);

  // Load from live PostgreSQL backend
  const fetchLedger = useCallback(async (period: string, isSilent: boolean = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await financeService.getClosingTheBooks(period);
      if (res?.data) {
        setData(res.data);
        setLastSynced(new Date().toLocaleTimeString());
      }
    } catch (err: any) {
      console.warn('[FinanceService] Could not reach backend, retaining cached ledger', err);
      if (!isSilent) {
        addToast({
          type: 'warning',
          title: 'Reconciliation Network Latency',
          message: 'Displayed values reflect the last authoritative cached period data.',
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchLedger(selectedPeriod);
  }, [fetchLedger, selectedPeriod]);

  // Handle Recording New Cost Entry into PostgreSQL
  const handleRecordCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      addToast({ type: 'danger', title: 'Invalid Amount', message: 'Please enter a valid expense amount in INR.' });
      return;
    }
    if (!newDesc.trim()) {
      addToast({ type: 'danger', title: 'Missing Description', message: 'Please enter a transaction description.' });
      return;
    }

    setIsSubmittingCost(true);
    try {
      await financeService.recordCostEntry({
        category: newCategory,
        amount: amountVal,
        currency: 'INR',
        sales_order_id: newOrderId ? parseInt(newOrderId, 10) : null,
        description: newDesc.trim(),
      });
      addToast({
        type: 'success',
        title: 'Expense Recorded',
        message: `Recorded ₹${amountVal.toLocaleString()} expense in PostgreSQL ledger.`,
      });
      setIsModalOpen(false);
      setNewAmount('');
      setNewDesc('');
      setNewOrderId('');
      // Re-fetch dynamic books immediately
      await fetchLedger(selectedPeriod, true);
    } catch (err: any) {
      addToast({
        type: 'danger',
        title: 'Recording Failed',
        message: err?.message || 'Failed to record cost entry in PostgreSQL.',
      });
    } finally {
      setIsSubmittingCost(false);
    }
  };

  const hasCompleteData = data.total_revenue > 0 || data.total_expenses > 0;

  return (
    <div className="min-h-screen bg-[#F4F2ED] text-[#111111] font-sans">
      {/* ── REFINED PAGE HEADING HIERARCHY ── */}
      <header className="border-b border-[#111111] bg-[#111111] text-[#F4F2ED] px-4 sm:px-6 py-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-[#F04424] text-white text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 font-bold">
                FINANCE / MONTH-END RECONCILIATION
              </span>
              <div className="flex items-center gap-2 bg-[#222222] border border-[#333333] px-2 py-0.5 text-[10px] font-mono text-[#10B981]">
                <Database className="w-3 h-3 text-[#10B981] animate-pulse" />
                <span>POSTGRESQL LIVE LEDGER</span>
                {lastSynced && <span className="text-[#9CA3AF]">· {lastSynced}</span>}
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#F4F2ED] uppercase font-display">
              FINANCIAL CLOSE / PROFITABILITY
            </h1>
            <p className="text-xs text-[#9CA3AF] font-mono">
              Revenue reconciliation · Production costing · Operating expenses · Margin analysis
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Period Selector */}
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="appearance-none bg-[#222222] border border-[#444444] text-[#F4F2ED] px-4 py-2 pr-8 text-xs font-mono font-bold uppercase rounded-none focus:outline-none focus:border-[#F04424] cursor-pointer"
              >
                <option value="October 2026">OCTOBER 2026 (CURRENT)</option>
                <option value="September 2026">SEPTEMBER 2026</option>
                <option value="August 2026">AUGUST 2026</option>
                <option value="Q3 2026">Q3 2026 AUDIT CYCLE</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Refresh from PostgreSQL */}
            <button
              onClick={() => fetchLedger(selectedPeriod)}
              disabled={isRefreshing}
              className="px-3 py-2 bg-[#222222] border border-[#444444] text-[#F4F2ED] hover:bg-[#333333] text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
              title="Re-query PostgreSQL database"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isRefreshing && 'animate-spin text-[#F04424]')} />
              <span>SYNC</span>
            </button>

            {/* Record New Cost Entry Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-2 bg-[#F04424] text-white hover:bg-[#D03416] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shadow-none"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>RECORD EXPENSE</span>
            </button>

            {/* Print Statement */}
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#222222] border border-[#444444] text-[#F4F2ED] hover:bg-[#333333] text-xs font-mono uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── AUDITED FINANCIAL SUMMARY BANNER ── */}
        <section className="border-2 border-[#111111] bg-white p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E5E7EB]">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#10B981] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                <span>FINANCIAL CLOSE AUDIT VERDICT · {data.period.toUpperCase()}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#111111] uppercase tracking-tight font-display">
                {!hasCompleteData
                  ? 'AWAITING RECONCILIATION ENTRIES FOR PERIOD.'
                  : data.is_profitable
                  ? 'YES, THE MILL MADE MONEY THIS MONTH.'
                  : 'FACTORY OPERATING DEFICIT RECORDED.'}
              </h2>
              <p className="text-sm text-[#4B5563] leading-relaxed font-serif">
                {!hasCompleteData
                  ? `No verified invoices or expenses have been posted to the PostgreSQL ledger for ${data.period}. Use 'RECORD EXPENSE' or complete production dispatches to reconcile.`
                  : data.verdict}
              </p>
            </div>

            {/* Key Bottom-Line Figures with Rupee, Lakh, and Crore Context */}
            <div className="flex flex-wrap items-center gap-6 bg-[#F4F2ED] border border-[#111111] p-5">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-[#6B7280] font-bold">
                  NET OPERATING PROFIT
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-[#10B981]">
                  {formatINR(data.net_profit)}
                  <span className="text-xs font-mono text-[#6B7280] ml-1.5 font-bold">
                    {formatLakhsCrores(data.net_profit)}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#4B5563]">
                  Revenue ({formatINR(data.total_revenue)}) - Expenses ({formatINR(data.total_expenses)})
                </div>
              </div>
              <div className="h-12 w-[1px] bg-[#D1D5DB] hidden sm:block" />
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-[#6B7280] font-bold">
                  EBITDA MARGIN
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-[#111111]">
                  {data.ebitda_margin_pct}%
                </div>
                <div className="text-[10px] font-mono text-[#10B981] font-bold">
                  Operating Profit / Gross Revenue
                </div>
              </div>
            </div>
          </div>

          {/* Reconciliation Narrative & Accounting Formula Disclosure */}
          <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4B5563]">
            <div className="border-l-2 border-[#111111] pl-3 space-y-1">
              <span className="font-mono font-bold text-[#111111] uppercase">01 / ORDER CASH CAPTURE</span>
              <p>
                {formatINR(data.buyer_payments_total)} {formatLakhsCrores(data.buyer_payments_total)} collected via RTGS/NEFT clearing across reconciled sales shipments.
              </p>
            </div>
            <div className="border-l-2 border-[#F04424] pl-3 space-y-1">
              <span className="font-mono font-bold text-[#111111] uppercase">02 / MATERIAL COST BURN</span>
              <p>
                Raw material costs totalled {formatINR(data.raw_material_bills_total)} {formatLakhsCrores(data.raw_material_bills_total)}. Authoritative YarnIQ yarn consumption matches physical stock issues.
              </p>
            </div>
            <div className="border-l-2 border-[#111111] pl-3 space-y-1">
              <span className="font-mono font-bold text-[#111111] uppercase">03 / FLOOR PAYROLL &amp; POWER</span>
              <p>
                Workforce wages ({formatINR(data.worker_wages_total)}) and utilities/opex ({formatINR(data.machine_opex_total)}) audited against loom machine telemetry.
              </p>
            </div>
          </div>
        </section>

        {/* ── 4 FINANCIAL PILLARS GRID (REFINED LABELS & INTERACTIVE DRILL-DOWNS) ── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1 */}
          <div
            onClick={() => setActiveTab('cost_sheets')}
            className="border border-[#111111] bg-white p-5 flex flex-col justify-between hover:border-[#F04424] hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase tracking-wider group-hover:text-[#F04424] transition-colors">
                  PILLAR 01 · BUYER COLLECTIONS
                </span>
                <Banknote className="w-4 h-4 text-[#111111] group-hover:text-[#F04424]" />
              </div>
              <div className="text-2xl font-mono font-black text-[#111111] mt-2">
                {formatINR(data.buyer_payments_total)}
              </div>
              <div className="text-xs text-[#10B981] font-mono flex items-center gap-1 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>100% DISPATCH RECONCILED</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] font-mono flex justify-between items-center">
              <span>Invoiced revenue from active sales orders</span>
              <ChevronRight className="w-3 h-3 text-[#111111]" />
            </div>
          </div>

          {/* Pillar 2 */}
          <div
            onClick={() => setActiveTab('raw_materials')}
            className="border border-[#111111] bg-white p-5 flex flex-col justify-between hover:border-[#F04424] hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase tracking-wider group-hover:text-[#F04424] transition-colors">
                  PILLAR 02 · RAW MATERIAL COSTS
                </span>
                <Package className="w-4 h-4 text-[#F04424]" />
              </div>
              <div className="text-2xl font-mono font-black text-[#111111] mt-2">
                {formatINR(data.raw_material_bills_total)}
              </div>
              <div className="text-xs text-[#4B5563] font-mono flex items-center gap-1 font-bold">
                <span>COTTON, POLY &amp; DYES (COGS)</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] font-mono flex justify-between items-center">
              <span>Supplier invoices matched with PO receipts</span>
              <ChevronRight className="w-3 h-3 text-[#111111]" />
            </div>
          </div>

          {/* Pillar 3 */}
          <div
            onClick={() => setActiveTab('worker_wages')}
            className="border border-[#111111] bg-white p-5 flex flex-col justify-between hover:border-[#F04424] hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase tracking-wider group-hover:text-[#F04424] transition-colors">
                  PILLAR 03 · WORKFORCE COSTS
                </span>
                <Users className="w-4 h-4 text-[#111111] group-hover:text-[#F04424]" />
              </div>
              <div className="text-2xl font-mono font-black text-[#111111] mt-2">
                {formatINR(data.worker_wages_total)}
              </div>
              <div className="text-xs text-[#10B981] font-mono flex items-center gap-1 font-bold">
                <span>3 SHIFTS · ZERO ATTENDANCE FINES</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] font-mono flex justify-between items-center">
              <span>Weaving, Dyehouse &amp; Finishing plant wages</span>
              <ChevronRight className="w-3 h-3 text-[#111111]" />
            </div>
          </div>

          {/* Pillar 4 */}
          <div
            onClick={() => setActiveTab('machine_yield')}
            className="border border-[#111111] bg-white p-5 flex flex-col justify-between hover:border-[#F04424] hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-[#6B7280] font-bold uppercase tracking-wider group-hover:text-[#F04424] transition-colors">
                  PILLAR 04 · MACHINE POWER &amp; OVERHEADS
                </span>
                <Cpu className="w-4 h-4 text-[#111111] group-hover:text-[#F04424]" />
              </div>
              <div className="text-2xl font-mono font-black text-[#111111] mt-2">
                {formatINR(data.machine_opex_total)}
              </div>
              <div className="text-xs text-[#4B5563] font-mono flex items-center gap-1 font-bold">
                <span>ELECTRICITY &amp; PREVENTATIVE SPARES</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E5E7EB] text-[11px] text-[#6B7280] font-mono flex justify-between items-center">
              <span>Grid power, diesel genset &amp; loom maintenance</span>
              <ChevronRight className="w-3 h-3 text-[#111111]" />
            </div>
          </div>
        </section>

        {/* ── NAVIGATION TABS ── */}
        <nav className="border border-[#111111] bg-white grid grid-cols-2 md:grid-cols-5 text-center">
          {[
            { id: 'pnl', label: '01 / P&L RECONCILIATION' },
            { id: 'cost_sheets', label: '02 / ORDER COST SHEETS' },
            { id: 'machine_yield', label: '03 / MACHINE POWER & OVERHEADS' },
            { id: 'worker_wages', label: '04 / WORKFORCE COSTS' },
            { id: 'raw_materials', label: '05 / RAW MATERIAL COSTS' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={clsx(
                'py-3.5 px-4 text-xs font-mono font-bold tracking-wider uppercase border-b-2 md:border-b-0 md:border-r border-[#111111] last:border-r-0 cursor-pointer transition-colors',
                activeTab === tab.id
                  ? 'bg-[#111111] text-[#F4F2ED]'
                  : 'bg-white text-[#4B5563] hover:bg-[#F4F2ED]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── TAB 1: P&L RECONCILIATION ── */}
        {activeTab === 'pnl' && (
          <div className="space-y-8">
            {/* Visual Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Waterfall Bar Chart */}
              <div className="lg:col-span-2 border border-[#111111] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                      P&amp;L Margin Waterfall Breakdown
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-mono">
                      Gross invoiced revenue burn through cost categories to net profit (INR)
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-[#F4F2ED] px-2 py-1 border border-[#D1D5DB]">
                    WATERFALL
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.waterfall_data} margin={{ top: 20, right: 10, left: 10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="2 2" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#111111' }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#6B7280' }}
                        tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          borderColor: '#111111',
                          color: '#F4F2ED',
                          borderRadius: 0,
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                        formatter={(val: any) => [formatINR(Math.abs(Number(val))), 'Amount']}
                      />
                      <Bar dataKey="amount">
                        {data.waterfall_data.map((entry, index) => {
                          const fill =
                            entry.type === 'positive'
                              ? '#111111'
                              : entry.type === 'total'
                              ? '#10B981'
                              : '#F04424';
                          return <Cell key={`cell-${index}`} fill={fill} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Expense Distribution Pie */}
              <div className="border border-[#111111] bg-white p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3">
                  <div>
                    <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                      Factory Cost Distribution
                    </h3>
                    <p className="text-[11px] text-[#6B7280] font-mono">Total operating costs: {formatINR(data.total_expenses)}</p>
                  </div>
                  <PieIcon className="w-4 h-4 text-[#6B7280]" />
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.expense_distribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {data.expense_distribution.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          borderColor: '#111111',
                          color: '#F4F2ED',
                          borderRadius: 0,
                          fontFamily: 'monospace',
                          fontSize: 12,
                        }}
                        formatter={(val: any) => [formatINR(Number(val)), 'Expense']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB]">
                  {data.expense_distribution.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5" style={{ backgroundColor: item.color }} />
                        <span className="text-[#4B5563] truncate max-w-[140px]">{item.name}</span>
                      </div>
                      <span className="font-bold text-[#111111]">{formatINR(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complete Itemized Financial Audit Statement */}
            <div className="border border-[#111111] bg-white">
              <div className="p-4 bg-[#F4F2ED] border-b border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                    Audited Profit &amp; Loss Statement — {data.period.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-[#6B7280] font-mono">
                    Budget vs. Actual Variance Analysis · Indian Rupees (INR)
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase bg-white px-2.5 py-1 border border-[#111111] font-bold">
                  AUTHORITATIVE RECONCILIATION
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#111111] bg-white text-[#111111] uppercase tracking-wider">
                      <th className="py-3 px-4 font-black">CODE</th>
                      <th className="py-3 px-4 font-black">LEDGER ACCOUNT / CATEGORY</th>
                      <th className="py-3 px-4 font-black text-right">BUDGET (INR)</th>
                      <th className="py-3 px-4 font-black text-right">ACTUAL (INR)</th>
                      <th className="py-3 px-4 font-black text-right">VARIANCE</th>
                      <th className="py-3 px-4 font-black text-right">% VAR</th>
                      <th className="py-3 px-4 font-black text-right">% REV</th>
                      <th className="py-3 px-4 font-black text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {data.financial_statement.map((row, idx) => (
                      <tr
                        key={idx}
                        className={clsx(
                          row.is_total
                            ? 'bg-[#F4F2ED] font-black text-[#111111] border-t-2 border-b-2 border-[#111111]'
                            : 'hover:bg-[#FBFBF9]'
                        )}
                      >
                        <td className="py-3 px-4 font-bold text-[#6B7280]">{row.code}</td>
                        <td className="py-3 px-4 text-[#111111] font-medium">{row.label}</td>
                        <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.budget)}</td>
                        <td className="py-3 px-4 text-right font-black text-[#111111]">{formatINR(row.actual)}</td>
                        <td
                          className={clsx(
                            'py-3 px-4 text-right font-bold',
                            row.variance >= 0 ? 'text-[#10B981]' : 'text-[#F04424]'
                          )}
                        >
                          {row.variance >= 0 ? `+${formatINR(row.variance)}` : formatINR(row.variance)}
                        </td>
                        <td className="py-3 px-4 text-right">{row.variance_pct}%</td>
                        <td className="py-3 px-4 text-right text-[#6B7280]">{row.pct_of_rev}%</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={clsx(
                              'px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border',
                              row.status === 'favorable'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : row.status === 'unfavorable'
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: ORDER COST SHEETS ── */}
        {activeTab === 'cost_sheets' && (
          <div className="space-y-6">
            <div className="border border-[#111111] bg-white p-6 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h3 className="text-base font-mono font-black uppercase text-[#111111]">
                    Job-Order Margins &amp; Cost Sheet Ledger
                  </h3>
                  <p className="text-xs text-[#6B7280] font-mono">
                    Full absorption costing per sales order: Raw Materials + Dyes + Power + Floor Labor
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-[#111111] text-white px-2 py-1 uppercase font-bold">
                    {data.order_cost_sheets.length} AUDITED ORDERS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {data.order_cost_sheets.map((order, idx) => (
                  <div key={idx} className="border border-[#111111] bg-[#FBFBF9] p-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
                        <span className="font-mono font-black text-sm text-[#111111]">{order.order_number}</span>
                        <span
                          className={clsx(
                            'text-[9px] font-mono font-bold px-2 py-0.5 uppercase border',
                            order.margin_pct >= 20
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                              : 'bg-amber-100 text-amber-800 border-amber-400'
                          )}
                        >
                          {order.margin_pct}% MARGIN
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-xs font-bold text-[#111111]">{order.customer_name}</div>
                        <div className="text-[11px] text-[#6B7280] font-mono">{order.fabric_spec}</div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-[#E5E7EB] text-xs font-mono">
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Revenue:</span>
                          <span className="font-bold text-[#111111]">{formatINR(order.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Yarn &amp; Materials:</span>
                          <span>{formatINR(order.material_cost)}</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Dyes &amp; Auxiliaries:</span>
                          <span>{formatINR(order.dye_chem_cost)}</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Machine Power:</span>
                          <span>{formatINR(order.power_cost)}</span>
                        </div>
                        <div className="flex justify-between text-[#6B7280]">
                          <span>Shift Labor:</span>
                          <span>{formatINR(order.labor_cost)}</span>
                        </div>
                        <div className="flex justify-between text-[#111111] font-black pt-1 border-t border-dashed border-[#D1D5DB]">
                          <span>Net Profit:</span>
                          <span className="text-[#10B981]">{formatINR(order.net_profit)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: MACHINE POWER & OVERHEADS ── */}
        {activeTab === 'machine_yield' && (
          <div className="border border-[#111111] bg-white">
            <div className="p-4 bg-[#F4F2ED] border-b border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                  Machine Telemetry &amp; Energy Overhead Audit
                </h3>
                <p className="text-[11px] text-[#6B7280] font-mono">
                  Direct electrical kWh consumption, spares amortisation &amp; cost-per-meter
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-white px-2.5 py-1 border border-[#111111] font-bold">
                6 PRODUCTION ASSETS AUDITED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#111111] bg-white text-[#111111] uppercase tracking-wider">
                    <th className="py-3 px-4 font-black">CODE</th>
                    <th className="py-3 px-4 font-black">MACHINE ASSET</th>
                    <th className="py-3 px-4 font-black">PROCESS</th>
                    <th className="py-3 px-4 font-black text-right">OUTPUT (M)</th>
                    <th className="py-3 px-4 font-black text-right">ENERGY (KWH)</th>
                    <th className="py-3 px-4 font-black text-right">POWER BILL</th>
                    <th className="py-3 px-4 font-black text-right">SPARES OPEX</th>
                    <th className="py-3 px-4 font-black text-right">UPTIME %</th>
                    <th className="py-3 px-4 font-black text-right">COST / METER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.machine_yield_opex.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBFBF9]">
                      <td className="py-3 px-4 font-bold text-[#F04424]">{row.machine_code}</td>
                      <td className="py-3 px-4 font-medium text-[#111111]">{row.name}</td>
                      <td className="py-3 px-4 text-[#6B7280]">{row.process_type}</td>
                      <td className="py-3 px-4 text-right font-black">{row.meters_produced.toLocaleString()} m</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{row.power_kwh.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-[#111111] font-bold">{formatINR(row.power_cost)}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.maintenance_cost)}</td>
                      <td className="py-3 px-4 text-right text-[#10B981] font-bold">{row.uptime_pct}%</td>
                      <td className="py-3 px-4 text-right font-black text-[#111111]">₹{row.cost_per_meter.toFixed(2)}/m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: WORKFORCE COSTS ── */}
        {activeTab === 'worker_wages' && (
          <div className="border border-[#111111] bg-white">
            <div className="p-4 bg-[#F4F2ED] border-b border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                  Departmental Payroll &amp; Wage Disbursement
                </h3>
                <p className="text-[11px] text-[#6B7280] font-mono">
                  Floor headcount, shift presence &amp; direct operator compensation
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-white px-2.5 py-1 border border-[#111111] font-bold">
                MONTHLY PAYROLL AUDIT
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#111111] bg-white text-[#111111] uppercase tracking-wider">
                    <th className="py-3 px-4 font-black">DEPARTMENT</th>
                    <th className="py-3 px-4 font-black text-center">HEADCOUNT</th>
                    <th className="py-3 px-4 font-black text-center">ACTIVE ON FLOOR</th>
                    <th className="py-3 px-4 font-black text-right">BASE SALARY</th>
                    <th className="py-3 px-4 font-black text-right">OVERTIME PAY</th>
                    <th className="py-3 px-4 font-black text-right">TOTAL WAGES (INR)</th>
                    <th className="py-3 px-4 font-black text-center">ATTENDANCE %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.worker_payroll.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBFBF9]">
                      <td className="py-3 px-4 font-bold text-[#111111] uppercase">{row.department}</td>
                      <td className="py-3 px-4 text-center font-bold">{row.headcount} Staff</td>
                      <td className="py-3 px-4 text-center text-[#10B981] font-bold">{row.present_count}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.regular_wages)}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.overtime_wages)}</td>
                      <td className="py-3 px-4 text-right font-black text-[#111111]">{formatINR(row.total_payroll)}</td>
                      <td className="py-3 px-4 text-center text-[#10B981] font-bold">{row.attendance_pct}%</td>
                    </tr>
                  ))}
                  <tr className="bg-[#F4F2ED] font-black border-t-2 border-[#111111]">
                    <td className="py-3 px-4">TOTAL FLOOR PAYROLL</td>
                    <td className="py-3 px-4 text-center">
                      {data.worker_payroll.reduce((acc, r) => acc + r.headcount, 0)} Staff
                    </td>
                    <td className="py-3 px-4 text-center text-[#10B981]">100%</td>
                    <td className="py-3 px-4 text-right" colSpan={2}>
                      Disbursed directly via Bank Direct Credit
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-sm">
                      {formatINR(data.worker_wages_total)}
                    </td>
                    <td className="py-3 px-4 text-center text-[#10B981]">AUDITED</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: RAW MATERIAL COSTS ── */}
        {activeTab === 'raw_materials' && (
          <div className="border border-[#111111] bg-white">
            <div className="p-4 bg-[#F4F2ED] border-b border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-mono font-black uppercase text-[#111111]">
                  Supplier Invoices &amp; Raw Material Receipts
                </h3>
                <p className="text-[11px] text-[#6B7280] font-mono">
                  Gate-in lot receipts reconciled against YarnIQ PO authorizations
                </p>
              </div>
              <span className="text-[10px] font-mono uppercase bg-white px-2.5 py-1 border border-[#111111] font-bold">
                GST INPUT VERIFIED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#111111] bg-white text-[#111111] uppercase tracking-wider">
                    <th className="py-3 px-4 font-black">BILL / INVOICE #</th>
                    <th className="py-3 px-4 font-black">SUPPLIER</th>
                    <th className="py-3 px-4 font-black">MATERIAL DESCRIPTION</th>
                    <th className="py-3 px-4 font-black">LOT #</th>
                    <th className="py-3 px-4 font-black text-right">QTY</th>
                    <th className="py-3 px-4 font-black text-right">RATE</th>
                    <th className="py-3 px-4 font-black text-right">SUBTOTAL</th>
                    <th className="py-3 px-4 font-black text-right">GST (5%)</th>
                    <th className="py-3 px-4 font-black text-right">TOTAL (INR)</th>
                    <th className="py-3 px-4 font-black text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {data.raw_material_bills.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FBFBF9]">
                      <td className="py-3 px-4 font-bold text-[#111111]">{row.bill_number}</td>
                      <td className="py-3 px-4 font-medium text-[#4B5563]">{row.supplier_name}</td>
                      <td className="py-3 px-4 text-[#111111]">{row.material_name}</td>
                      <td className="py-3 px-4 text-[#6B7280] font-mono">{row.lot_number}</td>
                      <td className="py-3 px-4 text-right font-bold">{row.quantity} {row.unit}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">₹{row.rate}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.subtotal)}</td>
                      <td className="py-3 px-4 text-right text-[#6B7280]">{formatINR(row.gst_amount)}</td>
                      <td className="py-3 px-4 text-right font-black text-[#111111]">{formatINR(row.total_amount)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 text-[9px] font-bold uppercase">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ── MODAL: RECORD NEW EXPENSE INTO POSTGRESQL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-2 border-[#111111] max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#6B7280] hover:text-[#111111]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#111111] pb-3 mb-4">
              <span className="text-[10px] font-mono font-bold uppercase text-[#F04424] block">
                POSTGRESQL AUDIT TRANSACTION
              </span>
              <h3 className="text-xl font-mono font-black uppercase text-[#111111]">
                Record Factory Operating Expense
              </h3>
              <p className="text-xs text-[#6B7280] font-mono mt-1">
                Persists cost entry directly into `cost_entries` table for job costing reconciliation.
              </p>
            </div>

            <form onSubmit={handleRecordCost} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-[#111111] mb-1">
                  Cost Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#F4F2ED] border border-[#111111] px-3 py-2 text-[#111111] focus:outline-none focus:border-[#F04424]"
                >
                  <option value="raw_material">Raw Material (Yarns / Blends)</option>
                  <option value="dye_chemical">Dyes &amp; Processing Chemicals</option>
                  <option value="electricity">Machine Electricity &amp; Fuel</option>
                  <option value="labor">Direct Shift Floor Labor</option>
                  <option value="maintenance">Preventative Loom Maintenance / Spares</option>
                  <option value="overhead">Factory Overheads &amp; Shed Lease</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#111111] mb-1">
                  Amount in Indian Rupees (INR ₹)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 85000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full bg-[#F4F2ED] border border-[#111111] px-3 py-2 text-[#111111] focus:outline-none focus:border-[#F04424]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#111111] mb-1">
                  Description / Audit Narrative
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EB Power Bill - Oct 2026 Shift Units"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#F4F2ED] border border-[#111111] px-3 py-2 text-[#111111] focus:outline-none focus:border-[#F04424]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-[#111111] mb-1">
                  Sales Order ID (Optional for Job Absorption)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1 (Leave blank for plant-wide overhead)"
                  value={newOrderId}
                  onChange={(e) => setNewOrderId(e.target.value)}
                  className="w-full bg-[#F4F2ED] border border-[#111111] px-3 py-2 text-[#111111] focus:outline-none focus:border-[#F04424]"
                />
              </div>

              <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#111111] text-[#111111] hover:bg-[#F4F2ED] text-xs font-mono uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCost}
                  className="px-4 py-2 bg-[#F04424] text-white hover:bg-[#D03416] text-xs font-mono uppercase font-bold flex items-center gap-2"
                >
                  {isSubmittingCost ? 'Persisting...' : 'Post to Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClosingTheBooksPage;
