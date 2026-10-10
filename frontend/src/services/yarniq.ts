import { request } from './api-client';
import {
  YarnIQOverviewMetrics,
  YarnSpecification,
  YarnLot,
  YarnPurchaseOrder,
  GoodsReceipt,
  GoodsReceiptCreateInput,
  ProductionReadinessRequest,
  ProductionReadinessResponse,
  StockoutRadarItem,
  CopilotQueryRequest,
  CopilotQueryResponse,
  YarnRecommendation,
  StockLedgerEntry,
} from '../types/yarniq';

export const yarniqService = {
  async getOverview(): Promise<{ data: YarnIQOverviewMetrics; isSimulated: boolean }> {
    return request<YarnIQOverviewMetrics>(
      '/yarniq/overview',
      { method: 'GET' },
      {
        total_usable_stock_kg: 8950.0,
        total_reserved_stock_kg: 3300.0,
        total_quarantined_stock_kg: 1200.0,
        lots_awaiting_inspection_count: 1,
        po_discrepancies_count: 1,
        blocked_production_orders_count: 1,
        at_risk_orders_count: 1,
        stock_by_fiber: [
          { fiber: '100% Cotton', quantity_kg: 3950.0 },
          { fiber: '65% Poly / 35% Cotton', quantity_kg: 2200.0 },
          { fiber: '100% Polyester', quantity_kg: 400.0 },
        ],
        stock_by_color: [
          { name: 'Raw Ecru', hex: '#f5f5dc', quantity_kg: 3800.0 },
          { name: 'Navy Blue', hex: '#1e3a8a', quantity_kg: 150.0 },
          { name: 'Optic White', hex: '#f8fafc', quantity_kg: 2200.0 },
          { name: 'Crimson Red', hex: '#dc2626', quantity_kg: 400.0 },
        ],
        recent_receipts: [],
        critical_alerts: [],
        prioritized_actions: [],
      }
    );
  },

  async getSpecifications(): Promise<{ data: YarnSpecification[]; isSimulated: boolean }> {
    return request<YarnSpecification[]>('/yarniq/specifications', { method: 'GET' }, []);
  },

  async getInventory(params?: { spec_id?: number; quality_status?: string; search?: string }): Promise<{ data: YarnLot[]; isSimulated: boolean }> {
    const query = new URLSearchParams();
    if (params?.spec_id) query.append('spec_id', params.spec_id.toString());
    if (params?.quality_status) query.append('quality_status', params.quality_status);
    if (params?.search) query.append('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<YarnLot[]>(`/yarniq/inventory${qs}`, { method: 'GET' }, []);
  },

  async getPurchaseOrders(statusFilter?: string): Promise<{ data: YarnPurchaseOrder[]; isSimulated: boolean }> {
    const qs = statusFilter ? `?status_filter=${statusFilter}` : '';
    return request<YarnPurchaseOrder[]>(`/yarniq/purchase-orders${qs}`, { method: 'GET' }, []);
  },

  async getReceipts(): Promise<{ data: GoodsReceipt[]; isSimulated: boolean }> {
    return request<GoodsReceipt[]>('/yarniq/receipts', { method: 'GET' }, []);
  },

  async createGoodsReceipt(payload: GoodsReceiptCreateInput): Promise<{ data: any; isSimulated: boolean }> {
    return request<any>('/yarniq/receipts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async checkProductionReadiness(payload: ProductionReadinessRequest): Promise<{ data: ProductionReadinessResponse; isSimulated: boolean }> {
    return request<ProductionReadinessResponse>('/yarniq/readiness', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getStockoutRadar(): Promise<{ data: StockoutRadarItem[]; isSimulated: boolean }> {
    return request<StockoutRadarItem[]>('/yarniq/stockout-radar', { method: 'GET' }, []);
  },

  async askCopilot(payload: CopilotQueryRequest): Promise<{ data: CopilotQueryResponse; isSimulated: boolean }> {
    return request<CopilotQueryResponse>('/yarniq/copilot', {
      method: 'POST',
      body: JSON.stringify(payload),
      timeoutMs: 25000,
    });
  },

  async getRecommendations(): Promise<{ data: YarnRecommendation[]; isSimulated: boolean }> {
    return request<YarnRecommendation[]>('/yarniq/recommendations', { method: 'GET' }, []);
  },

  async handleRecommendationAction(recId: number, action: string): Promise<{ data: any; isSimulated: boolean }> {
    return request<any>(`/yarniq/recommendations/${recId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  },

  async getTraceability(lotIdentifier: string): Promise<{ data: any; isSimulated: boolean }> {
    return request<any>(`/yarniq/traceability/${lotIdentifier}`, { method: 'GET' });
  },

  async getStockLedger(): Promise<{ data: StockLedgerEntry[]; isSimulated: boolean }> {
    return request<StockLedgerEntry[]>('/yarniq/ledger', { method: 'GET' }, []);
  },

  async seedData(force = false): Promise<{ data: any; isSimulated: boolean }> {
    return request<any>(`/yarniq/seed?force=${force}`, { method: 'POST' });
  },
};
