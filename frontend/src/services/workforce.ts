import { request } from './api-client';

export interface Shift {
  id: number;
  shift_name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface Worker {
  id: number;
  employee_code: string;
  name: string;
  role: string;
  department: string;
  shift_id?: number | null;
  shift?: Shift | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerCreateInput {
  employee_code: string;
  name: string;
  role: string;
  department: string;
  shift_id?: number | null;
  is_active?: boolean;
}

export interface AttendanceRecord {
  id: number;
  worker_id: number;
  shift_id?: number | null;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: string;
  worker?: Worker | null;
  shift?: Shift | null;
  created_at: string;
}

export interface AttendanceCreateInput {
  worker_id: number;
  shift_id?: number | null;
  date: string;
  status?: string;
  check_in?: string;
  check_out?: string;
}

export async function getWorkers(department?: string): Promise<Worker[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const response = await request<Worker[]>(`/workforce/workers${query}`, { method: 'GET' });
  return response.data;
}

export async function createWorker(payload: WorkerCreateInput): Promise<Worker> {
  const response = await request<Worker>('/workforce/workers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}

export async function getShifts(): Promise<Shift[]> {
  const response = await request<Shift[]>('/workforce/shifts', { method: 'GET' });
  return response.data;
}

export async function getAttendance(targetDate?: string): Promise<AttendanceRecord[]> {
  const query = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : '';
  const response = await request<AttendanceRecord[]>(`/workforce/attendance${query}`, { method: 'GET' });
  return response.data;
}

export async function recordAttendance(payload: AttendanceCreateInput): Promise<AttendanceRecord> {
  const response = await request<AttendanceRecord>('/workforce/attendance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return response.data;
}
