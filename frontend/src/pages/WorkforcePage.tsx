import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  Award,
  Cpu,
  ShieldCheck,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { ShiftWorker } from '../types';
import { mockShiftWorkers } from '../services/mock-data';
import { Button } from '../components/common/Button';
import { clsx } from 'clsx';

export const WorkforcePage: React.FC = () => {
  const [workers, setWorkers] = useState<ShiftWorker[]>(mockShiftWorkers);
  const [selectedShift, setSelectedShift] = useState<'all' | 'Morning' | 'Evening' | 'Night'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.assignedMachine.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShift = selectedShift === 'all' || w.shift === selectedShift;
    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
            Workforce, Shifts & Machine Rosters
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Shift scheduling, machine operator skill matrices, attendance tracking, and individual operator efficiency ratings.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => alert('Shift Assignment Modal')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Assign Shift Operator
        </Button>
      </div>

      {/* Shift Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-teal-500/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs font-display flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Morning Shift (06:00 - 14:00)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              ACTIVE NOW
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Present: 28 / 30 Operators</span>
            <span className="text-teal-400 font-bold">95.2% Floor Efficiency</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 text-xs font-display">
              Evening Shift (14:00 - 22:00)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              UPCOMING
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Scheduled: 30 Operators</span>
            <span className="text-slate-300">Briefing in 3.5 hrs</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 text-xs font-display">
              Night Shift (22:00 - 06:00)
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              SCHEDULED
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-slate-800 font-mono">
            <span className="text-slate-400">Scheduled: 24 Operators</span>
            <span className="text-slate-300">Continuous Weaving</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID, or assigned machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Shifts</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
          </select>
        </div>
      </div>

      {/* Workforce Roster Table */}
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Employee Name & ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Skill Level</th>
                <th className="px-4 py-3">Assigned Machine Node</th>
                <th className="px-4 py-3">Current Shift</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3 text-right">Efficiency Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-bold text-white text-xs">{worker.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{worker.employeeId}</div>
                  </td>
                  <td className="px-4 py-3 uppercase font-mono text-[10px] text-slate-300">
                    {worker.department}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-teal-300 font-medium">
                      {worker.skillLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 font-medium">
                    {worker.assignedMachine}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{worker.shift}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Present on Floor
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400 text-xs">
                    {worker.efficiencyScore}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
