import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { clsx } from 'clsx';
import { getWorkers, createWorker, getShifts, Worker, Shift } from '../services/workforce';
import { useApp } from '../context/AppContext';

export const WorkforcePage: React.FC = () => {
  const { addToast } = useApp();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
    name: '',
    role: 'operator',
    department: 'weaving',
    shift_id: 1,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [workersRes, shiftsRes] = await Promise.all([
        getWorkers(),
        getShifts(),
      ]);
      setWorkers(workersRes);
      setShifts(shiftsRes);
      if (shiftsRes.length > 0 && !formData.shift_id) {
        setFormData((prev) => ({ ...prev, shift_id: shiftsRes[0].id }));
      }
    } catch (err: any) {
      addToast({
        title: 'Error loading workforce data',
        message: err.message || 'Failed to fetch workers from backend.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast({
        title: 'Missing Worker Name',
        message: 'Please provide full name for the worker.',
        type: 'warning',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newWorker = await createWorker({
        employee_code: formData.employee_code,
        name: formData.name,
        role: formData.role,
        department: formData.department,
        shift_id: Number(formData.shift_id),
        is_active: true,
      });

      setWorkers((prev) => [newWorker, ...prev]);
      setIsModalOpen(false);
      setFormData({
        employee_code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        role: 'operator',
        department: 'weaving',
        shift_id: shifts[0]?.id || 1,
      });

      addToast({
        title: 'Operator Registered',
        message: `Assigned ${newWorker.name} (${newWorker.employee_code}) to active roster.`,
        type: 'success',
      });
    } catch (err: any) {
      addToast({
        title: 'Assignment Failed',
        message: err.message || 'Could not register operator.',
        type: 'danger',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesShift =
      selectedShift === 'all' ||
      (w.shift && w.shift.shift_name.toLowerCase().includes(selectedShift.toLowerCase())) ||
      (selectedShift === '1' && w.shift_id === 1) ||
      (selectedShift === '2' && w.shift_id === 2) ||
      (selectedShift === '3' && w.shift_id === 3);

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
            Shift scheduling, machine operator skill matrices, attendance tracking, and individual operator rosters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={loadData}
            disabled={isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Assign Shift Operator
          </Button>
        </div>
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
            <span className="text-[var(--color-industrial-grey)]">
              Assigned: {workers.filter((w) => w.shift_id === 1 || !w.shift_id).length} Operators
            </span>
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
            <span className="text-[var(--color-industrial-grey)]">
              Assigned: {workers.filter((w) => w.shift_id === 2).length} Operators
            </span>
            <span className="text-[var(--color-ink)] font-bold">Starts 14:00</span>
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
            <span className="text-[var(--color-industrial-grey)]">
              Assigned: {workers.filter((w) => w.shift_id === 3).length} Operators
            </span>
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
            placeholder="Search employee name, code, role, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-paper)] editorial-border pl-9 pr-3 py-2 text-xs font-mono text-[var(--color-ink)] placeholder:text-[var(--color-industrial-grey)] focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
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
                <th className="px-4 py-3">Employee Name & Code</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned Shift</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Roster Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-light-border)]">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--color-industrial-grey)]">
                    {isLoading ? 'Loading workforce roster from PostgreSQL...' : 'No workers match the current filter.'}
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-[var(--color-paper)] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[var(--color-ink)] block">{worker.name}</span>
                      <span className="text-[10px] text-[var(--color-industrial-grey)]">{worker.employee_code}</span>
                    </td>
                    <td className="px-4 py-3 uppercase">{worker.department}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 text-[9px] bg-[var(--color-paper)] editorial-border font-bold uppercase">
                        {worker.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {worker.shift?.shift_name || (worker.shift_id === 1 ? 'Morning Shift' : worker.shift_id === 2 ? 'Evening Shift' : 'General Shift')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={clsx(
                          'px-1.5 py-0.5 text-[9px] font-bold uppercase',
                          worker.is_active
                            ? 'bg-[var(--color-success-green)] text-white'
                            : 'bg-gray-200 text-gray-700'
                        )}
                      >
                        {worker.is_active ? 'Active Roster' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-xs text-[var(--color-vermilion)]">
                      <button
                        onClick={() => addToast({ title: 'Shift Confirmed', message: `${worker.name} shift logged.`, type: 'info' })}
                        className="hover:underline cursor-pointer"
                      >
                        Log Attendance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Shift Operator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white editorial-border max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--color-ink)] pb-3">
              <h2 className="text-lg font-black font-mono uppercase text-[var(--color-ink)]">
                Assign Shift Operator
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--color-industrial-grey)] hover:text-[var(--color-ink)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorker} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block uppercase text-[10px] font-bold mb-1 text-[var(--color-ink)]">
                  Employee Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
                />
              </div>

              <div>
                <label className="block uppercase text-[10px] font-bold mb-1 text-[var(--color-ink)]">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Rao"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block uppercase text-[10px] font-bold mb-1 text-[var(--color-ink)]">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
                  >
                    <option value="weaving">Weaving</option>
                    <option value="spinning">Spinning</option>
                    <option value="dyeing">Dyeing</option>
                    <option value="inspection">Inspection</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase text-[10px] font-bold mb-1 text-[var(--color-ink)]">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
                  >
                    <option value="operator">Operator</option>
                    <option value="technician">Technician</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block uppercase text-[10px] font-bold mb-1 text-[var(--color-ink)]">
                  Shift Assignment
                </label>
                <select
                  value={formData.shift_id}
                  onChange={(e) => setFormData({ ...formData, shift_id: Number(e.target.value) })}
                  className="w-full bg-[var(--color-paper)] editorial-border px-3 py-2 focus:outline-none focus:border-[var(--color-vermilion)] rounded-none"
                >
                  {shifts.length > 0 ? (
                    shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shift_name} ({s.start_time} - {s.end_time})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Morning Shift (06:00 - 14:00)</option>
                      <option value={2}>Evening Shift (14:00 - 22:00)</option>
                      <option value={3}>Night Shift (22:00 - 06:00)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--color-light-border)]">
                <Button
                  variant="outline"
                  size="md"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Operator'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkforcePage;
