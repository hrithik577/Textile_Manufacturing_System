import { request } from './api-client';
import { InventoryItem, StockMovement, InwardGateEntry, YarnFeasibilityResult, CustomerOrder } from '../types';
import { mockInventory, mockStockMovements, mockGateEntries } from './mock-data';

export const inventoryService = {
  async getInventory(): Promise<{ data: InventoryItem[]; isSimulated: boolean }> {
    return request<InventoryItem[]>('/inventory', { method: 'GET' }, mockInventory);
  },

  async getStockMovements(): Promise<{ data: StockMovement[]; isSimulated: boolean }> {
    return request<StockMovement[]>('/inventory/movements', { method: 'GET' }, mockStockMovements);
  },

  async getGateEntries(): Promise<{ data: InwardGateEntry[]; isSimulated: boolean }> {
    return request<InwardGateEntry[]>('/inventory/gate-entries', { method: 'GET' }, mockGateEntries);
  },

  async recordGateInward(
    entry: InwardGateEntry
  ): Promise<{ success: boolean; data: InwardGateEntry; isSimulated: boolean }> {
    const res = await request<{ success: boolean; data: InwardGateEntry }>(
      '/inventory/gate-inward',
      {
        method: 'POST',
        body: JSON.stringify(entry),
      },
      { success: true, data: entry }
    );
    return { success: res.data.success, data: res.data.data, isSimulated: res.isSimulated };
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

  async reserveYarnForOrder(payload: {
    orderId: string;
    orderNumber?: string;
    yarnSku: string;
    quantityKg: number;
  }): Promise<{ success: boolean; message: string; isSimulated: boolean }> {
    const res = await request<{ success: boolean; message: string }>(
      '/inventory/reserve-for-order',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { success: true, message: `Reserved ${payload.quantityKg} kg for order ${payload.orderNumber}` }
    );
    return { success: res.data.success, message: res.data.message, isSimulated: res.isSimulated };
  },

  async createPurchaseRequisition(payload: {
    materialCode?: string;
    yarnSku?: string;
    quantityKg: number;
    supplierName?: string;
    orderNumber?: string;
  }): Promise<{ success: boolean; poNumber: string; message: string; isSimulated: boolean }> {
    const res = await request<{ success: boolean; poNumber: string; message: string }>(
      '/inventory/purchase-requisition',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      {
        success: true,
        poNumber: `PO-REQ-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        message: `Purchase requisition created for ${payload.quantityKg} kg from ${payload.supplierName || 'supplier'}.`,
      }
    );
    return {
      success: res.data.success,
      poNumber: res.data.poNumber,
      message: res.data.message,
      isSimulated: res.isSimulated,
    };
  },

  /**
   * Pre-production Yarn Feasibility & Bill-of-Materials Calculation:
   * Formula: Yarn (kg) = (Length (m) * Width (m) * GSM / 1000) * (1 + Loom Crimp/Wastage factor ~5%)
   */
  calculateYarnFeasibility(
    params: {
      orderId?: string;
      orderNumber?: string;
      customerName?: string;
      fabricType: string;
      lengthMeters: number;
      widthInches?: number;
      gsm: number;
      yarnSpecs: string;
    },
    currentInventory: InventoryItem[]
  ): YarnFeasibilityResult {
    const widthInches = params.widthInches || 58; // Standard 58-inch / 1.47m width
    const widthMeters = widthInches * 0.0254;
    const wastageFactorPercent = 5.0; // 5% loom crimp, beam knotting & selvedge trim
    
    // Total raw fabric weight in kg = length * width * GSM / 1000
    const rawFabricWeightKg = (params.lengthMeters * widthMeters * params.gsm) / 1000;
    const calculatedYarnNeededKg = Math.round(rawFabricWeightKg * (1 + wastageFactorPercent / 100));
    
    // Split into 60% Warp and 40% Weft
    const warpYarnKg = Math.round(calculatedYarnNeededKg * 0.60);
    const weftYarnKg = Math.round(calculatedYarnNeededKg * 0.40);

    // Find best matching yarn in inventory by yarn specification or fabric type
    const matchingItem = currentInventory.find((item) => {
      if (item.category !== 'raw_yarn') return false;
      const specLower = item.specification.toLowerCase();
      const nameLower = item.name.toLowerCase();
      const queryLower = (params.yarnSpecs + ' ' + params.fabricType).toLowerCase();
      
      if (queryLower.includes('denim') && (specLower.includes('denim') || nameLower.includes('slub'))) return true;
      if (queryLower.includes('poly') || queryLower.includes('ripstop')) return specLower.includes('poly') || nameLower.includes('poly');
      if (queryLower.includes('oxford') || queryLower.includes('40s')) return specLower.includes('40s') || nameLower.includes('40s');
      if (queryLower.includes('cotton') || queryLower.includes('jersey') || queryLower.includes('twill')) return specLower.includes('cotton') || nameLower.includes('cotton');
      return true;
    }) || currentInventory.find((i) => i.category === 'raw_yarn') || currentInventory[0];

    const totalStockKg = matchingItem ? matchingItem.quantity : 0;
    const reservedStockKg = matchingItem ? matchingItem.reservedQuantity : 0;
    const availableStockKg = matchingItem ? matchingItem.availableQuantity : 0;

    const deficitKg = Math.max(0, calculatedYarnNeededKg - availableStockKg);
    const readyToStartPercent = Math.min(100, Math.round((availableStockKg / calculatedYarnNeededKg) * 100));

    let feasibilityStatus: 'ready' | 'partial' | 'deficit' = 'deficit';
    if (availableStockKg >= calculatedYarnNeededKg) {
      feasibilityStatus = 'ready';
    } else if (readyToStartPercent >= 50) {
      feasibilityStatus = 'partial'; // Can start warp beaming while top-up arrives
    } else {
      feasibilityStatus = 'deficit';
    }

    // Daily loom burn rate estimation (1 high-speed loom produces ~450 m/day = ~120-180 kg yarn/day)
    const dailyBurnRateKg = 160;
    const runwayDays = availableStockKg > 0 ? Number((availableStockKg / dailyBurnRateKg).toFixed(1)) : 0;

    return {
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      customerName: params.customerName,
      fabricType: params.fabricType,
      lengthMeters: params.lengthMeters,
      widthInches,
      gsm: params.gsm,
      yarnSpecs: params.yarnSpecs,
      calculatedYarnNeededKg,
      warpYarnKg,
      weftYarnKg,
      wastageFactorPercent,
      matchingInventoryItemId: matchingItem ? matchingItem.id : '',
      matchingYarnSku: matchingItem ? matchingItem.sku : 'YARN-COT-30S-ORG',
      matchingYarnName: matchingItem ? matchingItem.name : '30s Ne Organic Combed Cotton',
      totalStockKg,
      reservedStockKg,
      availableStockKg,
      deficitKg,
      feasibilityStatus,
      readyToStartPercent,
      dailyBurnRateKg,
      runwayDays,
      recommendedSupplier: matchingItem ? matchingItem.supplierName : 'Gujarat Cotton Mills Ltd',
      estimatedLeadTimeDays: 3,
    };
  },
};
