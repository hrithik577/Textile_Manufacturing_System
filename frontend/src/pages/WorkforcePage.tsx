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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 editorial-border-b">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black font-mono text-[var(--color-ink)] uppercase tracking-tight">
              Workforce, Shifts & Machine Rosters
            </h1>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--color-vermilion)] text-white uppercase">
              Floor Shift Roster
            </span>
          </div>
          <p className="text-xs font-mono text-[var(--color-industrial-grey)] uppercase">
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
        <div className="p-4 editorial-border bg-white space-y-2 border-l-4 border-l-[var(--color-vermilion)]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--color-ink)] text-xs font-mono uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[var(--color-vermilion)] animate-pulse" />
              Morning Shift (06:00 - 14:00)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--color-vermilion)] text-white font-bold uppercase">
              ACTIVE NOW
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-[var(--color-light-border)] font-mono">
            <span className="text-[var(--color-industrial-grey)]">Present: 28 / 30 Operators</span>
            <span className="text-[var(--color-ink)] font-bold">95.2% Floor Efficiency</span>
          </div>
        </div>

        <div className="p-4 editorial-border bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--color-ink)] text-xs font-mono uppercase">
              Evening Shift (14:00 - 22:00)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--color-paper)] text-[var(--color-industrial-grey)] font-bold uppercase border border-[var(--color-light-border)]">
              UPCOMING
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-[var(--color-light-border)] font-mono">
            <span className="text-[var(--color-industrial-grey)]">Scheduled: 30 Operators</span>
            <span className="text-[var(--color-ink)] font-bold">Briefing in 3.5 hrs</span>
          </div>
        </div>

        <div className="p-4 editorial-border bg-white space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--color-ink)] text-xs font-mono uppercase">
              Night Shift (22:00 - 06:00)
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[var(--color-paper)] text-[var(--color-industrial-grey)] font-bold uppercase border border-[var(--color-light-border)]">
              SCHEDULED
            </span>
          </div>
          <div className="flex justify-between text-xs pt-2 border-t border-[var(--color-light-border)] font-mono">
            <span className="text-[var(--color-industrial-grey)]">Scheduled: 24 Operators</span>
            <span className="text-[var(--color-ink)] font-bold">Continuous Weaving</span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-3 bg-white editorial-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-[var(--color-industrial-grey)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee name, ID, or assigned machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] editorial-border pl-9 pr-3 py-2 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-industrial-grey)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as any)}
            className="bg-[var(--color-paper)] editorial-border px-3 py-2 text-xs font-mono text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
          >
            <option value="all">ALL SHIFTS</option>
            <option value="Morning">MORNING SHIFT</option>
            <option value="Evening">EVENING SHIFT</option>
            <option value="Night">NIGHT SHIFT</option>
          </select>
        </div>
      </div>

      {/* Workforce Roster Table */}
      <div className="editorial-border bg-white overflow-hidden shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-[var(--color-ink)]">
            <thead className="bg-[var(--color-ink)] text-white uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee Name & ID</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Skill Level</th>
                <th className="px-4 py-3">Assigned Machine</th>
                <th className="px-4 py-3">Active Shift</th>
                <th className="px-4 py-3">Attendance</th>
                <th className="px-4 py-3 text-right">Efficiency Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-light-border)]">
              {filteredWorkers.map((worker) => (
                <tr key={worker.id} className="hover:bg-[var(--color-paper)] transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-bold text-[var(--color-ink)] block">{worker.name}</span>
                    <span className="text-[10px] text-[var(--color-industrial-grey)]">{worker.employeeId}</span>
                  </td>
                  <td className="px-4 py-3 uppercase">{worker.department}</td>
                  <td className="px-4 py-3">
                    <span className="px-1.5 py-0.5 text-[9px] bg-[var(--color-paper)] editorial-border font-bold">
                      {worker.skillLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{worker.assignedMachine}</td>
                  <td className="px-4 py-3">{worker.shift}</td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        'px-1.5 py-0.5 text-[9px] font-bold uppercase',
                        (worker.status === 'On Duty' || worker.attendanceStatus === 'present')
                          ? 'bg-[var(--color-success-green)] text-white'
                          : (worker.status === 'On Break' || worker.attendanceStatus === 'on_break')
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {worker.status || worker.attendanceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-[var(--color-vermilion)]">
                    {worker.efficiencyRate ?? worker.efficiencyScore}%
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

export default WorkforcePage;
