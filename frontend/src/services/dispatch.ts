import { request } from './api-client';
import { FinishedGoodsRoll, DispatchRecord } from '../types';
import { mockFinishedRolls, mockDispatches } from './mock-data';

export const dispatchService = {
  async getFinishedGoods(): Promise<{ data: FinishedGoodsRoll[]; isSimulated: boolean }> {
    return request<FinishedGoodsRoll[]>('/dispatch/finished-goods', { method: 'GET' }, mockFinishedRolls);
  },

  async getDispatches(): Promise<{ data: DispatchRecord[]; isSimulated: boolean }> {
    return request<DispatchRecord[]>('/dispatch/records', { method: 'GET' }, mockDispatches);
  },

  async createDispatch(dispatch: Partial<DispatchRecord>): Promise<{ data: DispatchRecord; isSimulated: boolean }> {
    const newRecord: DispatchRecord = {
      id: `disp-${Date.now()}`,
      dispatchNumber: `DSP-2026-0${Math.floor(50 + Math.random() * 50)}`,
      orderId: dispatch.orderId || 'ord-100',
      orderNumber: dispatch.orderNumber || 'ORD-2026-084',
      customerName: dispatch.customerName || 'Nordic Apparel Group',
      destinationCity: dispatch.destinationCity || 'Stockholm Central Hub',
      destinationAddress: dispatch.destinationAddress || 'Logistics Port Terminal 4',
      carrierName: dispatch.carrierName || 'Maersk Logistics',
      trackingNumber: `TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      vehicleNumber: dispatch.vehicleNumber || 'KA-04-EV-1122',
      driverName: dispatch.driverName || 'Driver Assigned',
      driverPhone: dispatch.driverPhone || '+91 99000 11223',
      rollIds: dispatch.rollIds || [],
      totalMeters: dispatch.totalMeters || 1000,
      totalRolls: (dispatch.rollIds || []).length || 2,
      grossWeightKg: dispatch.grossWeightKg || 112,
      dispatchedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      dispatchedBy: dispatch.dispatchedBy || 'Fatima Al-Sayed',
      status: 'in_transit',
      challanNumber: `DC-2026-0${Math.floor(100 + Math.random() * 900)}`,
      invoiceNumber: `INV-2026-0${Math.floor(1000 + Math.random() * 9000)}`,
      notes: dispatch.notes,
    };

    return request<DispatchRecord>(
      '/dispatch/create',
      {
        method: 'POST',
        body: JSON.stringify(dispatch),
      },
      newRecord
    );
  },
};
