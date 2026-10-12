/**
 * Everest Textile OS — Finance & Financial Close Service
 * Connects directly to backend FastAPI PostgreSQL endpoints for Scene 6 Financial Close.
 */

import { request } from './api-client';

export interface FinancialStatementItem {
  code: string;
  label: string;
  budget: number;
  actual: number;
  variance: number;
  variance_pct: number;
  pct_of_rev: number;
  status: 'favorable' | 'unfavorable' | 'neutral';
  is_total?: boolean;
}

export interface WaterfallItem {
  name: string;
  amount: number;
  type: 'positive' | 'negative' | 'total';
}

export interface ExpensePieItem {
  name: string;
  value: number;
  color: string;
}

export interface OrderItemCostSheet {
  order_id: number;
  order_number: string;
  customer_name: string;
  fabric_spec: string;
  meters: number;
  revenue: number;
  material_cost: number;
  dye_chem_cost: number;
  power_cost: number;
  labor_cost: number;
  total_cost: number;
  net_profit: number;
  margin_pct: number;
  status: string;
}

export interface MachineYieldOpex {
  machine_id: number;
  machine_code: string;
  name: string;
  process_type: string;
  status: string;
  meters_produced: number;
  power_kwh: number;
  power_cost: number;
  maintenance_cost: number;
  uptime_pct: number;
  cost_per_meter: number;
}

export interface WorkerPayrollItem {
  department: string;
  headcount: number;
  present_count: number;
  regular_wages: number;
  overtime_wages: number;
  total_payroll: number;
  attendance_pct: number;
}

export interface RawMaterialBillItem {
  id: number;
  bill_number: string;
  supplier_name: string;
  material_name: string;
  lot_number: string;
  quantity: number;
  unit: string;
  rate: number;
  subtotal: number;
  gst_amount: number;
  total_amount: number;
  status: string;
}

export interface ClosingTheBooksResponse {
  period: string;
  currency: string;
  verdict: string;
  is_profitable: boolean;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  ebitda_margin_pct: number;
  buyer_payments_total: number;
  raw_material_bills_total: number;
  worker_wages_total: number;
  machine_opex_total: number;
  financial_statement: FinancialStatementItem[];
  waterfall_data: WaterfallItem[];
  expense_distribution: ExpensePieItem[];
  order_cost_sheets: OrderItemCostSheet[];
  machine_yield_opex: MachineYieldOpex[];
  worker_payroll: WorkerPayrollItem[];
  raw_material_bills: RawMaterialBillItem[];
}

export interface CostEntryPayload {
  category: 'raw_material' | 'electricity' | 'labor' | 'dye_chemical' | 'overhead' | 'maintenance';
  amount: number;
  currency?: string;
  sales_order_id?: number | null;
  description: string;
}

export const financeService = {
  async getClosingTheBooks(period: string = 'October 2026'): Promise<{ data: ClosingTheBooksResponse; isSimulated: boolean }> {
    return request<ClosingTheBooksResponse>(`/finance/closing-the-books?period=${encodeURIComponent(period)}`, {
      method: 'GET',
    });
  },

  async recordCostEntry(payload: CostEntryPayload): Promise<{ data: any; isSimulated: boolean }> {
    return request('/finance/cost-entries', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        currency: payload.currency || 'INR',
      }),
    });
  },
};
