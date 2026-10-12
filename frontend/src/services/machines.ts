import { request } from './api-client';
import { Machine, MachineStatus } from '../types';
import { mockMachines } from './mock-data';

export const machinesService = {
  async getMachines(): Promise<{ data: Machine[]; isSimulated: boolean }> {
    const res = await request<any>('/machines', { method: 'GET' }, mockMachines);
    
    let rawList: any[] = [];
    if (Array.isArray(res.data)) {
      rawList = res.data;
    } else if (res.data && Array.isArray(res.data.items)) {
      rawList = res.data.items;
    } else {
      rawList = mockMachines;
    }

    const machines: Machine[] = rawList.map((m: any, idx: number) => {
      const fallback = mockMachines[idx] || mockMachines[0];
      const code = m.machine_code || m.code || fallback.code;
      
      return {
        id: String(m.id || fallback.id),
        code,
        name: m.name || fallback.name,
        type: (m.process || m.process_type || fallback.type) as any,
        status: (m.status || fallback.status).toLowerCase() as any,
        currentOrderId: m.current_order_id || fallback.currentOrderId,
        currentOrderCode: m.current_order_id || fallback.currentOrderCode,
        operatorName: m.operator_name || fallback.operatorName,
        shift: m.shift || fallback.shift,
        shiftOutputMeters: m.shift_output_m ?? m.shiftOutputMeters ?? fallback.shiftOutputMeters,
        targetOutputMeters: m.targetOutputMeters || fallback.targetOutputMeters,
        unit: fallback.unit || 'meters',
        speedRpm: m.current_speed_rpm ?? m.speedRpm ?? fallback.speedRpm,
        temperatureC: m.temperatureC || fallback.temperatureC,
        tensionN: m.tensionN || fallback.tensionN,
        efficiencyPercent: m.efficiencyPercent || fallback.efficiencyPercent,
        downtimeMinutesToday: m.downtimeMinutesToday ?? fallback.downtimeMinutesToday,
        downtimeReason: m.downtime_reason || m.downtimeReason || fallback.downtimeReason,
        lastMaintenanceDate: m.last_updated || fallback.lastMaintenanceDate,
        dataSource: m.data_source || fallback.dataSource || 'SIMULATED',
        line: m.line || fallback.line || 'Line 1',
        recentLogs: fallback.recentLogs || [],
      };
    });

    return { data: machines, isSimulated: res.isSimulated };
  },

  async getMachineById(id: string): Promise<{ data: Machine | null; isSimulated: boolean }> {
    const fallback = mockMachines.find((m) => m.id === id || m.code === id) || null;
    return request<Machine | null>(`/machines/${id}`, { method: 'GET' }, fallback);
  },

  async updateMachineStatus(
    id: string,
    status: MachineStatus,
    reason?: string
  ): Promise<{ success: boolean; isSimulated: boolean }> {
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

  async mountOrder(
    machineId: string,
    productionOrderId: number
  ): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/machines/${machineId}/mount-order`,
      {
        method: 'POST',
        body: JSON.stringify({ production_order_id: productionOrderId }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
