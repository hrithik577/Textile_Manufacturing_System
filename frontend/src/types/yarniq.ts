export type QualityStatus = 'pending' | 'approved' | 'quarantined' | 'rejected';
export type POStatus = 'draft' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
export type ReadinessStatus = 'READY' | 'AT_RISK' | 'BLOCKED';
export type StockTransactionType =
  | 'goods_receipt'
  | 'quality_hold'
  | 'quality_release'
  | 'reservation'
  | 'reservation_release'
  | 'material_issue'
  | 'consumption'
  | 'adjustment'
  | 'return_reversal';
export type RecommendationStatus = 'proposed' | 'approved' | 'rejected' | 'executed';

export interface YarnSpecification {
  id: number;
  sku: string;
  name: string;
  yarn_count: string;
  yarn_type: string;
  fibre_composition: string;
  color_name: string;
  color_code: string;
  unit: string;
  standard_cost_per_kg: number;
  reorder_threshold_kg: number;
  safety_stock_kg: number;
  lead_time_days: number;
  is_active: boolean;
}

export interface YarnLot {
  id: number;
  lot_number: string;
  specification_id: number;
  sku: string;
  name: string;
  yarn_count: string;
  yarn_type: string;
  fibre_composition: string;
  color_name: string;
  color_code: string;
  supplier_id: number;
  supplier_name: string;
  physical_quantity_kg: number;
  reserved_quantity_kg: number;
  available_quantity_kg: number;
  quarantined_quantity_kg: number;
  quality_status: QualityStatus;
  storage_location: string;
  received_date: string;
  reorder_threshold_kg: number;
  safety_stock_kg: number;
  unit: string;
}

export interface YarnPOLine {
  id: number;
  specification_id: number;
  sku: string;
  yarn_name: string;
  ordered_quantity_kg: number;
  received_quantity_kg: number;
  unit_price: number;
  tolerance_percent: number;
}

export interface YarnPurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  supplier_name: string;
  order_date: string;
  expected_delivery_date: string;
  status: POStatus;
  total_ordered_kg: number;
  total_received_kg: number;
  lines: YarnPOLine[];
}

export interface GoodsReceiptLineInput {
  specification_id: number;
  supplier_lot_number: string;
  ordered_quantity_kg: number;
  gross_weight_kg: number;
  net_weight_kg: number;
  storage_location?: string;
  intended_production_order_id?: number;
  quality_status?: QualityStatus;
}

export interface GoodsReceiptCreateInput {
  supplier_id: number;
  po_id?: number | null;
  challan_number: string;
  vehicle_number?: string;
  driver_name?: string;
  lines: GoodsReceiptLineInput[];
  notes?: string;
}

export interface GoodsReceiptLineRead {
  id: number;
  specification_id: number;
  sku: string;
  yarn_name: string;
  supplier_lot_number: string;
  internal_lot_number: string;
  ordered_quantity_kg: number;
  gross_weight_kg: number;
  net_weight_kg: number;
  discrepancy_kg: number;
  is_discrepant: boolean;
  storage_location: string;
  quality_status: QualityStatus;
}

export interface GoodsReceipt {
  id: number;
  receipt_number: string;
  po_id: number | null;
  po_number: string | null;
  supplier_id: number;
  supplier_name: string;
  challan_number: string;
  receipt_timestamp: string;
  vehicle_number: string | null;
  driver_name: string | null;
  total_gross_weight_kg: number;
  total_tare_weight_kg: number;
  total_net_weight_kg: number;
  has_discrepancy: boolean;
  discrepancy_details: string | null;
  notes: string | null;
  lines: GoodsReceiptLineRead[];
}

export interface MaterialRequirementInput {
  specification_id?: number;
  sku?: string;
  yarn_count?: string;
  color_name?: string;
  planned_yarn_kg?: number;
  finished_meters?: number;
  gsm?: number;
  width_inches?: number;
  wastage_rate?: number;
}

export interface ProductionReadinessRequest {
  production_order_id?: number | null;
  order_number?: string;
  customer_name?: string;
  planned_start_date?: string;
  production_deadline?: string;
  requirements?: MaterialRequirementInput[];
}

