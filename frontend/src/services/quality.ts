import { request } from './api-client';
import { QualityInspection, QualityDecision } from '../types';
import { mockInspections } from './mock-data';

export const qualityService = {
  async getInspections(): Promise<{ data: QualityInspection[]; isSimulated: boolean }> {
    return request<QualityInspection[]>('/quality/inspections', { method: 'GET' }, mockInspections);
  },

  async recordInspection(inspection: Partial<QualityInspection>): Promise<{ data: QualityInspection; isSimulated: boolean }> {
    const newRecord: QualityInspection = {
      id: `qc-${Date.now()}`,
      rollNumber: inspection.rollNumber || `ROLL-${Math.floor(8000 + Math.random() * 2000)}`,
      orderId: inspection.orderId || 'ord-100',
      orderNumber: inspection.orderNumber || 'ORD-2026-084',
      customerName: inspection.customerName || 'General Production',
      fabricType: inspection.fabricType || 'Cotton Fabric',
      machineId: inspection.machineId || 'm-fin-01',
      machineName: inspection.machineName || 'Monforts Montex 8500 Stenter',
      yarnLotNumber: inspection.yarnLotNumber || 'LOT-2026-Y881',
      dyeingBatchNumber: inspection.dyeingBatchNumber || 'DB-838',
      inspectorName: inspection.inspectorName || 'David Chen',
      inspectionDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      sampleLengthMeters: inspection.sampleLengthMeters || 500,
      defectCategory: inspection.defectCategory || 'none',
      defectSeverity: inspection.defectSeverity || 'none',
      defectCount: inspection.defectCount || 0,
      measuredGsm: inspection.measuredGsm || 180,
      targetGsm: inspection.targetGsm || 180,
      measuredWidthInches: inspection.measuredWidthInches || 60,
      targetWidthInches: inspection.targetWidthInches || 60,
      grade: inspection.decision === 'pass' ? 'Grade A (Export)' : inspection.decision === 'reject' ? 'Reject' : 'Grade B',
      decision: inspection.decision || 'pass',
      reworkProcess: inspection.reworkProcess,
      comments: inspection.comments || 'Inspection completed successfully.',
      traceability: {
        spinLot: 'SPIN-LOT-991',
        weaveLoom: 'CIRC-KNIT-04',
        dyeVessel: 'DYE-01',
        finishStenter: 'FIN-01',
      },
    };

    return request<QualityInspection>(
      '/quality/inspections',
      {
        method: 'POST',
        body: JSON.stringify(inspection),
      },
      newRecord
    );
  },

  async updateInspectionDecision(
    id: string,
    decision: QualityDecision,
    comments?: string
  ): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/quality/inspections/${id}/decision`,
      {
        method: 'PATCH',
        body: JSON.stringify({ decision, comments }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
