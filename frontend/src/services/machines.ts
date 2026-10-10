import { request } from './api-client';
import { Machine, MachineStatus } from '../types';
import { mockMachines } from './mock-data';

export const machinesService = {
  async getMachines(): Promise<{ data: Machine[]; isSimulated: boolean }> {
    return request<Machine[]>('/machines', { method: 'GET' }, mockMachines);
  },

  async getMachineById(id: string): Promise<{ data: Machine | null; isSimulated: boolean }> {
    const fallback = mockMachines.find((m) => m.id === id) || null;
    return request<Machine | null>(`/machines/${id}`, { method: 'GET' }, fallback);
  },

  async updateMachineStatus(id: string, status: MachineStatus, reason?: string): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/machines/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, reason }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