export interface MaterialReadinessBreakdown {
  specification_id: number;
  sku: string;
  yarn_name: string;
  yarn_count: string;
  color_name: string;
  color_code: string;
  fibre_composition: string;
  required_yarn_kg: number;
  eligible_physical_stock_kg: number;
  existing_reservations_kg: number;
  available_yarn_kg: number;
  quarantined_stock_kg: number;
  shortage_kg: number;
  is_fulfilled: boolean;
  eligible_lot_numbers: string[];
  incoming_po_number: string | null;
  incoming_po_date: string | null;
  incoming_po_qty_kg: number | null;
  reason: string;
}

export interface ProductionReadinessResponse {
  status: ReadinessStatus;
  overall_score_percent: number;
  order_number: string;
  customer_name: string;
  planned_start_date: string | null;
  earliest_feasible_start_date: string | null;
  production_deadline: string | null;
  total_required_kg: number;
  total_available_kg: number;
  total_shortage_kg: number;
  has_quarantine_blocker: boolean;
  has_incoming_dependency: boolean;
  summary_verdict: string;
  material_breakdowns: MaterialReadinessBreakdown[];
  recommended_action: string | null;
  data_sources_and_assumptions: string[];
}

export interface StockoutProjectionPoint {
  date: string;
  projected_stock_kg: number;
  safety_stock_threshold_kg: number;
  event_label?: string | null;
}

export interface StockoutRadarItem {
  specification_id: number;
  sku: string;
  yarn_name: string;
  yarn_count: string;
  color_name: string;
  color_code: string;
  current_physical_kg: number;
  current_reserved_kg: number;
  current_available_kg: number;
  safety_stock_kg: number;
  reorder_threshold_kg: number;
  days_of_supply_remaining: number;
  earliest_shortage_date: string | null;
  estimated_shortage_kg: number;
  affected_order_numbers: string[];
  severity: 'critical' | 'warning' | 'healthy';
  expected_replenishment_date: string | null;
  timeline: StockoutProjectionPoint[];
}

export interface CopilotEvidenceItem {
  label: string;
  value: string;
  source_table: string;
}

export interface CopilotActionProposal {
  action_type: string;
  title: string;
  description: string;
  endpoint?: string;
  payload?: any;
}

export interface CopilotQueryRequest {
  query: string;
  context_order_id?: number | null;
  context_sku?: string | null;
}

export interface CopilotQueryResponse {
  query: string;
  answer: string;
  status: ReadinessStatus;
  evidence: CopilotEvidenceItem[];
  recommended_actions: CopilotActionProposal[];
  calculation_basis: string | null;
}

export interface YarnRecommendation {
  id: number;
  recommendation_code: string;
  target_production_order_id: number | null;
  target_order_number: string | null;
  specification_id: number | null;
  sku: string | null;
  title: string;
  problem_statement: string;
  proposed_action: string;
  expected_benefit: string;
  risks_tradeoffs: string;
  shortage_resolved_kg: number;
  status: RecommendationStatus;
  priority: string;
  evidence_data: any;
  created_at: string;
}

export interface StockLedgerEntry {
  id: number;
  entry_number: string;
  specification_id: number;
  sku: string;
  yarn_name: string;
  lot_number: string | null;
  transaction_type: StockTransactionType;
  quantity_kg: number;
  balance_after_kg: number;
  reference_type: string;
  reference_id: string;
  actor_name: string | null;
  notes: string | null;
  timestamp: string;
}

export interface YarnIQOverviewMetrics {
  total_usable_stock_kg: number;
  total_reserved_stock_kg: number;
  total_quarantined_stock_kg: number;
  lots_awaiting_inspection_count: number;
  po_discrepancies_count: number;
  blocked_production_orders_count: number;
  at_risk_orders_count: number;
  stock_by_fiber: { fiber: string; quantity_kg: number }[];
  stock_by_color: { name: string; hex: string; quantity_kg: number }[];
  recent_receipts: {
    receipt_number: string;
    challan_number: string;
    supplier_name: string;
    net_weight_kg: number;
    has_discrepancy: boolean;
    timestamp: string;
  }[];
  critical_alerts: {
    severity: 'danger' | 'warning' | 'info';
    title: string;
    description: string;
    link: string;
  }[];
  prioritized_actions: {
    id: string;
    priority: string;
    title: string;
    action: string;
    category: string;
  }[];
}
