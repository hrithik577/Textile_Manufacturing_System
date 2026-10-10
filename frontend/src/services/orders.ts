import { request } from './api-client';
import { CustomerOrder, OrderStatus } from '../types';
import { mockOrders } from './mock-data';

export const ordersService = {
  async getOrders(): Promise<{ data: CustomerOrder[]; isSimulated: boolean }> {
    return request<CustomerOrder[]>('/orders', { method: 'GET' }, mockOrders);
  },

  async getOrderById(id: string): Promise<{ data: CustomerOrder | null; isSimulated: boolean }> {
    const fallback = mockOrders.find((o) => o.id === id || o.orderNumber === id) || null;
    return request<CustomerOrder | null>(`/orders/${id}`, { method: 'GET' }, fallback);
  },

  async createOrder(order: Partial<CustomerOrder>): Promise<{ data: CustomerOrder; isSimulated: boolean }> {
    const newOrder: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(100 + Math.random() * 900)}`,
      customerName: order.customerName || 'New Client',
      customerEmail: order.customerEmail || 'client@example.com',
      customerCompany: order.customerCompany || 'Textile Client Ltd',
      customerPo: order.customerPo || `PO-${Math.floor(1000 + Math.random() * 9000)}`,
      fabricType: order.fabricType || 'Cotton Poplin 40s',
      yarnSpecs: order.yarnSpecs || '40s Combed Cotton Ring Spun',
      gsm: order.gsm || 135,
      color: order.color || 'Optical White',
      pantoneCode: order.pantoneCode || 'PANTONE 11-0601 TCX',
      orderedQuantity: order.orderedQuantity || 5000,
      completedQuantity: 0,
      allocatedRollsCount: 0,
      unit: order.unit || 'meters',
      status: 'in_production',
      currentStage: 'yarn_spinning',
      stageProgress: {
        yarn_spinning: 10,
        fabric_weaving: 0,
        dyeing_finishing: 0,
        quality_inspection: 0,
        packing_storage: 0,
        dispatched: 0,
      },
      orderDate: new Date().toISOString().split('T')[0],
      deadlineDate: order.deadlineDate || '2026-11-15',
      estimatedCompletionDate: order.deadlineDate || '2026-11-12',
      priority: order.priority || 'standard',
      totalValueUsd: (order.orderedQuantity || 5000) * 3.8,
      costBreakdown: {
        rawMaterialCostUsd: (order.orderedQuantity || 5000) * 1.5,
        weavingCostUsd: (order.orderedQuantity || 5000) * 0.7,
        dyeingCostUsd: (order.orderedQuantity || 5000) * 0.5,
        finishingCostUsd: (order.orderedQuantity || 5000) * 0.3,
        laborOverheadsUsd: (order.orderedQuantity || 5000) * 0.2,
        totalCostUsd: (order.orderedQuantity || 5000) * 3.2,
        projectedMarginPercent: 15.8,
      },
      materialReadiness: {
        yarnStockPercent: 100,
        dyesChemicalsPercent: 100,
        isReady: true,
      },
      notes: order.notes || '',
    };

    return request<CustomerOrder>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }, newOrder);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/orders/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
