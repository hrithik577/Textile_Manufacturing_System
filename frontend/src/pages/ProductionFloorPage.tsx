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
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { Machine, MachineProcessType, MachineStatus } from '../types';
import { machinesService } from '../services/machines';
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
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProcess, setSelectedProcess] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'output' | 'efficiency' | 'code'>('code');

  // Selected Machine for Detail Drawer
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');

  useEffect(() => {
    loadMachines();
  }, []);

  const loadMachines = async () => {
    setLoading(true);
    try {
      const res = await machinesService.getMachines();
      setMachines(res.data);

      // Check if URL has ?select=m-id
      const selectId = searchParams.get('select');
      if (selectId) {
        const found = res.data.find((m) => m.id === selectId);
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
        return a.code.localeCompare(b.code);
      });
  }, [machines, searchQuery, selectedProcess, selectedStatus, sortBy]);

  // Counts for status pills
  const statusCounts = useMemo(() => {
    return {
      total: machines.length,
      running: machines.filter((m) => m.status === 'running').length,
      idle: machines.filter((m) => m.status === 'idle').length,
      breakdown: machines.filter((m) => m.status === 'breakdown').length,
      setup: machines.filter((m) => m.status === 'setup').length,
      maintenance: machines.filter((m) => m.status === 'maintenance').length,
    };
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

  if (loading) {
    return <LoadingState message="Connecting to virtual machine telemetry hub..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
              Production Floor Telemetry
            </h1>
            <DataSourceBadge source="SIMULATED" />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time machine monitoring, output metrics, speed, temperature, and breakdown alerts across all sheds.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-3">
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

          <Button
            variant="outline"
            size="sm"
            onClick={loadMachines}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Status Legend & Quick Filter Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'All Fleet', count: statusCounts.total, key: 'all', color: 'slate' },
          { label: 'Running', count: statusCounts.running, key: 'running', color: 'emerald' },
          { label: 'Idle / Waiting', count: statusCounts.idle, key: 'idle', color: 'amber' },
          { label: 'Breakdown', count: statusCounts.breakdown, key: 'breakdown', color: 'rose' },
          { label: 'In Setup', count: statusCounts.setup, key: 'setup', color: 'blue' },
          { label: 'Maintenance', count: statusCounts.maintenance, key: 'maintenance', color: 'purple' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setSelectedStatus(item.key)}
            className={clsx(
              'p-3 rounded-xl border text-left transition-all duration-150',
              selectedStatus === item.key
                ? 'bg-slate-800 border-teal-500 shadow-md ring-1 ring-teal-500/50'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            )}
          >
            <span className="text-[11px] text-slate-400 font-medium block truncate">{item.label}</span>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xl font-bold font-display text-white">{item.count}</span>
              <span
                className={clsx(
                  'w-2 h-2 rounded-full',
                  item.key === 'running' && 'bg-emerald-400',
                  item.key === 'idle' && 'bg-amber-400',
                  item.key === 'breakdown' && 'bg-rose-400 animate-pulse',
                  item.key === 'setup' && 'bg-blue-400',
                  item.key === 'maintenance' && 'bg-purple-400',
                  item.key === 'all' && 'bg-slate-400'
                )}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search machine ID (e.g. WEAVE-03), name, operator, or order..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Process Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedProcess}
            onChange={(e) => setSelectedProcess(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Processes</option>
            <option value="spinning">Spinning</option>
            <option value="weaving">Weaving</option>
            <option value="dyeing">Dyeing</option>
            <option value="finishing">Finishing</option>
            <option value="inspection">Inspection</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="code">Sort: Machine ID</option>
            <option value="output">Sort: Shift Output</option>
            <option value="efficiency">Sort: Efficiency %</option>
          </select>
        </div>
      </div>

      {/* Breakdown Notice Callout if any */}
      {statusCounts.breakdown > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-display">
                Attention: 1 Machine in Breakdown
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                <strong>WEAVE-03 (Picanol OptiMax-i)</strong> is down due to Inverter Overheat. Impacting Order ORD-2026-097 (Patagonia).
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => navigate('/rescue-engine?issueId=resc-001')}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Triage in Rescue Engine
          </Button>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.map((m) => {
            const isBreakdown = m.status === 'breakdown';
            const percent = Math.min(100, Math.round((m.shiftOutputMeters / m.targetOutputMeters) * 100));

            return (
              <div
                key={m.id}
                onClick={() => setSelectedMachine(m)}
                className={clsx(
                  'rounded-xl bg-slate-900/90 border p-5 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between relative overflow-hidden',
                  isBreakdown
                    ? 'border-rose-500/60 hover:border-rose-400 bg-rose-950/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                    : 'border-slate-800 hover:border-teal-500/60 hover:shadow-md'
                )}
              >
                {/* Breakdown banner strip */}
                {isBreakdown && (
                  <div className="absolute top-0 inset-x-0 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest text-center py-0.5">
                    BREAKDOWN STOPPAGE — {m.downtimeMinutesToday} MINS DOWNTIME
                  </div>
                )}

                <div className={clsx(isBreakdown && 'pt-3')}>
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

                  {/* Machine Telemetry Gauges (Speed, Temp, Tension) */}
                  <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-4 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">SPEED</span>
                      <span className="text-xs font-bold font-mono text-white">
                        {m.speedRpm > 0 ? `${m.speedRpm} RPM` : '0 RPM'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">TEMP</span>
                      <span className={clsx('text-xs font-bold font-mono', m.temperatureC > 40 ? 'text-rose-400' : 'text-white')}>
                        {m.temperatureC}°C
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-mono">OEE EFF.</span>
                      <span className="text-xs font-bold font-mono text-teal-300">
                        {m.efficiencyPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Output Progress */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Shift Output</span>
                      <span className="font-mono font-semibold text-white">
                        {m.shiftOutputMeters.toLocaleString()} / {m.targetOutputMeters.toLocaleString()} {m.unit}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-500',
                          isBreakdown ? 'bg-rose-500' : percent > 85 ? 'bg-teal-500' : 'bg-amber-500'
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Breakdown Reason or Current Order */}
                  {isBreakdown ? (
                    <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-xs text-rose-200 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px] text-rose-300">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Downtime Reason:</span>
                      </div>
                      <p className="text-[11px] leading-relaxed">{m.downtimeReason}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Current Order:</span>
                        {m.currentOrderCode ? (
                          <span className="font-mono font-semibold text-teal-400">
                            {m.currentOrderCode}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Idle / No Order</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Operator:</span>
                        <span className="text-slate-300 font-medium truncate max-w-[140px]">
                          {m.operatorName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Updated 2m ago
                  </span>
                  <span className="text-teal-400 group-hover:translate-x-1 transition-transform flex items-center gap-0.5 font-medium">
                    Telemetry <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Machine ID & Name</th>
                  <th className="px-4 py-3">Process</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Current Order</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Speed / Temp</th>
                  <th className="px-4 py-3">Shift Output</th>
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
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">{m.name}</div>
                    </td>
                    <td className="px-4 py-3 uppercase font-mono text-[10px] text-slate-300">
                      {m.type}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} size="sm" />
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

      {/* Interactive Machine Detail Drawer */}
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
                  onClick={() => handleStatusChange(selectedMachine.id, 'idle', 'Operator meal break')}
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

            {/* Machine Event & Downtime Log */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono mb-3">
                Shift Activity & Telemetry Log
              </h4>
              <div className="space-y-2">
                {selectedMachine.recentLogs.map((log) => (
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

      {/* Set Breakdown / Maintenance Reason Modal */}
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
    </div>
  );
};
