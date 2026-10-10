import { request } from './api-client';
import { InventoryItem, StockMovement } from '../types';
import { mockInventory, mockStockMovements } from './mock-data';

export const inventoryService = {
  async getInventory(): Promise<{ data: InventoryItem[]; isSimulated: boolean }> {
    return request<InventoryItem[]>('/inventory', { method: 'GET' }, mockInventory);
  },

  async getStockMovements(): Promise<{ data: StockMovement[]; isSimulated: boolean }> {
    return request<StockMovement[]>('/inventory/movements', { method: 'GET' }, mockStockMovements);
  },

  async recordStockAdjustment(
    itemId: string,
    adjustmentQty: number,
    reason: string
  ): Promise<{ success: boolean; isSimulated: boolean }> {
    const res = await request<{ success: boolean }>(
      `/inventory/${itemId}/adjust`,
      {
        method: 'POST',
        body: JSON.stringify({ adjustmentQty, reason }),
      },
      { success: true }
    );
    return { success: res.data.success, isSimulated: res.isSimulated };
  },
};
