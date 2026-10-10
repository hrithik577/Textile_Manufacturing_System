import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Cpu,
  Search,
  Filter,
  LayoutGrid,
  List,
  AlertTriangle,
  Play,
  Pause,
  Wrench,
  Gauge,
  Thermometer,
  Zap,
  Activity,
  User,
  Users,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  Sparkles,
  Shuffle,
  ShieldCheck,
} from 'lucide-react';
import { Machine, MachineProcessType, MachineStatus, CustomerOrder, ShiftWorker } from '../types';
import { machinesService } from '../services/machines';
import { ordersService } from '../services/orders';
import { mockShiftWorkers, mockOrders } from '../services/mock-data';
import { StatusBadge } from '../components/common/StatusBadge';
import { DataSourceBadge } from '../components/common/DataSourceBadge';
import { Button } from '../components/common/Button';
import { Drawer } from '../components/common/Drawer';
import { Modal } from '../components/common/Modal';
import { LoadingState } from '../components/common/LoadingState';
import { useApp } from '../context/AppContext';
import { clsx } from 'clsx';

export const ProductionFloorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useApp();

  const [machines, setMachines] = useState<Machine[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>(mockOrders);
  const [workers, setWorkers] = useState<ShiftWorker[]>(mockShiftWorkers);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Active view tab: 'floor' | 'order-matrix' | 'roster'
  const [activeTab, setActiveTab] = useState<'floor' | 'order-matrix' | 'roster'>('floor');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'output' | 'efficiency' | 'code' | 'downtime'>('code');

  // Selected Machine for Detail Drawer
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');

  // Worker Reassignment Modal
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTargetWorker, setReassignTargetWorker] = useState<ShiftWorker | null>(null);
  const [newAssignedMachineCode, setNewAssignedMachineCode] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [machRes, ordRes] = await Promise.all([
        machinesService.getMachines(),
        ordersService.getOrders(),
      ]);
      setMachines(machRes.data);
      if (ordRes.data && ordRes.data.length > 0) {
        setOrders(ordRes.data);
      }

      // Check if URL has ?select=m-id
      const selectId = searchParams.get('select');
      if (selectId) {
        const found = machRes.data.find((m) => m.id === selectId);
        if (found) setSelectedMachine(found);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMachines = useMemo(() => {
    return machines
      .filter((m) => {
        const matchesQuery =
          m.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.currentOrderCode && m.currentOrderCode.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesProcess = selectedProcess === 'all' || m.type === selectedProcess;
        const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

        return matchesQuery && matchesProcess && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'output') return b.shiftOutputMeters - a.shiftOutputMeters;
        if (sortBy === 'efficiency') return b.efficiencyPercent - a.efficiencyPercent;
        if (sortBy === 'downtime') return b.downtimeMinutesToday - a.downtimeMinutesToday;
        return a.code.localeCompare(b.code);
      });
  }, [machines, searchQuery, selectedProcess, selectedStatus, sortBy]);

  // Overall Production Floor Mid-Shift Aggregates
  const floorStats = useMemo(() => {
    const totalTodayMeters = machines.reduce((acc, m) => acc + m.shiftOutputMeters, 0);
    const targetTodayMeters = machines.reduce((acc, m) => acc + m.targetOutputMeters, 0);
    const totalRunning = machines.filter((m) => m.status === 'running').length;
    const totalIdle = machines.filter((m) => m.status === 'idle').length;
    const totalBreakdown = machines.filter((m) => m.status === 'breakdown').length;
    const totalSetup = machines.filter((m) => m.status === 'setup').length;
    const avgEfficiency = Math.round(
      machines.reduce((acc, m) => acc + m.efficiencyPercent, 0) / (machines.length || 1)
    );

    return {
      totalTodayMeters,
      targetTodayMeters,
      percentAchieved: Math.round((totalTodayMeters / (targetTodayMeters || 1)) * 100),
      totalRunning,
      totalIdle,
      totalBreakdown,
      totalSetup,
      avgEfficiency,
      totalFleet: machines.length,
    };
  }, [machines]);

  // Process Stage Pipeline Stats (Spinning -> Weaving -> Dyeing -> Finishing -> Inspection)
  const stageStats = useMemo(() => {
    const stages: Array<{
      id: MachineProcessType;
      label: string;
      subLabel: string;
      machines: Machine[];
      outputMeters: number;
      targetMeters: number;
      statusColor: string;
      statusNote: string;
    }> = [
      {
        id: 'spinning',
        label: '1. Yarn Spinning',
        subLabel: 'Raw Cotton / Poly ➔ Spun Yarn',
        machines: machines.filter((m) => m.type === 'spinning'),
        outputMeters: machines.filter((m) => m.type === 'spinning').reduce((a, m) => a + m.shiftOutputMeters, 0),
        targetMeters: machines.filter((m) => m.type === 'spinning').reduce((a, m) => a + m.targetOutputMeters, 0),
        statusColor: 'emerald',
        statusNote: '100% Running Normal',
      },
      {
        id: 'weaving',
        label: '2. Fabric Weaving',
        subLabel: 'Warp & Weft ➔ Greige Fabric',
        machines: machines.filter((m) => m.type === 'weaving'),
        outputMeters: machines.filter((m) => m.type === 'weaving').reduce((a, m) => a + m.shiftOutputMeters, 0),
        targetMeters: machines.filter((m) => m.type === 'weaving').reduce((a, m) => a + m.targetOutputMeters, 0),
        statusColor: machines.some((m) => m.type === 'weaving' && m.status === 'breakdown') ? 'rose' : 'emerald',
        statusNote: machines.some((m) => m.type === 'weaving' && m.status === 'breakdown')
          ? '⚠️ Stoppage: Loom #3 Down'
          : 'Normal Flow',
      },
      {
        id: 'dyeing',
        label: '3. Dyeing & Vats',
        subLabel: 'Color Bath ➔ Wet Processing',
        machines: machines.filter((m) => m.type === 'dyeing'),
        outputMeters: machines.filter((m) => m.type === 'dyeing').reduce((a, m) => a + m.shiftOutputMeters, 0),
        targetMeters: machines.filter((m) => m.type === 'dyeing').reduce((a, m) => a + m.targetOutputMeters, 0),
        statusColor: machines.some((m) => m.type === 'dyeing' && m.status === 'idle') ? 'amber' : 'emerald',
        statusNote: machines.some((m) => m.type === 'dyeing' && m.status === 'idle')
          ? '⏳ 1 Sitting Idle (Dye Shortage)'
          : 'Optimal',
      },
      {
        id: 'finishing',
        label: '4. Stenter Finishing',
        subLabel: 'Heat Setting & Softening',
        machines: machines.filter((m) => m.type === 'finishing'),
        outputMeters: machines.filter((m) => m.type === 'finishing').reduce((a, m) => a + m.shiftOutputMeters, 0),
        targetMeters: machines.filter((m) => m.type === 'finishing').reduce((a, m) => a + m.targetOutputMeters, 0),
        statusColor: 'emerald',
        statusNote: '92.8% Efficiency',
      },
      {
        id: 'inspection',
        label: '5. Inspection & QA',
        subLabel: 'Optical Scanning ➔ Rolls',
        machines: machines.filter((m) => m.type === 'inspection'),
        outputMeters: machines.filter((m) => m.type === 'inspection').reduce((a, m) => a + m.shiftOutputMeters, 0),
        targetMeters: machines.filter((m) => m.type === 'inspection').reduce((a, m) => a + m.targetOutputMeters, 0),
        statusColor: 'emerald',
        statusNote: 'Grade A Export Staging',
      },
    ];
    return stages;
  }, [machines]);

  const handleStatusChange = async (machineId: string, newStatus: MachineStatus, reason?: string) => {
    await machinesService.updateMachineStatus(machineId, newStatus, reason);
    setMachines((prev) =>
      prev.map((m) => (m.id === machineId ? { ...m, status: newStatus, downtimeReason: reason || m.downtimeReason } : m))
    );
    if (selectedMachine && selectedMachine.id === machineId) {
      setSelectedMachine((prev) => (prev ? { ...prev, status: newStatus, downtimeReason: reason || prev.downtimeReason } : null));
    }
    addToast({
      type: newStatus === 'breakdown' ? 'danger' : newStatus === 'running' ? 'success' : 'warning',
      title: `Machine Status Updated`,
      message: `Machine set to ${newStatus.toUpperCase()}${reason ? ` (${reason})` : ''}.`,
    });
  };

  const handleWorkerReassign = (worker: ShiftWorker, newMachineCode: string) => {
    setWorkers((prev) =>
      prev.map((w) => (w.id === worker.id ? { ...w, assignedMachine: newMachineCode } : w))
    );
    // Also update machine operator name if matched
    const targetMach = machines.find((m) => m.code === newMachineCode);
    if (targetMach) {
      setMachines((prev) =>
        prev.map((m) => (m.code === newMachineCode ? { ...m, operatorName: worker.name } : m))
      );
    }
    setReassignModalOpen(false);
    addToast({
      type: 'info',
      title: 'Worker Reassigned Mid-Shift',
      message: `${worker.name} successfully transferred to ${newMachineCode}.`,
    });
  };

  if (loading) {
    return <LoadingState message="Connecting to virtual machine telemetry hub..." />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Live Mid-Shift Telemetry Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Production Floor — Mid-Shift Operations
            </h1>
            <DataSourceBadge source="SIMULATED" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Live process pipeline from raw yarn through spinning, weaving, and dyeing to finished fabric. Monitor live machine status, order progress, idle units, and shift worker assignments.
          </p>
        </div>

        {/* View Switcher & Action Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Mode Tabs */}
          <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('floor')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'floor' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <Cpu className="w-3.5 h-3.5" />
              Machine Floor
            </button>
            <button
              onClick={() => setActiveTab('order-matrix')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'order-matrix' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              Order ➔ Machine Matrix
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={clsx(
                'px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
                activeTab === 'roster' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              Worker Roster ({workers.length})
            </button>
          </div>

          {/* Grid / Table Toggle (only on floor tab) */}
          {activeTab === 'floor' && (
            <div className="flex items-center rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                )}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'table' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                )}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Factory Floor Mid-Shift KPI Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Fabric Output Today */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-teal-950/60 to-slate-900 border border-teal-800/40">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Today's Total Output</span>
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-display text-white">
            {floorStats.totalTodayMeters.toLocaleString()} <span className="text-xs font-normal text-slate-400">m</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-teal-400">
            <span>Target: {floorStats.targetTodayMeters.toLocaleString()} m</span>
            <span className="font-bold">{floorStats.percentAchieved}%</span>
          </div>
        </div>

        {/* Current Shift */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Shift Status</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-1 text-sm font-bold font-display text-white truncate">
            Shift 1 (Morning)
          </div>
          <p className="mt-1 text-[10px] text-slate-400">
            06:00 – 14:00 (5h 45m elapsed)
          </p>
        </div>

        {/* Running Machines */}
        <button
          onClick={() => { setSelectedStatus('running'); setActiveTab('floor'); }}
          className={clsx(
            'p-3.5 rounded-xl border text-left transition-all',
            selectedStatus === 'running'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Running Now</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-1 text-xl font-bold font-display text-emerald-300">
            {floorStats.totalRunning} <span className="text-xs font-normal text-slate-400">/ {floorStats.totalFleet}</span>
          </div>
          <p className="mt-1 text-[10px] text-emerald-400/80">Active producing units</p>
        </button>

        {/* Sitting Idle Machines */}
        <button
          onClick={() => { setSelectedStatus('idle'); setActiveTab('floor'); }}
          className={clsx(
            'p-3.5 rounded-xl border text-left transition-all',
            selectedStatus === 'idle'
              ? 'bg-amber-950/40 border-amber-500 shadow-sm ring-1 ring-amber-500/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Sitting Idle</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-display text-amber-300">
            {floorStats.totalIdle} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <p className="mt-1 text-[10px] text-amber-400/80">Awaiting materials / beam</p>
        </button>

        {/* Breakdown Machines */}
        <button
          onClick={() => { setSelectedStatus('breakdown'); setActiveTab('floor'); }}
          className={clsx(
            'p-3.5 rounded-xl border text-left transition-all',
            selectedStatus === 'breakdown'
              ? 'bg-rose-950/40 border-rose-500 shadow-sm ring-1 ring-rose-500/50'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          )}
        >
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Breakdowns</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          </div>
          <div className="mt-1 text-xl font-bold font-display text-rose-400">
            {floorStats.totalBreakdown} <span className="text-xs font-normal text-slate-400">unit</span>
          </div>
          <p className="mt-1 text-[10px] text-rose-400/80">Loom #3 Rapier Inverter</p>
        </button>

        {/* Fleet OEE Efficiency */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Avg Fleet OEE</span>
            <Activity className="w-3.5 h-3.5 text-teal-400" />
          </div>
          <div className="mt-1 text-xl font-bold font-display text-white">
            {floorStats.avgEfficiency}%
          </div>
          <p className="mt-1 text-[10px] text-slate-400">Floor target &ge; 85%</p>
        </div>
      </div>

      {/* 3. Sequential Mid-Shift Process Pipeline Ribbon (Yarn -> Fabric Transformation) */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
              Mid-Shift Process Pipeline & Transformation Flow
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click any stage to filter machines & see fabric progression
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {stageStats.map((stage, idx) => {
            const isSelected = selectedProcess === stage.id;
            const stagePercent = stage.targetMeters > 0 ? Math.round((stage.outputMeters / stage.targetMeters) * 100) : 0;

            return (
              <button
                key={stage.id}
                onClick={() => {
                  setSelectedProcess(isSelected ? 'all' : stage.id);
                  setActiveTab('floor');
                }}
                className={clsx(
                  'p-3 rounded-lg border text-left transition-all relative overflow-hidden group',
                  isSelected
                    ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                )}
              >
                {/* Arrow connector indicator */}
                {idx < stageStats.length - 1 && (
                  <div className="hidden lg:block absolute right-[-8px] top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition-colors" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-display text-white group-hover:text-teal-300 transition-colors">
                    {stage.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {stage.machines.length} Units
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{stage.subLabel}</p>

                {/* Stage output & progress */}
                <div className="mt-2.5 pt-2 border-t border-slate-800/60">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 font-mono">
                      {stage.outputMeters.toLocaleString()} m
                    </span>
                    <span className="font-mono font-bold text-white">{stagePercent}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all duration-300',
                        stage.statusColor === 'rose'
                          ? 'bg-rose-500'
                          : stage.statusColor === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      )}
                      style={{ width: `${Math.min(100, stagePercent)}%` }}
                    />
                  </div>
                </div>

                {/* Stage Health Tag */}
                <div className="mt-2 flex items-center justify-between text-[10px]">
                  <span
                    className={clsx(
                      'font-medium truncate',
                      stage.statusColor === 'rose'
                        ? 'text-rose-400 font-semibold'
                        : stage.statusColor === 'amber'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    )}
                  >
                    {stage.statusNote}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Breakdown Critical Notice (WEAVE-03) */}
      {floorStats.totalBreakdown > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-display">
                Active Stoppage: Loom #3 Breakdown Detected (145 mins down)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong>WEAVE-03 (Picanol OptiMax-i Rapier Loom)</strong> — Main Servo Drive Overheat & Inverter Trip (Error E-402). 
                Impacts Order <strong>ORD-2026-097 (Patagonia Recycled Ripstop)</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const w = workers.find((w) => w.assignedMachine.includes('WEAVE-03'));
                if (w) {
                  setReassignTargetWorker(w);
                  setNewAssignedMachineCode('WEAVE-04');
                  setReassignModalOpen(true);
                }
              }}
              leftIcon={<Shuffle className="w-3.5 h-3.5" />}
            >
              Reassign Operator
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => navigate('/rescue-engine?issueId=resc-001')}
              rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            >
              Triage in Rescue Engine
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FLOOR MACHINE GRID / TABLE VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'floor' && (
        <div className="space-y-4">
          {/* Search, Process & Status Filters */}
          <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search machine ID (e.g. WEAVE-03), name, operator, or order code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Process Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedProcess}
                onChange={(e) => setSelectedProcess(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Processes</option>
                <option value="spinning">Spinning (2)</option>
                <option value="weaving">Weaving (4)</option>
                <option value="dyeing">Dyeing (2)</option>
                <option value="finishing">Finishing (1)</option>
                <option value="inspection">Inspection (1)</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="all">All Statuses</option>
                <option value="running">Running</option>
                <option value="idle">Sitting Idle</option>
                <option value="breakdown">Breakdown</option>
                <option value="setup">In Setup</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
              >
                <option value="code">Sort: Machine ID</option>
                <option value="output">Sort: Shift Output (Meters)</option>
                <option value="efficiency">Sort: Efficiency %</option>
                <option value="downtime">Sort: Downtime Minutes</option>
              </select>
            </div>
          </div>

          {/* Machine Grid */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredMachines.map((m) => {
                const isBreakdown = m.status === 'breakdown';
                const isIdle = m.status === 'idle';
                const percent = Math.min(100, Math.round((m.shiftOutputMeters / (m.targetOutputMeters || 1)) * 100));

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMachine(m)}
                    className={clsx(
                      'rounded-xl border p-5 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between relative overflow-hidden',
                      isBreakdown
                        ? 'border-rose-500/60 hover:border-rose-400 bg-rose-950/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                        : isIdle
                        ? 'border-amber-500/40 hover:border-amber-400 bg-amber-950/10'
                        : 'border-slate-800 bg-slate-900/90 hover:border-teal-500/60 hover:shadow-md'
                    )}
                  >
                    {/* Top breakdown banner strip */}
                    {isBreakdown && (
                      <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-0.5">
                        BREAKDOWN STOPPAGE — {m.downtimeMinutesToday} MINS DOWNTIME
                      </div>
                    )}

                    {/* Top idle banner strip */}
                    {isIdle && (
                      <div className="absolute top-0 inset-x-0 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest text-center py-0.5">
                        SITTING IDLE — {m.downtimeMinutesToday} MINS
                      </div>
                    )}

                    <div className={clsx((isBreakdown || isIdle) && 'pt-3')}>
                      {/* Top: Code, Type & Status */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-white group-hover:text-teal-400 transition-colors">
                              {m.code}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-mono">
                              {m.type}
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-slate-200 mt-1 font-display truncate max-w-[200px]" title={m.name}>
                            {m.name}
                          </h3>
                          <span className="text-[10px] text-slate-400">{m.line}</span>
                        </div>

                        <StatusBadge status={m.status} size="sm" />
                      </div>

                      {/* What Machine is Doing Right Now */}
                      <div className="mb-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                        <div className="text-[10px] uppercase font-mono text-slate-400 mb-0.5 flex items-center justify-between">
                          <span>CURRENT ACTIVITY (RIGHT NOW):</span>
                          {m.status === 'running' && <span className="text-emerald-400 font-bold">ACTIVE</span>}
                        </div>
                        <p className={clsx('text-xs font-medium', isBreakdown ? 'text-rose-300' : isIdle ? 'text-amber-300' : 'text-teal-300')}>
                          {isBreakdown
                            ? `Stopped: ${m.downtimeReason}`
                            : isIdle
                            ? `Idle: ${m.downtimeReason || 'Awaiting Order Staging'}`
                            : m.currentOrderCode
                            ? `Running Batch: ${m.currentOrderCode} (${m.speedRpm} RPM)`
                            : `Running calibration`}
                        </p>
                      </div>

                      {/* Machine Telemetry Gauges (Speed, Temp, Tension, Efficiency) */}
                      <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg bg-slate-950/90 border border-slate-800/80 mb-3 text-center">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">SPEED</span>
                          <span className="text-xs font-bold font-mono text-white">
                            {m.speedRpm > 0 ? `${m.speedRpm}` : '0'} <span className="text-[9px] font-normal text-slate-400">RPM</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">TEMP</span>
                          <span className={clsx('text-xs font-bold font-mono', m.temperatureC > 40 ? 'text-rose-400' : 'text-white')}>
                            {m.temperatureC}°C
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">TENSION</span>
                          <span className="text-xs font-bold font-mono text-white">
                            {m.tensionN} <span className="text-[9px] font-normal text-slate-400">N</span>
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">OEE</span>
                          <span className="text-xs font-bold font-mono text-teal-300">
                            {m.efficiencyPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Output Today vs Target */}
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400 text-[11px]">Today's Production</span>
                          <span className="font-mono font-semibold text-white">
                            {m.shiftOutputMeters.toLocaleString()} / {m.targetOutputMeters.toLocaleString()} {m.unit}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all duration-500',
                              isBreakdown ? 'bg-rose-500' : isIdle ? 'bg-amber-500' : percent > 85 ? 'bg-teal-500' : 'bg-emerald-500'
                            )}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Mounted Order & Operator */}
                      <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Mounted Order:</span>
                          {m.currentOrderCode ? (
                            <span className="font-mono font-semibold text-teal-400">
                              {m.currentOrderCode}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">No Order (Sitting Idle)</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Operator on Shift:</span>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-300 font-medium truncate max-w-[140px]">
                              {m.operatorName}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Live Feed
                      </span>
                      <span className="text-teal-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-medium">
                        View Controls <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Machine Table View */}
          {viewMode === 'table' && (
            <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Machine ID & Name</th>
                      <th className="px-4 py-3">Process</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Current Activity</th>
                      <th className="px-4 py-3">Mounted Order</th>
                      <th className="px-4 py-3">Operator</th>
                      <th className="px-4 py-3">Speed / Temp</th>
                      <th className="px-4 py-3">Today Output</th>
                      <th className="px-4 py-3">Efficiency</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredMachines.map((m) => (
                      <tr
                        key={m.id}
                        onClick={() => setSelectedMachine(m)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-bold text-white text-xs">{m.code}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{m.name}</div>
                        </td>
                        <td className="px-4 py-3 uppercase font-mono text-[10px] text-slate-300">
                          {m.type}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          {m.status === 'breakdown' ? (
                            <span className="text-rose-400 font-semibold">{m.downtimeReason}</span>
                          ) : m.status === 'idle' ? (
                            <span className="text-amber-400">{m.downtimeReason || 'Idle'}</span>
                          ) : (
                            <span className="text-teal-300">Running Production</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-teal-400 font-semibold">
                          {m.currentOrderCode || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">{m.operatorName}</td>
                        <td className="px-4 py-3 font-mono text-[11px]">
                          {m.speedRpm > 0 ? `${m.speedRpm} RPM` : '0 RPM'} / {m.temperatureC}°C
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-white">
                          {m.shiftOutputMeters.toLocaleString()} / {m.targetOutputMeters.toLocaleString()} m
                        </td>
                        <td className="px-4 py-3 font-mono text-teal-300 font-semibold">
                          {m.efficiencyPercent}%
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedMachine(m)}>
                            Details
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE ORDER ➔ MACHINE ALLOCATION MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'order-matrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Live Order-to-Machine Allocation Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Instant visibility into which customer order is mounted on which machine, its current stage progress, and bottleneck alerts.
                </p>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-950/80 px-2.5 py-1 rounded-md border border-teal-800/60">
                {orders.length} Active Customer Orders
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-800/80">
              {orders.map((order) => {
                // Find machines handling this order
                const allocatedMachines = machines.filter(
                  (m) => m.currentOrderId === order.id || m.currentOrderCode === order.orderNumber
                );
                const overallPercent = order.orderedQuantity > 0 ? Math.round((order.completedQuantity / order.orderedQuantity) * 100) : 0;

                return (
                  <div key={order.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-teal-400">
                            {order.orderNumber}
                          </span>
                          <span className="text-xs font-semibold text-white">
                            {order.customerCompany || order.customerName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {order.fabricType}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Yarn: {order.yarnSpecs} | Color: <span className="text-slate-200">{order.color}</span>
                        </p>
                      </div>

                      {/* Overall Order Completion */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white">
                            {order.completedQuantity.toLocaleString()} / {order.orderedQuantity.toLocaleString()} {order.unit}
                          </span>
                          <div className="text-[10px] text-slate-400">Overall Progress ({overallPercent}%)</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/orders?orderId=${order.id}`)}
                          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                        >
                          Order Details
                        </Button>
                      </div>
                    </div>

                    {/* Stage Progress Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                      {[
                        { key: 'yarn_spinning', label: '1. Spinning', val: order.stageProgress?.yarn_spinning ?? 100 },
                        { key: 'fabric_weaving', label: '2. Weaving', val: order.stageProgress?.fabric_weaving ?? 0 },
                        { key: 'dyeing_finishing', label: '3. Dyeing', val: order.stageProgress?.dyeing_finishing ?? 0 },
                        { key: 'quality_inspection', label: '4. Inspection', val: order.stageProgress?.quality_inspection ?? 0 },
                        { key: 'packing_storage', label: '5. Dispatch Prep', val: order.stageProgress?.packing_storage ?? 0 },
                      ].map((stg) => (
                        <div key={stg.key} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-slate-400">{stg.label}</span>
                            <span className="font-mono font-bold text-teal-300">{stg.val}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-teal-500"
                              style={{ width: `${stg.val}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Allocated Machine Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Currently Mounted On:</span>
                      {allocatedMachines.length > 0 ? (
                        allocatedMachines.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => setSelectedMachine(m)}
                            className={clsx(
                              'px-2.5 py-1 rounded-md border text-xs font-mono flex items-center gap-2 cursor-pointer transition-all',
                              m.status === 'breakdown'
                                ? 'bg-rose-950/50 border-rose-600 text-rose-300'
                                : 'bg-slate-950 border-slate-700 text-slate-200 hover:border-teal-500'
                            )}
                          >
                            <span className="font-bold">{m.code}</span>
                            <span className="text-[10px] text-slate-400">({m.type})</span>
                            <StatusBadge status={m.status} size="sm" />
                            <span className="text-[10px] text-slate-400 font-sans">Op: {m.operatorName}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 italic">No machine currently active (Queued in buffer)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WORKER SHIFT ROSTER & JOB REASSIGNMENT */}
      {/* ========================================================================= */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold font-display text-white">
                  Shift 1 Floor Workers & Machine Assignments
                </h3>
                <p className="text-xs text-slate-400">
                  Workers can be dynamically moved between jobs and machines when stoppages or shift changes occur.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Morning Shift (06:00 – 14:00) • {workers.filter((w) => w.attendanceStatus === 'present').length} Present
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {workers.map((worker) => (
                <div
                  key={worker.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal-900/50 border border-teal-700 text-teal-300 flex items-center justify-center font-bold text-xs font-mono">
                          {worker.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white font-display">{worker.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">{worker.employeeId}</span>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          'text-[10px] px-2 py-0.5 rounded font-mono',
                          worker.attendanceStatus === 'present'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        )}
                      >
                        {worker.attendanceStatus.toUpperCase()}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Department:</span>
                        <span className="text-slate-200 capitalize font-mono">{worker.department}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Skill Level:</span>
                        <span className="text-teal-400 font-medium">{worker.skillLevel}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Assigned Machine:</span>
                        <span className="text-white font-mono font-semibold truncate max-w-[160px]" title={worker.assignedMachine}>
                          {worker.assignedMachine}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Efficiency Score:</span>
                        <span className="text-emerald-400 font-mono font-bold">{worker.efficiencyScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-800/80">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setReassignTargetWorker(worker);
                        setNewAssignedMachineCode('');
                        setReassignModalOpen(true);
                      }}
                      leftIcon={<Shuffle className="w-3.5 h-3.5" />}
                    >
                      Move / Reassign Job
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INTERACTIVE MACHINE DETAIL DRAWER */}
      {/* ========================================================================= */}
      <Drawer
        isOpen={Boolean(selectedMachine)}
        onClose={() => setSelectedMachine(null)}
        title={selectedMachine ? `${selectedMachine.code} — ${selectedMachine.name}` : ''}
        subtitle={selectedMachine ? `Process Line: ${selectedMachine.line} | Shift: ${selectedMachine.shift}` : ''}
        width="lg"
      >
        {selectedMachine && (
          <div className="space-y-6">
            {/* Status & Telemetry Header */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                  CURRENT OPERATIONAL STATE
                </span>
                <StatusBadge status={selectedMachine.status} size="md" />
              </div>
              <div className="text-right">
                <DataSourceBadge source={selectedMachine.dataSource} />
                <p className="text-[10px] text-slate-400 mt-1">Last calibration: {selectedMachine.lastMaintenanceDate}</p>
              </div>
            </div>

            {/* Quick Status Control Buttons */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase font-mono mb-2">
                Simulate Machine Telemetry State:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={selectedMachine.status === 'running' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(selectedMachine.id, 'running')}
                  leftIcon={<Play className="w-3.5 h-3.5" />}
                >
                  Set Running
                </Button>
                <Button
                  variant={selectedMachine.status === 'idle' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(selectedMachine.id, 'idle', 'Operator meal break / Awaiting batch staging')}
                  leftIcon={<Pause className="w-3.5 h-3.5" />}
                >
                  Set Idle
                </Button>
                <Button
                  variant={selectedMachine.status === 'breakdown' ? 'danger' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setMaintenanceReason('Main Drive Motor Thermal Trip');
                    setMaintenanceModalOpen(true);
                  }}
                  leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                >
                  Set Breakdown
                </Button>
              </div>
            </div>

            {/* Live Sensors Grid */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Live Sensor Telemetry
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <Gauge className="w-4 h-4 text-teal-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-mono">SPEED</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {selectedMachine.speedRpm} RPM
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <Thermometer className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-mono">CORE TEMP</span>
                  <span className={clsx('text-sm font-bold font-mono', selectedMachine.temperatureC > 40 ? 'text-rose-400' : 'text-white')}>
                    {selectedMachine.temperatureC}°C
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <Zap className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-mono">TENSION</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {selectedMachine.tensionN} N
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <Activity className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block font-mono">OEE EFF.</span>
                  <span className="text-sm font-bold font-mono text-teal-300">
                    {selectedMachine.efficiencyPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Current Order Reference */}
            {selectedMachine.currentOrderCode && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Active Manufacturing Batch
                    </span>
                    <h4 className="text-sm font-bold text-white font-display mt-0.5">
                      {selectedMachine.currentOrderCode}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">Operator: {selectedMachine.operatorName}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/orders?orderId=${selectedMachine.currentOrderId}`)}
                    rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    View Order Specs
                  </Button>
                </div>
              </div>
            )}

            {/* Shift Activity & Telemetry Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Shift Activity & Telemetry Log
              </h4>
              <div className="space-y-2">
                {selectedMachine.recentLogs?.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-400 text-[10px]">{log.timestamp}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{log.operator || 'System'}</span>
                    </div>
                    <p className={clsx('text-[11px] leading-relaxed', log.type === 'error' ? 'text-rose-300' : 'text-slate-200')}>
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Breakdown Reason Modal */}
      <Modal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        title="Simulate Breakdown Stoppage"
        subtitle="This event triggers the Everest Rescue Engine diagnostic pipeline."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Downtime Failure Reason:
            </label>
            <input
              type="text"
              value={maintenanceReason}
              onChange={(e) => setMaintenanceReason(e.target.value)}
              placeholder="e.g. Servo Motor Inverter Overheating"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <Button variant="secondary" size="sm" onClick={() => setMaintenanceModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (selectedMachine) {
                  handleStatusChange(selectedMachine.id, 'breakdown', maintenanceReason);
                }
                setMaintenanceModalOpen(false);
              }}
            >
              Confirm Breakdown Event
            </Button>
          </div>
        </div>
      </Modal>

      {/* Move / Reassign Worker Modal */}
      <Modal
        isOpen={reassignModalOpen}
        onClose={() => setReassignModalOpen(false)}
        title={reassignTargetWorker ? `Reassign Worker: ${reassignTargetWorker.name}` : 'Reassign Worker'}
        subtitle="Move operator to another machine or production line during mid-shift rotation."
        maxWidth="md"
      >
        {reassignTargetWorker && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Worker:</span>
                <span className="text-white font-bold">{reassignTargetWorker.name} ({reassignTargetWorker.employeeId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Assignment:</span>
                <span className="text-teal-400 font-mono">{reassignTargetWorker.assignedMachine}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Select Target Machine to Transfer Operator To:
              </label>
              <select
                value={newAssignedMachineCode}
                onChange={(e) => setNewAssignedMachineCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Machine --</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.code}>
                    {m.code} — {m.name} ({m.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setReassignModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newAssignedMachineCode}
                onClick={() => handleWorkerReassign(reassignTargetWorker, newAssignedMachineCode)}
              >
                Confirm Reassignment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
