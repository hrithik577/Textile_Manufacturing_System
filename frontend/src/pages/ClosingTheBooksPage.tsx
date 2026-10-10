import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
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
import { Button } from '../components/common/Button';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

// Format Indian Rupee currency (e.g. ₹52,14,000)
export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export const ClosingTheBooksPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');
  const [activeTab, setActiveTab] = useState<'pnl' | 'orders' | 'machines' | 'wages' | 'materials'>('pnl');
  const [orderSortBy, setOrderSortBy] = useState<'margin' | 'revenue' | 'cost'>('margin');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<string | null>(null);

  // ─── 1. OVERALL MONTH-END P&L RECONCILIATION SUMMARY ──────────────────────────
  const plSummary = {
    monthName: 'October 2026 (Month-End Closing)',
    grossBuyerRevenue: 5214000, // ₹52,14,000 received/billed from buyers
    cashCollected: 4680000,     // ₹46,80,000 cash in bank
    outstandingReceivables: 534000, // ₹5,34,000 pending milestone balance

    rawMaterialCosts: 2240500,  // Raw cotton yarn, synthetic filament, dyes, chemicals
    workerWages: 965000,        // Total payroll disbursed across 30 workers
    machineElectricityConsumables: 748300, // Power bills, loom oil, stenter gas, needles
    maintenanceRepairs: 210000, // Machine spare parts & emergency rapier motor repairs
    factoryOverheadsAdmin: 205000, // Water treatment, factory rent, logistics, insurance

    totalManufacturingCost: 4368800, // COGM + Overheads = ₹43,68,800
    netProfit: 845200,          // Net Profit: +₹8,45,200
    netMarginPercent: 16.2,     // 16.2% Net Margin
    isProfitable: true,
  };

  // ─── 2. ORDER-BY-ORDER ACTUAL COST ACCOUNTING ───────────────────────────────
  const orderCostLedger = [
    {
      orderId: 'ord-100',
      orderNumber: 'ORD-2026-084',
      customerCompany: 'Nordic Apparel Group (Stockholm)',
      fabricType: '100% Combed Cotton Single Jersey (180 GSM)',
      metersProduced: 12000,
      buyerRevenue: 3820000,
      costRawMaterial: 1528000,
      costMachineProcessing: 889000,
      costWorkerWages: 310000,
      costOverheads: 243000,
      totalActualCost: 2970000,
      netProfit: 850000,
      netMarginPercent: 22.3,
      plannedMarginPercent: 20.0,
      varianceInr: -85000, // Negative variance = savings vs planned cost!
      status: 'TOP MARGIN' as const,
      machinesUsed: ['SPIN-01', 'WEAVE-02', 'DYE-01', 'STENT-01', 'QC-01'],
      notes: 'Record efficiency on Toyota JAT810 loom; minimal weft breakage.',
    },
    {
      orderId: 'ord-101',
      orderNumber: 'ORD-2026-089',
      customerCompany: 'Zara Inditex Sourcing (A Coruña)',
      fabricType: 'Organic Cotton Twill 3/1 Heavy (260 GSM)',
      metersProduced: 15000,
      buyerRevenue: 4950000,
      costRawMaterial: 2130000,
      costMachineProcessing: 1280000,
      costWorkerWages: 412000,
      costOverheads: 340000,
      totalActualCost: 4162000,
      netProfit: 788000,
      netMarginPercent: 15.9,
      plannedMarginPercent: 17.5,
      varianceInr: 78000, // Cost overrun due to reactive dye price hike
      status: 'STEADY' as const,
      machinesUsed: ['SPIN-01', 'WEAVE-01', 'DYE-02', 'STENT-01', 'QC-01'],
      notes: 'Reactive Navy dye lot DB-902 cost +8% higher than projected.',
    },
    {
      orderId: 'ord-104',
      orderNumber: 'ORD-2026-097',
      customerCompany: 'Patagonia Outdoor Gear (Ventura)',
      fabricType: 'Recycled Ripstop Technical Nylon (190 GSM)',
      metersProduced: 5000,
      buyerRevenue: 2450000,
      costRawMaterial: 1140000,
      costMachineProcessing: 695000,
      costWorkerWages: 215000,
      costOverheads: 155000,
      totalActualCost: 2205000,
      netProfit: 245000,
      netMarginPercent: 10.0,
      plannedMarginPercent: 18.0,
      varianceInr: 195000, // High variance due to loom breakdown & airjet reroute
      status: 'MARGIN SQUEEZED' as const,
      machinesUsed: ['WEAVE-03 (Broke)', 'WEAVE-01 (Expedited)', 'QC-01'],
      notes: 'Loom #3 motor failure incurred ₹75,000 emergency repairs + weekend shift overtime.',
    },
    {
      orderId: 'ord-102',
      orderNumber: 'ORD-2026-092',
      customerCompany: 'H&M Conscious Sourcing (Stockholm)',
      fabricType: 'Organic Cotton Oxford Weave (145 GSM)',
      metersProduced: 8000,
      buyerRevenue: 2840000,
      costRawMaterial: 1190000,
      costMachineProcessing: 680000,
      costWorkerWages: 290000,
      costOverheads: 180000,
      totalActualCost: 2340000,
      netProfit: 500000,
      netMarginPercent: 17.6,
      plannedMarginPercent: 18.0,
      varianceInr: 10000,
      status: 'STEADY' as const,
      machinesUsed: ['SPIN-02', 'WEAVE-02', 'DYE-01'],
      notes: 'Minor dye shade variance batch DB-841 rectified with single-stage re-leveling.',
    },
    {
      orderId: 'ord-103',
      orderNumber: 'ORD-2026-095',
      customerCompany: 'Marks & Spencer Sourcing (London)',
      fabricType: 'Linen Viscose Blend Fabric (210 GSM)',
      metersProduced: 6000,
      buyerRevenue: 2280000,
      costRawMaterial: 960000,
      costMachineProcessing: 510000,
      costWorkerWages: 195000,
      costOverheads: 125000,
      totalActualCost: 1790000,
      netProfit: 490000,
      netMarginPercent: 21.5,
      plannedMarginPercent: 20.0,
      varianceInr: -35000,
      status: 'HIGH PROFIT' as const,
      machinesUsed: ['WEAVE-02', 'FIN-01', 'QC-01'],
      notes: 'Smooth weaving with zero weft stops on Toyota JAT810.',
    },
  ];

  // ─── 3. MACHINE MONTHLY PRODUCTION & OPERATING COST LEDGER ──────────────────
  const machineMonthlyLedger = [
    {
      code: 'SPIN-01',
      name: 'Rieter RSB-D 50 Draw Frame',
      process: 'Spinning',
      monthlyOutputMeters: 102400,
      uptimeHours: 540,
      downtimeHours: 18,
      oeePercent: 94.2,
      powerCost: 72400,
      maintenanceCost: 12500,
      consumablesCost: 8200,
      totalCost: 93100,
      costPerMeter: 0.91,
      ordersProcessed: ['ORD-2026-084', 'ORD-2026-089'],
    },
    {
      code: 'SPIN-02',
      name: 'Zinser 351 Ring Spinning Frame',
      process: 'Spinning',
      monthlyOutputMeters: 94800,
      uptimeHours: 520,
      downtimeHours: 24,
      oeePercent: 91.5,
      powerCost: 68200,
      maintenanceCost: 14000,
      consumablesCost: 7600,
      totalCost: 89800,
      costPerMeter: 0.95,
      ordersProcessed: ['ORD-2026-092', 'ORD-2026-097'],
    },
    {
      code: 'WEAVE-01',
      name: 'Picanol OmniPlus-i Airjet Loom #1',
      process: 'Weaving',
      monthlyOutputMeters: 34200,
      uptimeHours: 490,
      downtimeHours: 35,
      oeePercent: 88.7,
      powerCost: 88600,
      maintenanceCost: 18400,
      consumablesCost: 12000,
      totalCost: 119000,
      costPerMeter: 3.48,
      ordersProcessed: ['ORD-2026-089', 'ORD-2026-097 (Rerouted)'],
    },
    {
      code: 'WEAVE-02',
      name: 'Toyota JAT810 Air Jet Loom #2',
      process: 'Weaving',
      monthlyOutputMeters: 37500,
      uptimeHours: 530,
      downtimeHours: 12,
      oeePercent: 96.1,
      powerCost: 84300,
      maintenanceCost: 9500,
      consumablesCost: 11200,
      totalCost: 105000,
      costPerMeter: 2.80,
      ordersProcessed: ['ORD-2026-084', 'ORD-2026-092', 'ORD-2026-095'],
    },
    {
      code: 'WEAVE-03',
      name: 'Dornier Rapier Loom #3 (Heavy Twill)',
      process: 'Weaving',
      monthlyOutputMeters: 21800,
      uptimeHours: 380,
      downtimeHours: 88,
      oeePercent: 74.3,
      powerCost: 62400,
      maintenanceCost: 75000, // Emergency motor replacement
      consumablesCost: 9800,
      totalCost: 147200,
      costPerMeter: 6.75, // Spike due to repairs
      ordersProcessed: ['ORD-2026-097 (Tripped)'],
    },
    {
      code: 'DYE-01',
      name: 'Thies soft-TRD High Temp Soft Flow Jigger #1',
      process: 'Dyeing & Wet Finishing',
      monthlyOutputMeters: 48000,
      uptimeHours: 460,
      downtimeHours: 20,
      oeePercent: 91.2,
      powerCost: 112000,
      maintenanceCost: 16500,
      consumablesCost: 28400,
      totalCost: 156900,
      costPerMeter: 3.27,
      ordersProcessed: ['ORD-2026-084', 'ORD-2026-092'],
    },
  ];

  // ─── 4. WORKER WAGES & PAYROLL DISBURSEMENT LEDGER ──────────────────────────
  const departmentWagesSummary = [
    { dept: 'Spinning Section', workerCount: 6, totalWages: 185000, avgEfficiency: 93.5 },
    { dept: 'Weaving Sheds', workerCount: 12, totalWages: 324000, avgEfficiency: 86.2 },
    { dept: 'Dyehouse & Wet Processing', workerCount: 5, totalWages: 198000, avgEfficiency: 92.0 },
    { dept: 'Stenter Finishing Line', workerCount: 4, totalWages: 138000, avgEfficiency: 92.8 },
    { dept: 'Quality Control & Grading Lab', workerCount: 3, totalWages: 120000, avgEfficiency: 97.4 },
  ];

  const workerPayrollLedger = [
    {
      id: 'w-1',
      name: 'Ramesh Patel',
      empId: 'EMP-SP-101',
      department: 'Spinning',
      role: 'Master Technician',
      assignedMachine: 'SPIN-01',
      shiftsWorked: 26,
      basePay: 28000,
      overtimePay: 4200,
      performanceBonus: 3500,
      netDisbursed: 35700,
      status: 'Paid',
      bankUtr: 'HDFC2610198214',
    },
    {
      id: 'w-2',
      name: 'Suresh Kumar',
      empId: 'EMP-SP-102',
      department: 'Spinning',
      role: 'Senior Operator',
      assignedMachine: 'SPIN-02',
      shiftsWorked: 25,
      basePay: 24000,
      overtimePay: 3100,
      performanceBonus: 2800,
      netDisbursed: 29900,
      status: 'Paid',
      bankUtr: 'SBIN2610284712',
    },
    {
      id: 'w-3',
      name: 'Anand Verma',
      empId: 'EMP-WV-204',
      department: 'Weaving',
      role: 'Senior Operator',
      assignedMachine: 'WEAVE-01',
      shiftsWorked: 26,
      basePay: 25000,
      overtimePay: 4800,
      performanceBonus: 3200,
      netDisbursed: 33000,
      status: 'Paid',
      bankUtr: 'ICIC2610399120',
    },
    {
      id: 'w-4',
      name: 'Manoj Gupta',
      empId: 'EMP-WV-207',
      department: 'Weaving',
      role: 'Senior Operator',
      assignedMachine: 'WEAVE-02',
      shiftsWorked: 26,
      basePay: 25000,
      overtimePay: 5100,
      performanceBonus: 4000,
      netDisbursed: 34100,
      status: 'Paid',
      bankUtr: 'AXIS2610471928',
    },
    {
      id: 'w-5',
      name: 'Deepak Rao',
      empId: 'EMP-WV-209',
      department: 'Weaving',
      role: 'Senior Operator',
      assignedMachine: 'WEAVE-03',
      shiftsWorked: 24,
      basePay: 24000,
      overtimePay: 2200,
      performanceBonus: 800,
      netDisbursed: 27000,
      status: 'Paid',
      bankUtr: 'HDFC2610582914',
    },
    {
      id: 'w-6',
      name: 'Sunil Verma',
      empId: 'EMP-WV-212',
      department: 'Weaving',
      role: 'Junior Operator',
      assignedMachine: 'WEAVE-04',
      shiftsWorked: 24,
      basePay: 20000,
      overtimePay: 1800,
      performanceBonus: 1200,
      netDisbursed: 23000,
      status: 'Paid',
      bankUtr: 'SBIN2610691823',
    },
    {
      id: 'w-7',
      name: 'David Chen',
      empId: 'EMP-QC-501',
      department: 'Quality Control',
      role: 'Lead QA Inspector',
      assignedMachine: 'QC-01',
      shiftsWorked: 26,
      basePay: 32000,
      overtimePay: 3800,
      performanceBonus: 5000,
      netDisbursed: 40800,
      status: 'Paid',
      bankUtr: 'CITI2610019284',
    },
  ];

  // ─── 5. RAW MATERIAL BILLS & SUPPLIER INVOICES ─────────────────────────────
  const rawMaterialBills = [
    {
      id: 'bill-1',
      invoiceNo: 'INV-VRD-9921',
      supplier: 'Vardhman Textiles Ltd (Chandigarh)',
      category: 'Raw Yarn (Combed Cotton)',
      lotRef: 'LOT-CT-401 (30s Ne Organic)',
      quantity: '4,200 kg',
      amountInr: 840000,
      paymentStatus: 'Paid',
      paymentDate: '2026-10-04',
      allocatedOrders: 'ORD-2026-084, ORD-2026-092',
    },
    {
      id: 'bill-2',
      invoiceNo: 'INV-ALK-8840',
      supplier: 'Alok Industries Spinning Div (Silvassa)',
      category: 'Raw Yarn (Carded & Ring Spun)',
      lotRef: 'LOT-TW-201 (20s x 16s)',
      quantity: '6,500 kg',
      amountInr: 620000,
      paymentStatus: 'Paid',
      paymentDate: '2026-10-08',
      allocatedOrders: 'ORD-2026-089 (Zara Twill)',
    },
    {
      id: 'bill-3',
      invoiceNo: 'INV-REL-7731',
      supplier: 'Reliance Industries Polyester Div (Hazira)',
      category: 'Microfilament Filament',
      lotRef: 'LOT-PET-50D (Recycled Post-Consumer)',
      quantity: '3,800 kg',
      amountInr: 480000,
      paymentStatus: 'Paid',
      paymentDate: '2026-10-12',
      allocatedOrders: 'ORD-2026-097 (Patagonia Ripstop)',
    },
    {
      id: 'bill-4',
      invoiceNo: 'INV-ARC-5510',
      supplier: 'Archroma India Chemicals (Thane)',
      category: 'Dyes & Colorants',
      lotRef: 'Reactive Blue 220, Drimarene Black',
      quantity: '850 kg',
      amountInr: 195500,
      paymentStatus: 'Paid',
      paymentDate: '2026-10-15',
      allocatedOrders: 'ORD-2026-089, ORD-2026-097',
    },
    {
      id: 'bill-5',
      invoiceNo: 'INV-HNT-4402',
      supplier: 'Huntsman Textile Effects (Baroda)',
      category: 'Finishing Auxiliaries & Softeners',
      lotRef: 'Macro-silicone Emulsion & Wetting Agents',
      quantity: '520 kg',
      amountInr: 105000,
      paymentStatus: 'Paid',
      paymentDate: '2026-10-18',
      allocatedOrders: 'ORD-2026-084, ORD-2026-095',
    },
  ];

  // Cost Distribution Chart Data (Editorial Palette)
  const costDistributionData = [
    { name: 'Raw Material Bills', value: plSummary.rawMaterialCosts, color: '#111111' },
    { name: 'Worker Wages (Payroll)', value: plSummary.workerWages, color: '#F04424' },
    { name: 'Machine Electricity & Gas', value: plSummary.machineElectricityConsumables, color: '#4B5563' },
    { name: 'Maintenance & Repairs', value: plSummary.maintenanceRepairs, color: '#9CA3AF' },
    { name: 'Factory Overhead & Admin', value: plSummary.factoryOverheadsAdmin, color: '#D1D5DB' },
  ];

  // Revenue vs Cost vs Profit Breakdown Chart Data
  const orderComparisonData = orderCostLedger.map((o) => ({
    order: o.orderNumber.replace('ORD-2026-', '#'),
    name: o.customerCompany.split(' ')[0],
    Revenue: o.buyerRevenue / 100000, // Lakhs
    TotalCost: o.totalActualCost / 100000,
    NetProfit: o.netProfit / 100000,
  }));

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    addToast({
      type: 'success',
      title: 'Month-End Audit Ledger Exported',
      message: 'Downloaded executive P&L statement, order cost sheets, and payroll ledger CSV.',
    });
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-sans pb-16 space-y-6">

      {/* ─── Top Industrial Header ─────────────────────────────────────── */}
      <div className="bg-[var(--color-ink)] text-white px-6 py-5 editorial-border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[var(--color-vermilion)] flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black tracking-widest uppercase font-mono text-white">
                CLOSING THE BOOKS — OWNER'S MONTH-END P&L
              </h1>
              <span className="text-[9px] font-mono px-2 py-0.5 bg-[var(--color-vermilion)] text-white font-bold">
                SCENE 6 · FINANCIAL CLOSING
              </span>
            </div>
            <p className="text-[10px] font-mono text-white/50 tracking-wider uppercase mt-0.5">
              Reconciles buyer revenue, raw material bills, worker wages, and machine operating costs in one place.
            </p>
          </div>
        </div>

        {/* Month Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center bg-white/10 px-2 py-1.5 border border-white/20">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-white font-mono uppercase text-xs focus:outline-none cursor-pointer"
            >
              <option value="2026-10" className="bg-[var(--color-ink)] text-white">October 2026 (Closing)</option>
              <option value="2026-09" className="bg-[var(--color-ink)] text-white">September 2026 (Archived)</option>
              <option value="2026-08" className="bg-[var(--color-ink)] text-white">August 2026 (Archived)</option>
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase border border-white/20 text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Ledger
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase bg-[var(--color-vermilion)] text-white hover:bg-white hover:text-[var(--color-ink)] transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Statement
          </button>
        </div>
      </div>

      {/* ─── THE BOTTOM-LINE VERDICT BANNER (DID THE MILL MAKE MONEY?) ───────── */}
      <div className="editorial-border bg-white p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[var(--color-ink)] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
              <CheckCircle2 className="w-3 h-3 text-[var(--color-vermilion)]" />
              MONTH-END VERDICT: PROFITABLE OPERATIONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono text-[var(--color-ink)] uppercase tracking-tight">
              Yes, the mill made money this month.
            </h2>
            <p className="text-xs font-mono text-[var(--color-industrial-grey)] max-w-2xl leading-relaxed">
              After accounting for all <strong>{formatINR(plSummary.rawMaterialCosts)}</strong> in raw material bills, <strong>{formatINR(plSummary.workerWages)}</strong> in worker wages, and <strong>{formatINR(plSummary.machineElectricityConsumables + plSummary.maintenanceRepairs + plSummary.factoryOverheadsAdmin)}</strong> in machine energy & overheads, the mill cleared a net operating profit of:
            </p>
          </div>

          {/* Big Profit Hero Numbers */}
          <div className="bg-[var(--color-paper)] editorial-border p-5 text-right shrink-0">
            <span className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase tracking-widest block font-bold">
              OCTOBER NET OPERATING PROFIT
            </span>
            <div className="text-3xl sm:text-4xl font-black font-mono text-[var(--color-success-green)] mt-1">
              +{formatINR(plSummary.netProfit)}
            </div>
            <div className="mt-2 flex items-center justify-end gap-2 text-xs font-mono">
              <span className="text-[var(--color-industrial-grey)] uppercase font-bold">Net Margin:</span>
              <span className="font-bold text-white bg-[var(--color-ink)] px-2 py-0.5 font-mono">
                {plSummary.netMarginPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── THE 4 FINANCIAL PILLARS SUMMARY CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--color-light-border)] editorial-border">
        {/* Pillar 1: Inflow */}
        <div className="p-4 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-industrial-grey)]">
            <span className="font-bold uppercase tracking-wider text-[10px]">1. Payments From Buyers</span>
            <ArrowUpRight className="w-4 h-4 text-[var(--color-success-green)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-ink)]">
            {formatINR(plSummary.grossBuyerRevenue)}
          </div>
          <div className="text-[10px] text-[var(--color-industrial-grey)] flex items-center justify-between font-mono pt-2 border-t border-[var(--color-light-border)]">
            <span>Collected: {formatINR(plSummary.cashCollected)}</span>
            <span className="font-bold">5 Orders</span>
          </div>
        </div>

        {/* Pillar 2: Material Bills */}
        <div className="p-4 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-industrial-grey)]">
            <span className="font-bold uppercase tracking-wider text-[10px]">2. Raw Material Bills</span>
            <ArrowDownRight className="w-4 h-4 text-[var(--color-vermilion)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-ink)]">
            {formatINR(plSummary.rawMaterialCosts)}
          </div>
          <div className="text-[10px] text-[var(--color-industrial-grey)] flex items-center justify-between font-mono pt-2 border-t border-[var(--color-light-border)]">
            <span>Yarn, Dyes & Auxiliaries</span>
            <span className="text-[var(--color-vermilion)] font-bold">43.0% Rev</span>
          </div>
        </div>

        {/* Pillar 3: Worker Wages */}
        <div className="p-4 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-industrial-grey)]">
            <span className="font-bold uppercase tracking-wider text-[10px]">3. Worker Wages Paid</span>
            <ArrowDownRight className="w-4 h-4 text-[var(--color-vermilion)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-ink)]">
            {formatINR(plSummary.workerWages)}
          </div>
          <div className="text-[10px] text-[var(--color-industrial-grey)] flex items-center justify-between font-mono pt-2 border-t border-[var(--color-light-border)]">
            <span>30 Operators & Supervisors</span>
            <span className="font-bold">18.5% Rev</span>
          </div>
        </div>

        {/* Pillar 4: Machine Energy & Opex */}
        <div className="p-4 bg-white space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--color-industrial-grey)]">
            <span className="font-bold uppercase tracking-wider text-[10px]">4. Machine Power & Opex</span>
            <ArrowDownRight className="w-4 h-4 text-[var(--color-vermilion)]" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--color-ink)]">
            {formatINR(plSummary.machineElectricityConsumables + plSummary.maintenanceRepairs + plSummary.factoryOverheadsAdmin)}
          </div>
          <div className="text-[10px] text-[var(--color-industrial-grey)] flex items-center justify-between font-mono pt-2 border-t border-[var(--color-light-border)]">
            <span>Power, Gas & Repairs</span>
            <span className="font-bold">22.3% Rev</span>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS (Editorial 5-Tile Grid) ───────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[var(--color-light-border)] editorial-border text-xs font-mono">
        {[
          { key: 'pnl', label: '01 / MONTH-END P&L' },
          { key: 'orders', label: '02 / ORDER COST SHEETS (5)' },
          { key: 'machines', label: '03 / MACHINE YIELD & OPEX (6)' },
          { key: 'wages', label: '04 / WORKER WAGES (30)' },
          { key: 'materials', label: '05 / RAW MATERIAL BILLS (5)' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={clsx(
                'p-3.5 text-left font-bold tracking-wider uppercase transition-colors',
                isActive
                  ? 'bg-[var(--color-ink)] text-white border-b-2 border-[var(--color-vermilion)]'
                  : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-paper)]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: P&L CONSOLIDATED STATEMENT                                       */}
      {/* ======================================================================= */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Waterfall Chart: Order Revenue vs Costs */}
            <div className="lg:col-span-2 bg-white editorial-border p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 editorial-border-b">
                <div>
                  <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[var(--color-ink)]">
                    Order Revenue vs Manufacturing Costs (₹ Lakhs)
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase">
                    Revenue, incurred costs, and net profit per client order
                  </p>
                </div>
                <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 bg-[var(--color-paper)] editorial-border">
                  WATERFALL
                </span>
              </div>

              <div className="h-64 sm:h-72 w-full font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#e5e1da" />
                    <XAxis dataKey="name" stroke="#111111" tick={{ fill: '#111111', fontSize: 10, fontFamily: 'monospace' }} />
                    <YAxis stroke="#111111" tick={{ fill: '#111111', fontSize: 10, fontFamily: 'monospace' }} unit="L" />
                    <Tooltip
                      formatter={(val: any) => [`₹${(Number(val) * 100000).toLocaleString('en-IN')}`, '']}
                      contentStyle={{
                        backgroundColor: '#111111',
                        border: '1px solid #111111',
                        borderRadius: '0px',
                        color: '#ffffff',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '10px' }} />
                    <Bar dataKey="Revenue" fill="#111111" radius={[0, 0, 0, 0]} name="Buyer Revenue" />
                    <Bar dataKey="TotalCost" fill="#F04424" radius={[0, 0, 0, 0]} name="Actual Cost" />
                    <Bar dataKey="NetProfit" fill="#1a7a4a" radius={[0, 0, 0, 0]} name="Net Profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Outflow Distribution Doughnut */}
            <div className="bg-white editorial-border p-5 flex flex-col justify-between">
              <div>
                <div className="pb-3 editorial-border-b mb-4">
                  <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[var(--color-ink)]">
                    Factory Expense Breakdown
                  </h3>
                  <p className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase">
                    Total Incurred: {formatINR(plSummary.totalManufacturingCost)}
                  </p>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {costDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatINR(Number(val)), '']}
                        contentStyle={{
                          backgroundColor: '#111111',
                          border: '1px solid #111111',
                          borderRadius: '0px',
                          color: '#ffffff',
                          fontSize: '11px',
                          fontFamily: 'monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-[var(--color-light-border)] text-xs font-mono">
                {costDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-[var(--color-ink)] truncate text-[10px] font-bold uppercase">{item.name}</span>
                    </div>
                    <span className="font-bold text-[var(--color-ink)] shrink-0 text-[10px]">
                      {formatINR(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consolidated P&L Table */}
          <div className="bg-white editorial-border overflow-hidden">
            <div className="p-4 bg-[var(--color-ink)] text-white flex items-center justify-between">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                OFFICIAL FACTORY INCOME & EXPENSE AUDIT STATEMENT
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-vermilion)] font-bold uppercase">
                FY 2026–27 · OCTOBER AUDIT
              </span>
            </div>

            <div className="divide-y divide-[var(--color-light-border)] text-xs font-mono">
              {/* Gross Revenue */}
              <div className="p-4 flex items-center justify-between bg-[var(--color-paper)]">
                <div>
                  <span className="font-black text-[var(--color-ink)] text-sm uppercase">GROSS INCOMING REVENUE</span>
                  <p className="text-[var(--color-industrial-grey)] text-[10px] uppercase">Total payments billed and collected from all brand buyers</p>
                </div>
                <span className="font-mono font-black text-[var(--color-success-green)] text-base">
                  +{formatINR(plSummary.grossBuyerRevenue)}
                </span>
              </div>

              {/* Deductions: Raw Materials */}
              <div className="p-3 px-6 flex items-center justify-between">
                <span className="text-[var(--color-ink)]">Less: Raw Material Bills (Cotton Yarn, Poly Filament, Dyes & Auxiliaries)</span>
                <span className="font-mono text-[var(--color-vermilion)] font-bold">
                  -{formatINR(plSummary.rawMaterialCosts)}
                </span>
              </div>

              {/* Deductions: Worker Wages */}
              <div className="p-3 px-6 flex items-center justify-between">
                <span className="text-[var(--color-ink)]">Less: Factory Worker Wages & Payroll (30 operators, technicians & overtime)</span>
                <span className="font-mono text-[var(--color-vermilion)] font-bold">
                  -{formatINR(plSummary.workerWages)}
                </span>
              </div>

              {/* Deductions: Machine Electricity */}
              <div className="p-3 px-6 flex items-center justify-between">
                <span className="text-[var(--color-ink)]">Less: Machine Electricity, Gas & Consumables (10 production machine units)</span>
                <span className="font-mono text-[var(--color-vermilion)] font-bold">
                  -{formatINR(plSummary.machineElectricityConsumables)}
                </span>
              </div>

              {/* Deductions: Machine Maintenance */}
              <div className="p-3 px-6 flex items-center justify-between">
                <span className="text-[var(--color-ink)]">Less: Machine Spare Parts & Emergency Repairs (Loom #3 Rapier Inverter)</span>
                <span className="font-mono text-[var(--color-vermilion)] font-bold">
                  -{formatINR(plSummary.maintenanceRepairs)}
                </span>
              </div>

              {/* Deductions: Factory Overheads */}
              <div className="p-3 px-6 flex items-center justify-between">
                <span className="text-[var(--color-ink)]">Less: Factory Overheads, Effluent Treatment (ETP), Logistics & Admin</span>
                <span className="font-mono text-[var(--color-vermilion)] font-bold">
                  -{formatINR(plSummary.factoryOverheadsAdmin)}
                </span>
              </div>

              {/* Net Operating Profit Bottomline */}
              <div className="p-4 flex items-center justify-between bg-[var(--color-paper)] border-t-2 border-[var(--color-ink)]">
                <div>
                  <span className="font-black text-[var(--color-ink)] text-sm uppercase">
                    NET OPERATING PROFIT (OWNER'S EARNINGS)
                  </span>
                  <p className="text-[var(--color-industrial-grey)] text-[10px] uppercase">
                    Net cash margin realized for the month of October 2026
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-[var(--color-success-green)] text-xl block">
                    +{formatINR(plSummary.netProfit)}
                  </span>
                  <span className="text-[10px] text-[var(--color-industrial-grey)] font-mono font-bold uppercase">
                    MARGIN: {plSummary.netMarginPercent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 2: ORDER-BY-ORDER ACTUAL COST ACCOUNTING                           */}
      {/* ======================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white editorial-border">
            <div>
              <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[var(--color-ink)]">
                Order-by-Order Actual Manufacturing Cost Breakdown
              </h3>
              <p className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase">
                Compare billed revenue against actual yarn, worker wages, and machine costs incurred for every customer order.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[var(--color-industrial-grey)] uppercase font-bold text-[10px]">Sort by:</span>
              <select
                value={orderSortBy}
                onChange={(e) => setOrderSortBy(e.target.value as any)}
                className="bg-[var(--color-paper)] editorial-border px-3 py-1.5 text-xs font-mono text-[var(--color-ink)] focus:outline-none"
              >
                <option value="margin">NET MARGIN %</option>
                <option value="revenue">TOTAL REVENUE (₹)</option>
                <option value="cost">ACTUAL COST (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {orderCostLedger
              .sort((a, b) => {
                if (orderSortBy === 'margin') return b.netMarginPercent - a.netMarginPercent;
                if (orderSortBy === 'revenue') return b.buyerRevenue - a.buyerRevenue;
                return b.totalActualCost - a.totalActualCost;
              })
              .map((order) => {
                const isSelected = selectedOrderDetails === order.orderId;
                const costPercent = Math.round((order.totalActualCost / order.buyerRevenue) * 100);

                return (
                  <div
                    key={order.orderId}
                    className="p-5 bg-white editorial-border space-y-4 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-[var(--color-vermilion)]">
                            {order.orderNumber}
                          </span>
                          <span className="font-bold text-[var(--color-ink)] text-xs sm:text-sm font-mono uppercase">
                            {order.customerCompany}
                          </span>
                          <span
                            className={clsx(
                              'text-[9px] font-mono px-2 py-0.5 font-bold uppercase',
                              order.status === 'TOP MARGIN'
                                ? 'bg-[var(--color-success-green)] text-white'
                                : order.status === 'HIGH PROFIT'
                                ? 'bg-[var(--color-ink)] text-white'
                                : order.status === 'MARGIN SQUEEZED'
                                ? 'bg-[var(--color-vermilion)] text-white'
                                : 'bg-[var(--color-paper)] text-[var(--color-ink)] editorial-border'
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[var(--color-industrial-grey)] mt-1">
                          {order.fabricType} • Volume: <span className="text-[var(--color-ink)] font-bold">{order.metersProduced.toLocaleString()} meters</span>
                        </p>
                      </div>

                      {/* Revenue, Cost & Net Margin Badges */}
                      <div className="flex flex-wrap items-center gap-4 text-right">
                        <div>
                          <span className="text-[9px] text-[var(--color-industrial-grey)] block font-mono uppercase font-bold">BUYER PAYMENT</span>
                          <span className="text-sm font-bold font-mono text-[var(--color-ink)]">
                            {formatINR(order.buyerRevenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-[var(--color-industrial-grey)] block font-mono uppercase font-bold">ACTUAL COST</span>
                          <span className="text-sm font-bold font-mono text-[var(--color-vermilion)]">
                            {formatINR(order.totalActualCost)}
                          </span>
                        </div>
                        <div className="bg-[var(--color-paper)] p-2 px-3 editorial-border">
                          <span className="text-[9px] text-[var(--color-industrial-grey)] block font-mono uppercase font-bold">NET PROFIT</span>
                          <span className="text-base font-black font-mono text-[var(--color-success-green)]">
                            +{formatINR(order.netProfit)}
                          </span>
                          <span className="text-[9px] font-bold text-[var(--color-success-green)] block font-mono">
                            {order.netMarginPercent}% margin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Stack Bar */}
                    <div>
                      <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase">
                        <span className="text-[var(--color-industrial-grey)]">Cost of Goods Manufactured (COGM): {costPercent}% of Revenue</span>
                        <span className="text-[var(--color-industrial-grey)]">
                          Variance vs Plan:{' '}
                          <span className={order.varianceInr > 0 ? 'text-[var(--color-vermilion)] font-bold' : 'text-[var(--color-success-green)] font-bold'}>
                            {order.varianceInr > 0 ? `+${formatINR(order.varianceInr)} Overrun` : `${formatINR(order.varianceInr)} Savings`}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[var(--color-paper)] overflow-hidden flex editorial-border">
                        <div
                          title="Raw Material"
                          className="bg-[var(--color-ink)] h-full"
                          style={{ width: `${(order.costRawMaterial / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Machine Processing"
                          className="bg-[var(--color-vermilion)] h-full"
                          style={{ width: `${(order.costMachineProcessing / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Worker Wages"
                          className="bg-[#4B5563] h-full"
                          style={{ width: `${(order.costWorkerWages / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Overheads"
                          className="bg-[#9CA3AF] h-full"
                          style={{ width: `${(order.costOverheads / order.buyerRevenue) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase pt-2 border-t border-[var(--color-light-border)]">
                      <span>Machines Used: {order.machinesUsed.join(', ')}</span>
                      <span>Notes: {order.notes}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: MACHINE MONTHLY PRODUCTION & OPERATING COST LEDGER               */}
      {/* ======================================================================= */}
      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="p-4 bg-white editorial-border">
            <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[var(--color-ink)]">
              Machine Production Yield & Direct Operating Cost Ledger
            </h3>
            <p className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
              Tracks kilowatt power bills, maintenance spares, uptime hours, and net cost-per-meter for every loom and frame.
            </p>
          </div>

          <div className="editorial-border bg-white overflow-hidden">
            <table className="w-full text-left text-xs font-mono text-[var(--color-ink)]">
              <thead className="bg-[var(--color-ink)] text-white uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Machine Code & Model</th>
                  <th className="px-4 py-3">Process</th>
                  <th className="px-4 py-3">Monthly Output</th>
                  <th className="px-4 py-3">Uptime / Down</th>
                  <th className="px-4 py-3">OEE Yield</th>
                  <th className="px-4 py-3">Power Bill (₹)</th>
                  <th className="px-4 py-3">Repairs (₹)</th>
                  <th className="px-4 py-3 text-right">Cost Per Meter</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-light-border)]">
                {machineMonthlyLedger.map((m) => (
                  <tr key={m.code} className="hover:bg-[var(--color-paper)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-black text-[var(--color-vermilion)] block">{m.code}</span>
                      <span className="text-[10px] text-[var(--color-industrial-grey)]">{m.name}</span>
                    </td>
                    <td className="px-4 py-3 uppercase">{m.process}</td>
                    <td className="px-4 py-3 font-bold">{m.monthlyOutputMeters.toLocaleString()} m</td>
                    <td className="px-4 py-3">
                      <span>{m.uptimeHours}h up</span>
                      <span className="text-[var(--color-vermilion)] block text-[10px]">{m.downtimeHours}h down</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold">{m.oeePercent}%</span>
                    </td>
                    <td className="px-4 py-3">{formatINR(m.powerCost)}</td>
                    <td className="px-4 py-3 text-[var(--color-vermilion)]">{formatINR(m.maintenanceCost)}</td>
                    <td className="px-4 py-3 text-right font-black text-sm text-[var(--color-ink)]">
                      ₹{m.costPerMeter.toFixed(2)}/m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 4: WORKER WAGES & PAYROLL DISBURSEMENT LEDGER                       */}
      {/* ======================================================================= */}
      {activeTab === 'wages' && (
        <div className="space-y-4">
          {/* Department wage summary grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-px bg-[var(--color-light-border)] editorial-border">
            {departmentWagesSummary.map((d) => (
              <div key={d.dept} className="p-4 bg-white space-y-1 font-mono text-xs">
                <span className="text-[9px] font-bold text-[var(--color-industrial-grey)] uppercase block">{d.dept}</span>
                <span className="text-base font-black text-[var(--color-ink)] block">{formatINR(d.totalWages)}</span>
                <span className="text-[10px] text-[var(--color-industrial-grey)] block">{d.workerCount} Workers · {d.avgEfficiency}% Eff</span>
              </div>
            ))}
          </div>

          <div className="editorial-border bg-white overflow-hidden">
            <div className="p-4 bg-[var(--color-ink)] text-white flex items-center justify-between">
              <h3 className="text-xs font-black uppercase font-mono tracking-wider">
                OCTOBER FACTORY WORKER PAYROLL REGISTER
              </h3>
              <span className="text-[10px] font-mono text-[var(--color-vermilion)] font-bold uppercase">
                30 WORKERS PAID
              </span>
            </div>

            <table className="w-full text-left text-xs font-mono text-[var(--color-ink)]">
              <thead className="bg-[var(--color-paper)] border-b border-[var(--color-light-border)] uppercase text-[10px] text-[var(--color-industrial-grey)]">
                <tr>
                  <th className="px-4 py-3">Worker Name & ID</th>
                  <th className="px-4 py-3">Role / Dept</th>
                  <th className="px-4 py-3">Assigned Unit</th>
                  <th className="px-4 py-3">Shifts</th>
                  <th className="px-4 py-3">Base Pay</th>
                  <th className="px-4 py-3">Overtime</th>
                  <th className="px-4 py-3">Bonus</th>
                  <th className="px-4 py-3 text-right">Net Disbursed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-light-border)]">
                {workerPayrollLedger.map((w) => (
                  <tr key={w.id} className="hover:bg-[var(--color-paper)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[var(--color-ink)] block">{w.name}</span>
                      <span className="text-[10px] text-[var(--color-industrial-grey)]">{w.empId}</span>
                    </td>
                    <td className="px-4 py-3 uppercase">{w.role} ({w.department})</td>
                    <td className="px-4 py-3 font-bold">{w.assignedMachine}</td>
                    <td className="px-4 py-3">{w.shiftsWorked} shifts</td>
                    <td className="px-4 py-3">{formatINR(w.basePay)}</td>
                    <td className="px-4 py-3">{formatINR(w.overtimePay)}</td>
                    <td className="px-4 py-3 text-[var(--color-success-green)]">{formatINR(w.performanceBonus)}</td>
                    <td className="px-4 py-3 text-right font-black text-sm text-[var(--color-ink)]">
                      {formatINR(w.netDisbursed)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 5: RAW MATERIAL BILLS & SUPPLIER INVOICES                          */}
      {/* ======================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="p-4 bg-white editorial-border">
            <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[var(--color-ink)]">
              Raw Material Purchase Invoices & Gate-In Settlements
            </h3>
            <p className="text-[10px] font-mono text-[var(--color-industrial-grey)] uppercase mt-0.5">
              Verified warehouse invoices for raw cotton yarn, filament bobbins, reactive dyes, and chemicals mapped to production orders.
            </p>
          </div>

          <div className="editorial-border bg-white overflow-hidden">
            <table className="w-full text-left text-xs font-mono text-[var(--color-ink)]">
              <thead className="bg-[var(--color-ink)] text-white uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice No & Date</th>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Lot Reference</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Allocated Orders</th>
                  <th className="px-4 py-3 text-right">Settled Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-light-border)]">
                {rawMaterialBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-[var(--color-paper)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[var(--color-vermilion)] block">{bill.invoiceNo}</span>
                      <span className="text-[10px] text-[var(--color-industrial-grey)]">{bill.paymentDate}</span>
                    </td>
                    <td className="px-4 py-3 font-bold">{bill.supplier}</td>
                    <td className="px-4 py-3 uppercase">{bill.category}</td>
                    <td className="px-4 py-3">{bill.lotRef}</td>
                    <td className="px-4 py-3 font-bold">{bill.quantity}</td>
                    <td className="px-4 py-3 text-[10px] text-[var(--color-industrial-grey)]">{bill.allocatedOrders}</td>
                    <td className="px-4 py-3 text-right font-black text-sm text-[var(--color-ink)]">
                      {formatINR(bill.amountInr)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClosingTheBooksPage;
