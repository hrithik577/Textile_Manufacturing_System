from datetime import date, datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.models.yarniq import (
    QualityStatus,
    POStatus,
    ReadinessStatus,
    StockTransactionType,
    RecommendationStatus,
)


# ─── Specification ───────────────────────────────────────────────────────────────
class YarnSpecificationBase(BaseModel):
    sku: str
    name: str
    yarn_count: str
    yarn_type: str
    fibre_composition: str
    color_name: str
    color_code: str
    unit: str = "kg"
    standard_cost_per_kg: float = 4.50
    reorder_threshold_kg: float = 500.0
    safety_stock_kg: float = 250.0
    lead_time_days: int = 7


class YarnSpecificationCreate(YarnSpecificationBase):
    pass


class YarnSpecificationRead(YarnSpecificationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Purchase Orders ──────────────────────────────────────────────────────────
class YarnPOLineRead(BaseModel):
    id: int
    specification_id: int
    sku: str
    yarn_name: str
    ordered_quantity_kg: float
    received_quantity_kg: float
    unit_price: float
    tolerance_percent: float

    class Config:
        from_attributes = True


class YarnPurchaseOrderRead(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: str
    order_date: date
    expected_delivery_date: date
    status: POStatus
    total_ordered_kg: float
    total_received_kg: float
    lines: List[YarnPOLineRead] = []

    class Config:
        from_attributes = True


# ─── Goods Receipt ──────────────────────────────────────────────────────────────
class GoodsReceiptLineInput(BaseModel):
    specification_id: int
    supplier_lot_number: str
    ordered_quantity_kg: float = 0.0
    gross_weight_kg: float
    net_weight_kg: float
    storage_location: str = "Warehouse A - Bay 1"
    intended_production_order_id: Optional[int] = None
    quality_status: QualityStatus = QualityStatus.APPROVED


class GoodsReceiptCreate(BaseModel):
    supplier_id: int
    po_id: Optional[int] = None
    challan_number: str
    vehicle_number: Optional[str] = None
    driver_name: Optional[str] = None
    lines: List[GoodsReceiptLineInput]
    notes: Optional[str] = None


class GoodsReceiptLineRead(BaseModel):
    id: int
    specification_id: int
    sku: str
    yarn_name: str
    supplier_lot_number: str
    internal_lot_number: str
    ordered_quantity_kg: float
    gross_weight_kg: float
    net_weight_kg: float
    discrepancy_kg: float
    is_discrepant: bool
    storage_location: str
    quality_status: QualityStatus

    class Config:
        from_attributes = True


class GoodsReceiptRead(BaseModel):
    id: int
    receipt_number: str
    po_id: Optional[int]
    po_number: Optional[str]
    supplier_id: int
    supplier_name: str
    challan_number: str
    receipt_timestamp: datetime
    vehicle_number: Optional[str]
    driver_name: Optional[str]
    total_gross_weight_kg: float
    total_tare_weight_kg: float
    total_net_weight_kg: float
    has_discrepancy: bool
    discrepancy_details: Optional[str]
    notes: Optional[str]
    lines: List[GoodsReceiptLineRead] = []

    class Config:
        from_attributes = True


# ─── Yarn Lots & Stock ──────────────────────────────────────────────────────────
class YarnLotRead(BaseModel):
    id: int
    lot_number: str
    specification_id: int
    sku: str
    name: str
    yarn_count: str
    yarn_type: str
    fibre_composition: str
    color_name: str
    color_code: str
    supplier_id: int
    supplier_name: str
    physical_quantity_kg: float
    reserved_quantity_kg: float
    available_quantity_kg: float
    quarantined_quantity_kg: float
    quality_status: QualityStatus
    storage_location: str
    received_date: date
    reorder_threshold_kg: float
    safety_stock_kg: float
    unit: str

    class Config:
        from_attributes = True


# ─── Production Readiness Engine ────────────────────────────────────────────────
class MaterialRequirementInput(BaseModel):
    specification_id: Optional[int] = None
    sku: Optional[str] = None
    yarn_count: Optional[str] = None
    yarn_type: Optional[str] = None
    fibre_composition: Optional[str] = None
    color_name: Optional[str] = None
    planned_yarn_kg: Optional[float] = None  # Direct yarn kg
    # Or finished fabric inputs to convert:
    finished_meters: Optional[float] = None
    gsm: Optional[float] = None
    width_inches: Optional[float] = None
    wastage_rate: float = 0.04  # 4% standard textile manufacturing wastage


class ProductionReadinessRequest(BaseModel):
    production_order_id: Optional[int] = None  # If evaluating existing order
    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    planned_start_date: Optional[date] = None
    production_deadline: Optional[date] = None
    requirements: List[MaterialRequirementInput] = []


class MaterialReadinessBreakdown(BaseModel):
    specification_id: int
    sku: str
    yarn_name: str
    yarn_count: str
    color_name: str
    color_code: str
    fibre_composition: str
    
    required_yarn_kg: float
    eligible_physical_stock_kg: float
    existing_reservations_kg: float
    available_yarn_kg: float
    quarantined_stock_kg: float
    shortage_kg: float
    is_fulfilled: bool
    
    eligible_lot_numbers: List[str] = []
    incoming_po_number: Optional[str] = None
    incoming_po_date: Optional[date] = None
    incoming_po_qty_kg: Optional[float] = None
    reason: str


class ProductionReadinessResponse(BaseModel):
    status: ReadinessStatus
    overall_score_percent: float
    order_number: str
    customer_name: str
    planned_start_date: Optional[date]
    earliest_feasible_start_date: Optional[date]
    production_deadline: Optional[date]
    total_required_kg: float
    total_available_kg: float
    total_shortage_kg: float
    has_quarantine_blocker: bool
    has_incoming_dependency: bool
    summary_verdict: str
    material_breakdowns: List[MaterialReadinessBreakdown] = []
    recommended_action: Optional[str] = None
    data_sources_and_assumptions: List[str] = []


# ─── Stockout Radar ─────────────────────────────────────────────────────────────
class StockoutProjectionPoint(BaseModel):
    date: str
    projected_stock_kg: float
    safety_stock_threshold_kg: float
    event_label: Optional[str] = None


class StockoutRadarItem(BaseModel):
    specification_id: int
    sku: str
    yarn_name: str
    yarn_count: str
    color_name: str
    color_code: str
    current_physical_kg: float
    current_reserved_kg: float
    current_available_kg: float
    safety_stock_kg: float
    reorder_threshold_kg: float
    days_of_supply_remaining: int
    earliest_shortage_date: Optional[date]
    estimated_shortage_kg: float
    affected_order_numbers: List[str] = []
    severity: str  # "critical", "warning", "healthy"
    expected_replenishment_date: Optional[date] = None
    timeline: List[StockoutProjectionPoint] = []


# ─── Procurement Copilot ────────────────────────────────────────────────────────
class CopilotQueryRequest(BaseModel):
    query: str
    context_order_id: Optional[str] = None  # Accepts order number string or int ID
    context_sku: Optional[str] = None


class CopilotEvidenceItem(BaseModel):
    label: str
    value: str
    source_table: str


class CopilotActionProposal(BaseModel):
    action_type: str
    title: str
    description: str
    endpoint: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class CopilotQueryResponse(BaseModel):
    query: str
    answer: str
    status: ReadinessStatus = ReadinessStatus.READY
    evidence: List[CopilotEvidenceItem] = []
    recommended_actions: List[CopilotActionProposal] = []
    calculation_basis: Optional[str] = None


# ─── Recommendations ────────────────────────────────────────────────────────────
class RecommendationRead(BaseModel):
    id: int
    recommendation_code: str
    target_production_order_id: Optional[int]
    target_order_number: Optional[str]
    specification_id: Optional[int]
    sku: Optional[str]
    title: str
    problem_statement: str
    proposed_action: str
    expected_benefit: str
    risks_tradeoffs: str
    shortage_resolved_kg: float
    status: RecommendationStatus
    priority: str
    evidence_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class RecommendationActionRequest(BaseModel):
    action: str  # "approve" | "reject" | "execute"
    notes: Optional[str] = None


# ─── Stock Ledger ───────────────────────────────────────────────────────────────
class StockLedgerEntryRead(BaseModel):
    id: int
    entry_number: str
    specification_id: int
    sku: str
    yarn_name: str
    lot_number: Optional[str]
    transaction_type: StockTransactionType
    quantity_kg: float
    balance_after_kg: float
    reference_type: str
    reference_id: str
    actor_name: Optional[str]
    notes: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Overview Dashboard ─────────────────────────────────────────────────────────
class OverviewMetricsResponse(BaseModel):
    total_usable_stock_kg: float
    total_reserved_stock_kg: float
    total_quarantined_stock_kg: float
    lots_awaiting_inspection_count: int
    po_discrepancies_count: int
    blocked_production_orders_count: int
    at_risk_orders_count: int
    stock_by_fiber: List[Dict[str, Any]]
    stock_by_color: List[Dict[str, Any]]
    recent_receipts: List[Dict[str, Any]]
    critical_alerts: List[Dict[str, Any]]
    prioritized_actions: List[Dict[str, Any]]
