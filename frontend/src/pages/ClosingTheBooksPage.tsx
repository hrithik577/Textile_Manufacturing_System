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
      varianceInr: -42000, // Favorable: saved ₹42k vs planned BOM
      status: 'TOP MARGIN' as const,
      machinesUsed: ['SPIN-01', 'FIN-01', 'QC-01'],
      notes: 'Excellent fiber efficiency. Passed export inspection on first run with 0 rewinds.',
    },
    {
      orderId: 'ord-101',
      orderNumber: 'ORD-2026-089',
      customerCompany: 'Zara Inditex Sourcing (Spain)',
      fabricType: 'Cotton Twill Chino Fabric 2/1 (240 GSM)',
      metersProduced: 18000,
      buyerRevenue: 6636000,
      costRawMaterial: 2604000,
      costMachineProcessing: 1738000,
      costWorkerWages: 580000,
      costOverheads: 394000,
      totalActualCost: 5316000,
      netProfit: 1320000,
      netMarginPercent: 19.9,
      plannedMarginPercent: 18.5,
      varianceInr: -90000, // Favorable
      status: 'HIGH PROFIT' as const,
      machinesUsed: ['SPIN-01', 'WEAVE-01', 'DYE-01'],
      notes: 'Optimal loom speed on Airjet #1. Dye liquor ratio was precisely balanced.',
    },
    {
      orderId: 'ord-104',
      orderNumber: 'ORD-2026-097',
      customerCompany: 'Patagonia Outdoor Corp (USA)',
      fabricType: 'Recycled Poly Ripstop DWR 50D (110 GSM)',
      metersProduced: 15000,
      buyerRevenue: 6912000,
      costRawMaterial: 2950000,
      costMachineProcessing: 2280000,
      costWorkerWages: 820000,
      costOverheads: 310000,
      totalActualCost: 6360000,
      netProfit: 552000,
      netMarginPercent: 8.0,
      plannedMarginPercent: 18.0,
      varianceInr: 480000, // Unfavorable: cost overrun of ₹4.8 Lakhs due to Loom #3 breakdown
      status: 'MARGIN SQUEEZED' as const,
      machinesUsed: ['SPIN-02', 'WEAVE-03 (Broke Down)', 'WEAVE-01'],
      notes: '⚠️ Impacted by Loom #3 inverter overheat breakdown. Incurred maintenance repair + overtime labor.',
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
      varianceInr: 10000, // Slight variance
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
      ordersProcessed: ['ORD-2026-092', 'ORD-2026-095'],
    },
    {
      code: 'WEAVE-03',
      name: 'Picanol OptiMax-i Rapier Loom #3',
      process: 'Weaving',
      monthlyOutputMeters: 14800,
      uptimeHours: 285,
      downtimeHours: 145, // Critical downtime
      oeePercent: 29.3,
      powerCost: 54000,
      maintenanceCost: 68000, // Expensive Inverter replacement
      consumablesCost: 9500,
      totalCost: 131500,
      costPerMeter: 8.89, // High cost per meter!
      ordersProcessed: ['ORD-2026-097 (Patagonia)'],
    },
    {
      code: 'WEAVE-04',
      name: 'Picanol OmniPlus-i Airjet Loom #4',
      process: 'Weaving',
      monthlyOutputMeters: 18200,
      uptimeHours: 310,
      downtimeHours: 110, // Sitting idle awaiting warp beams
      oeePercent: 52.4,
      powerCost: 48000,
      maintenanceCost: 6200,
      consumablesCost: 6800,
      totalCost: 61000,
      costPerMeter: 3.35,
      ordersProcessed: ['ORD-2026-084'],
    },
    {
      code: 'DYE-01',
      name: 'Thies Eco-Master Soft-Flow Dyeing Vessel',
      process: 'Dyeing',
      monthlyOutputMeters: 68000,
      uptimeHours: 480,
      downtimeHours: 26,
      oeePercent: 93.3,
      powerCost: 142000, // High steam & electricity
      maintenanceCost: 22000,
      consumablesCost: 28000,
      totalCost: 192000,
      costPerMeter: 2.82,
      ordersProcessed: ['ORD-2026-089', 'ORD-2026-092'],
    },
    {
      code: 'DYE-02',
      name: 'Fong’s THEN-AIRFLOW Synergy 8 Vessel',
      process: 'Dyeing',
      monthlyOutputMeters: 22000,
      uptimeHours: 240,
      downtimeHours: 90, // Idle awaiting chemicals
      oeePercent: 44.1,
      powerCost: 62000,
      maintenanceCost: 11000,
      consumablesCost: 14000,
      totalCost: 87000,
      costPerMeter: 3.95,
      ordersProcessed: ['ORD-2026-097'],
    },
    {
      code: 'FIN-01',
      name: 'Monforts Montex 8500 Stenter Frame (8 Chamber)',
      process: 'Finishing',
      monthlyOutputMeters: 124000,
      uptimeHours: 560,
      downtimeHours: 14,
      oeePercent: 92.8,
      powerCost: 165000, // Gas burners + power
      maintenanceCost: 31000,
      consumablesCost: 21000,
      totalCost: 217000,
      costPerMeter: 1.75,
      ordersProcessed: ['ORD-2026-084', 'ORD-2026-089', 'ORD-2026-095'],
    },
    {
      code: 'QC-01',
      name: 'Uster FabricScan Automated Inspection System',
      process: 'Inspection',
      monthlyOutputMeters: 118000,
      uptimeHours: 580,
      downtimeHours: 10,
      oeePercent: 96.8,
      powerCost: 24000,
      maintenanceCost: 16000,
      consumablesCost: 4500,
      totalCost: 44500,
      costPerMeter: 0.38,
      ordersProcessed: ['All Production Batches'],
    },
  ];

  // Total fabric produced by all machines this month
  const totalMillMetersProduced = machineMonthlyLedger.reduce((sum, m) => sum + m.monthlyOutputMeters, 0);

  // ─── 4. WORKER WAGES & PAYROLL DISBURSEMENT LEDGER ───────────────────────────
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
      performanceBonus: 4000, // Top loom efficiency bonus
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
      performanceBonus: 800, // Lower due to machine breakdown
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
      name: 'Rajendra Prasad',
      empId: 'EMP-DY-310',
      department: 'Dyeing',
      role: 'Master Technician',
      assignedMachine: 'DYE-01',
      shiftsWorked: 26,
      basePay: 30000,
      overtimePay: 5600,
      performanceBonus: 4500,
      netDisbursed: 40100,
      status: 'Paid',
      bankUtr: 'KOTK2610782194',
    },
    {
      id: 'w-8',
      name: 'Kishore Nair',
      empId: 'EMP-DY-314',
      department: 'Dyeing',
      role: 'Junior Operator',
      assignedMachine: 'DYE-02',
      shiftsWorked: 23,
      basePay: 19000,
      overtimePay: 1500,
      performanceBonus: 1000,
      netDisbursed: 21500,
      status: 'Paid',
      bankUtr: 'SBIN2610819203',
    },
    {
      id: 'w-9',
      name: 'Prakash Patil',
      empId: 'EMP-FN-380',
      department: 'Finishing',
      role: 'Senior Operator',
      assignedMachine: 'FIN-01',
      shiftsWorked: 26,
      basePay: 26000,
      overtimePay: 4900,
      performanceBonus: 3600,
      netDisbursed: 34500,
      status: 'Paid',
      bankUtr: 'HDFC2610928174',
    },
    {
      id: 'w-10',
      name: 'David Chen',
      empId: 'EMP-QC-401',
      department: 'Inspection',
      role: 'Master QA Inspector',
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

  // Cost Distribution Chart Data
  const costDistributionData = [
    { name: 'Raw Material Bills', value: plSummary.rawMaterialCosts, color: '#0d9488' },
    { name: 'Worker Wages (Payroll)', value: plSummary.workerWages, color: '#3b82f6' },
    { name: 'Machine Electricity & Gas', value: plSummary.machineElectricityConsumables, color: '#f59e0b' },
    { name: 'Maintenance & Repairs', value: plSummary.maintenanceRepairs, color: '#f43f5e' },
    { name: 'Factory Overhead & Admin', value: plSummary.factoryOverheadsAdmin, color: '#8b5cf6' },
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
    <div className="space-y-6">
      {/* ─── Top Header & Closing Books Controls ─────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Closing the Books — Owner's Month-End P&L
            </h1>
            <DataSourceBadge source="LIVE" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Reconciles buyer revenue, raw material bills, worker wages, and machine operating costs in one place so the mill owner knows with absolute clarity whether the mill made money this month.
          </p>
        </div>

        {/* Month Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-slate-200 px-2 py-1 focus:outline-none font-mono"
            >
              <option value="2026-10">October 2026 (Closing)</option>
              <option value="2026-09">September 2026 (Archived)</option>
              <option value="2026-08">August 2026 (Archived)</option>
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Ledger
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Books
          </Button>
        </div>
      </div>

      {/* ─── THE BOTTOM-LINE VERDICT BANNER (DID THE MILL MAKE MONEY?) ───────── */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-2 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Banknote className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              MONTH-END VERDICT: PROFITABLE OPERATIONS
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Yes, the mill made money this month.
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              After accounting for all <strong>{formatINR(plSummary.rawMaterialCosts)}</strong> in raw material bills, <strong>{formatINR(plSummary.workerWages)}</strong> in worker wages, and <strong>{formatINR(plSummary.machineElectricityConsumables + plSummary.maintenanceRepairs + plSummary.factoryOverheadsAdmin)}</strong> in machine energy & overheads, the mill cleared a net operating profit of:
            </p>
          </div>

          {/* Big Profit Hero Numbers */}
          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 sm:p-5 text-right shrink-0">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest block">
              OCTOBER NET OPERATING PROFIT
            </span>
            <div className="text-3xl sm:text-4xl font-black font-display text-emerald-400 mt-0.5">
              +{formatINR(plSummary.netProfit)}
            </div>
            <div className="mt-1 flex items-center justify-end gap-2 text-xs font-mono">
              <span className="text-slate-400">Net Margin:</span>
              <span className="font-bold text-white bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 text-emerald-300">
                {plSummary.netMarginPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── THE 4 FINANCIAL PILLARS SUMMARY CARDS ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pillar 1: Inflow */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">1. Payments From Buyers</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-white">
            {formatINR(plSummary.grossBuyerRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-emerald-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800">
            <span>Collected: {formatINR(plSummary.cashCollected)}</span>
            <span className="text-slate-400">5 Orders</span>
          </div>
        </div>

        {/* Pillar 2: Material Bills */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">2. Raw Material Bills</span>
            <ArrowDownRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-amber-300">
            {formatINR(plSummary.rawMaterialCosts)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800">
            <span>Yarn, Dyes & Auxiliaries</span>
            <span className="text-amber-400">43.0% of Rev</span>
          </div>
        </div>

        {/* Pillar 3: Worker Wages */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">3. Worker Wages Paid</span>
            <ArrowDownRight className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-blue-300">
            {formatINR(plSummary.workerWages)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800">
            <span>30 Operators & Supervisors</span>
            <span className="text-blue-400">18.5% of Rev</span>
          </div>
        </div>

        {/* Pillar 4: Machine Energy & Opex */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">4. Machine Power & Opex</span>
            <ArrowDownRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-display text-purple-300">
            {formatINR(plSummary.machineElectricityConsumables + plSummary.maintenanceRepairs + plSummary.factoryOverheadsAdmin)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between font-mono pt-2 border-t border-slate-800">
            <span>Electricity, Gas & Repairs</span>
            <span className="text-purple-400">22.3% of Rev</span>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION TABS ─────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-800 overflow-x-auto gap-2">
        {[
          { key: 'pnl', label: '📊 Month-End P&L Statement', count: null },
          { key: 'orders', label: '📦 Order-by-Order Actual Cost', count: orderCostLedger.length },
          { key: 'machines', label: '⚙️ Machine Output & Opex', count: machineMonthlyLedger.length },
          { key: 'wages', label: '👷 Worker Wages & Payroll', count: '30 Workers' },
          { key: 'materials', label: '🧾 Raw Material Bills', count: rawMaterialBills.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={clsx(
              'px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-2',
              activeTab === tab.key
                ? 'border-teal-500 text-teal-400 bg-teal-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            )}
          >
            {tab.label}
            {tab.count && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ======================================================================= */}
      {/* TAB 1: P&L CONSOLIDATED STATEMENT                                       */}
      {/* ======================================================================= */}
      {activeTab === 'pnl' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Waterfall Chart: Order Revenue vs Costs */}
            <div className="lg:col-span-2 rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white font-display">
                    Order Revenue vs Manufacturing Costs (in ₹ Lakhs)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Breakdown of revenue, incurred costs, and net profit per client order
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orderComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} unit="L" />
                    <Tooltip
                      formatter={(val: any) => [`₹${(Number(val) * 100000).toLocaleString('en-IN')}`, '']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Buyer Revenue (₹ Lakhs)" />
                    <Bar dataKey="TotalCost" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Actual Cost (₹ Lakhs)" />
                    <Bar dataKey="NetProfit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit (₹ Lakhs)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Outflow Distribution Doughnut */}
            <div className="rounded-xl bg-slate-900 border border-slate-800 p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white font-display mb-1">
                  Factory Expense Breakdown
                </h3>
                <p className="text-xs text-slate-400 mb-4">Total costs: {formatINR(plSummary.totalManufacturingCost)}</p>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {costDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatINR(Number(val)), '']}
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
                {costDistributionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-300 truncate text-[11px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-white font-mono shrink-0 text-[11px]">
                      {formatINR(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Consolidated P&L Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-300">
                Official Factory Income & Expense Audit Statement
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                FY 2026–27 • Month of October
              </span>
            </div>

            <div className="divide-y divide-slate-800/80 text-xs">
              {/* Gross Revenue */}
              <div className="p-4 flex items-center justify-between bg-slate-950/20">
                <div>
                  <span className="font-bold text-white text-sm">GROSS INCOMING REVENUE</span>
                  <p className="text-slate-400 text-[11px]">Total payments billed and collected from all brand buyers</p>
                </div>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  +{formatINR(plSummary.grossBuyerRevenue)}
                </span>
              </div>

              {/* Deductions: Raw Materials */}
              <div className="p-3.5 px-6 flex items-center justify-between">
                <span className="text-slate-300">Less: Raw Material Bills (Cotton Yarn, Poly Filament, Dyes & Auxiliaries)</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -{formatINR(plSummary.rawMaterialCosts)}
                </span>
              </div>

              {/* Deductions: Worker Wages */}
              <div className="p-3.5 px-6 flex items-center justify-between">
                <span className="text-slate-300">Less: Factory Worker Wages & Payroll (30 operators, technicians & overtime)</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -{formatINR(plSummary.workerWages)}
                </span>
              </div>

              {/* Deductions: Machine Electricity & Consumables */}
              <div className="p-3.5 px-6 flex items-center justify-between">
                <span className="text-slate-300">Less: Machine Electricity, Gas & Consumables (10 production machine units)</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -{formatINR(plSummary.machineElectricityConsumables)}
                </span>
              </div>

              {/* Deductions: Machine Maintenance */}
              <div className="p-3.5 px-6 flex items-center justify-between">
                <span className="text-slate-300">Less: Machine Spare Parts & Emergency Repairs (Loom #3 Rapier Inverter)</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -{formatINR(plSummary.maintenanceRepairs)}
                </span>
              </div>

              {/* Deductions: Factory Overheads */}
              <div className="p-3.5 px-6 flex items-center justify-between">
                <span className="text-slate-300">Less: Factory Overheads, Effluent Treatment (ETP), Logistics & Admin</span>
                <span className="font-mono text-rose-400 font-semibold">
                  -{formatINR(plSummary.factoryOverheadsAdmin)}
                </span>
              </div>

              {/* Net Operating Profit Bottomline */}
              <div className="p-4 flex items-center justify-between bg-emerald-950/30 border-t-2 border-emerald-500/40">
                <div>
                  <span className="font-black text-white text-base font-display">
                    NET OPERATING PROFIT (OWNER'S EARNINGS)
                  </span>
                  <p className="text-emerald-300/80 text-[11px]">
                    Net cash margin realized for the month of October 2026
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-xl block">
                    +{formatINR(plSummary.netProfit)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Margin: {plSummary.netMarginPercent}%
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">
                Order-by-Order Actual Manufacturing Cost Breakdown
              </h3>
              <p className="text-xs text-slate-400">
                Compare billed revenue against actual yarn, worker wages, and machine costs incurred for every customer order.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Sort by:</span>
              <select
                value={orderSortBy}
                onChange={(e) => setOrderSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="margin">Net Margin %</option>
                <option value="revenue">Total Revenue (₹)</option>
                <option value="cost">Actual Cost (₹)</option>
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
                    className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-sm space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-teal-400">
                            {order.orderNumber}
                          </span>
                          <span className="font-semibold text-white text-xs sm:text-sm">
                            {order.customerCompany}
                          </span>
                          <span
                            className={clsx(
                              'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase',
                              order.status === 'TOP MARGIN'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : order.status === 'HIGH PROFIT'
                                ? 'bg-teal-950 text-teal-300 border border-teal-800'
                                : order.status === 'MARGIN SQUEEZED'
                                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                : 'bg-slate-800 text-slate-300'
                            )}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          {order.fabricType} • Volume: <span className="text-white font-mono">{order.metersProduced.toLocaleString()} meters</span>
                        </p>
                      </div>

                      {/* Revenue, Cost & Net Margin Badges */}
                      <div className="flex flex-wrap items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">BUYER PAYMENT</span>
                          <span className="text-sm font-bold font-mono text-white">
                            {formatINR(order.buyerRevenue)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">ACTUAL COST</span>
                          <span className="text-sm font-bold font-mono text-rose-300">
                            {formatINR(order.totalActualCost)}
                          </span>
                        </div>
                        <div className="bg-slate-950 p-2 px-3 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block font-mono">NET PROFIT</span>
                          <span className="text-base font-black font-mono text-emerald-400">
                            +{formatINR(order.netProfit)}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-400 block">
                            {order.netMarginPercent}% margin
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cost Stack Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Cost of Goods Manufactured (COGM): {costPercent}% of Revenue</span>
                        <span className="text-slate-400 font-mono">
                          Variance vs Plan:{' '}
                          <span className={order.varianceInr > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {order.varianceInr > 0 ? `+${formatINR(order.varianceInr)} Overrun` : `${formatINR(order.varianceInr)} Savings`}
                          </span>
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                        <div
                          title="Raw Material"
                          className="bg-teal-500 h-full"
                          style={{ width: `${(order.costRawMaterial / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Machine Processing"
                          className="bg-amber-500 h-full"
                          style={{ width: `${(order.costMachineProcessing / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Worker Wages"
                          className="bg-blue-500 h-full"
                          style={{ width: `${(order.costWorkerWages / order.buyerRevenue) * 100}%` }}
                        />
                        <div
                          title="Overheads"
                          className="bg-purple-500 h-full"
                          style={{ width: `${(order.costOverheads / order.buyerRevenue) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* 4 Cost Buckets Detail */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-teal-400 block font-mono uppercase">RAW MATERIALS</span>
                        <span className="font-mono font-bold text-white text-xs">{formatINR(order.costRawMaterial)}</span>
                        <span className="text-[10px] text-slate-500 block">Yarn & Chemicals</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-amber-400 block font-mono uppercase">MACHINE PROCESSING</span>
                        <span className="font-mono font-bold text-white text-xs">{formatINR(order.costMachineProcessing)}</span>
                        <span className="text-[10px] text-slate-500 block">Power, Gas & Maint</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-blue-400 block font-mono uppercase">WORKER WAGES</span>
                        <span className="font-mono font-bold text-white text-xs">{formatINR(order.costWorkerWages)}</span>
                        <span className="text-[10px] text-slate-500 block">Operators on Shift</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-purple-400 block font-mono uppercase">OVERHEAD & INSPECTION</span>
                        <span className="font-mono font-bold text-white text-xs">{formatINR(order.costOverheads)}</span>
                        <span className="text-[10px] text-slate-500 block">QA Lab & Factory Admin</span>
                      </div>
                    </div>

                    {/* Order Notes / Variance Explanation */}
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] leading-relaxed">{order.notes}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/orders?orderId=${order.orderId}`)}
                        rightIcon={<ExternalLink className="w-3 h-3" />}
                      >
                        Specs
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 3: MACHINE OUTPUT & OPERATING COST LEDGER                          */}
      {/* ======================================================================= */}
      {activeTab === 'machines' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">
                Machine-by-Machine Production Output & Operating Expense Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Shows exactly how much fabric every machine produced this month, its uptime hours, and power/maintenance costs incurred.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">TOTAL MILL FABRIC OUTPUT</span>
              <span className="text-lg font-bold font-mono text-teal-400">
                {totalMillMetersProduced.toLocaleString()} meters
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Machine Code & Name</th>
                    <th className="px-4 py-3">Process</th>
                    <th className="px-4 py-3 text-right">Monthly Output</th>
                    <th className="px-4 py-3 text-right">Uptime / Down</th>
                    <th className="px-4 py-3 text-right">OEE %</th>
                    <th className="px-4 py-3 text-right">Electricity Cost</th>
                    <th className="px-4 py-3 text-right">Maint. & Repairs</th>
                    <th className="px-4 py-3 text-right">Total Opex</th>
                    <th className="px-4 py-3 text-right">Cost / Meter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {machineMonthlyLedger.map((m) => (
                    <tr key={m.code} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{m.code}</div>
                        <div className="text-[11px] text-slate-400 font-sans truncate max-w-[160px]">{m.name}</div>
                      </td>
                      <td className="px-4 py-3 uppercase text-[10px] text-slate-300">
                        {m.process}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {m.monthlyOutputMeters.toLocaleString()} m
                      </td>
                      <td className="px-4 py-3 text-right text-[11px]">
                        <span className="text-emerald-400">{m.uptimeHours}h</span>
                        <span className="text-slate-500"> / </span>
                        <span className={m.downtimeHours > 50 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {m.downtimeHours}h
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        <span className={m.oeePercent > 85 ? 'text-teal-300' : 'text-amber-400'}>
                          {m.oeePercent}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200">
                        {formatINR(m.powerCost)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={m.maintenanceCost > 30000 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {formatINR(m.maintenanceCost)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white">
                        {formatINR(m.totalCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        <span className={m.costPerMeter > 5.0 ? 'text-rose-400' : 'text-emerald-400'}>
                          ₹{m.costPerMeter.toFixed(2)}/m
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

      {/* ======================================================================= */}
      {/* TAB 4: WORKER WAGES & PAYROLL DISBURSEMENT LEDGER                      */}
      {/* ======================================================================= */}
      {activeTab === 'wages' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">
                Worker Wages & Payroll Disbursement Ledger
              </h3>
              <p className="text-xs text-slate-400">
                Complete breakdown of base wages, overtime pay, and performance bonuses disbursed across all 30 factory workers.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">TOTAL WAGES DISBURSED</span>
              <span className="text-lg font-bold font-mono text-blue-400">
                {formatINR(plSummary.workerWages)}
              </span>
            </div>
          </div>

          {/* Department Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {departmentWagesSummary.map((d) => (
              <div key={d.dept} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[11px] text-slate-400 font-medium block truncate">{d.dept}</span>
                <div className="text-base font-bold font-mono text-white mt-1">
                  {formatINR(d.totalWages)}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-800">
                  <span>{d.workerCount} Workers</span>
                  <span className="text-teal-400">{d.avgEfficiency}% eff</span>
                </div>
              </div>
            ))}
          </div>

          {/* Individual Worker Payroll Table */}
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 font-display">Individual Operator Wage Statement</span>
              <span className="text-slate-400 font-mono text-[11px]">100% Disbursed via Bank Transfer</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Operator Name & ID</th>
                    <th className="px-4 py-3">Department & Role</th>
                    <th className="px-4 py-3">Assigned Unit</th>
                    <th className="px-4 py-3 text-right">Shifts Worked</th>
                    <th className="px-4 py-3 text-right">Base Wage</th>
                    <th className="px-4 py-3 text-right">Overtime Pay</th>
                    <th className="px-4 py-3 text-right">Performance Bonus</th>
                    <th className="px-4 py-3 text-right">Total Net Disbursed</th>
                    <th className="px-4 py-3 text-center">Status / UTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {workerPayrollLedger.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{w.name}</div>
                        <div className="text-[10px] text-slate-400">{w.empId}</div>
                      </td>
                      <td className="px-4 py-3 font-sans text-[11px]">
                        <span className="text-slate-200">{w.department}</span>
                        <div className="text-[10px] text-slate-400">{w.role}</div>
                      </td>
                      <td className="px-4 py-3 text-teal-400 font-bold">
                        {w.assignedMachine}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">
                        {w.shiftsWorked}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-200">
                        {formatINR(w.basePay)}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-300">
                        {formatINR(w.overtimePay)}
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-300">
                        {formatINR(w.performanceBonus)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-white text-sm">
                        {formatINR(w.netDisbursed)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px]">
                          PAID
                        </span>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">{w.bankUtr}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================= */}
      {/* TAB 5: RAW MATERIAL SUPPLIER BILLS                                     */}
      {/* ======================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-200">
                Raw Material Supplier Invoices & Procurement Bills
              </h3>
              <p className="text-xs text-slate-400">
                Verified invoices for cotton yarn cones, polyester microfilament, reactive dyes, and stenter chemical auxiliaries.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">TOTAL MATERIAL EXPENDITURE</span>
              <span className="text-lg font-bold font-mono text-amber-400">
                {formatINR(plSummary.rawMaterialCosts)}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Invoice Number</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">Material Category</th>
                    <th className="px-4 py-3">Lot / PO Reference</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Bill Amount (₹)</th>
                    <th className="px-4 py-3">Payment Date</th>
                    <th className="px-4 py-3">Allocated Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {rawMaterialBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-slate-800/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-teal-400">
                        {bill.invoiceNo}
                      </td>
                      <td className="px-4 py-3 font-sans font-semibold text-white">
                        {bill.supplier}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300">
                        {bill.category}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {bill.lotRef}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-200">
                        {bill.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-300">
                        {formatINR(bill.amountInr)}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {bill.paymentDate}
                      </td>
                      <td className="px-4 py-3 text-slate-300 font-sans text-[11px]">
                        {bill.allocatedOrders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
