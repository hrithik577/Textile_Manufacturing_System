from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.finance import CostCategory, InvoiceStatus, PaymentMethod


class CostEntryCreate(BaseModel):
    category: CostCategory
    amount: float = Field(gt=0)
    currency: str = "INR"
    sales_order_id: Optional[int] = None
    production_order_id: Optional[int] = None
    description: Optional[str] = None


class CostEntryRead(BaseModel):
    id: int
    category: CostCategory
    amount: float
    currency: str
    sales_order_id: Optional[int] = None
    production_order_id: Optional[int] = None
    entry_timestamp: datetime
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    invoice_id: int
    amount: float = Field(gt=0)
    payment_date: date = Field(default_factory=date.today)
    payment_method: PaymentMethod = PaymentMethod.BANK_TRANSFER
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentRead(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_date: date
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceCreate(BaseModel):
    invoice_number: str
    customer_id: int
    sales_order_id: Optional[int] = None
    total_amount: float = Field(gt=0)
    currency: str = "INR"
    issue_date: date = Field(default_factory=date.today)
    due_date: date
    notes: Optional[str] = None


class InvoiceRead(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    sales_order_id: Optional[int] = None
    total_amount: float
    paid_amount: float
    currency: str
    status: InvoiceStatus
    issue_date: date
    due_date: date
    notes: Optional[str] = None
    payments: List[PaymentRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FinanceSummaryResponse(BaseModel):
    currency: str = "INR"
    total_revenue_booked: float # Total of confirmed sales orders
    total_invoiced: float
    total_collected_cash: float
    outstanding_receivables: float
    total_production_costs: float
    gross_factory_margin: float # total_revenue_booked - total_production_costs
    gross_margin_percentage: float
    costs_by_category: dict


class OrderItemCostSheet(BaseModel):
    order_id: int
    order_number: str
    customer_name: str
    fabric_spec: str
    meters: float
    revenue: float
    material_cost: float
    dye_chem_cost: float
    power_cost: float
    labor_cost: float
    total_cost: float
    net_profit: float
    margin_pct: float
    status: str


class MachineYieldOpex(BaseModel):
    machine_id: int
    machine_code: str
    name: str
    process_type: str
    status: str
    meters_produced: float
    power_kwh: float
    power_cost: float
    maintenance_cost: float
    uptime_pct: float
    cost_per_meter: float


class WorkerPayrollItem(BaseModel):
    department: str
    headcount: int
    present_count: int
    regular_wages: float
    overtime_wages: float
    total_payroll: float
    attendance_pct: float


class RawMaterialBillItem(BaseModel):
    id: int
    bill_number: str
    supplier_name: str
    material_name: str
    lot_number: str
    quantity: float
    unit: str
    rate: float
    subtotal: float
    gst_amount: float
    total_amount: float
    status: str


class WaterfallItem(BaseModel):
    name: str
    amount: float
    type: str  # "positive", "negative", "total"


class ExpensePieItem(BaseModel):
    name: str
    value: float
    color: str


class FinancialStatementItem(BaseModel):
    code: str
    label: str
    budget: float
    actual: float
    variance: float
    variance_pct: float
    pct_of_rev: float
    status: str
    is_total: bool = False


class ClosingTheBooksResponse(BaseModel):
    period: str
    currency: str
    verdict: str
    is_profitable: bool
    total_revenue: float
    total_expenses: float
    net_profit: float
    ebitda_margin_pct: float
    buyer_payments_total: float
    raw_material_bills_total: float
    worker_wages_total: float
    machine_opex_total: float
    financial_statement: List[FinancialStatementItem]
    waterfall_data: List[WaterfallItem]
    expense_distribution: List[ExpensePieItem]
    order_cost_sheets: List[OrderItemCostSheet]
    machine_yield_opex: List[MachineYieldOpex]
    worker_payroll: List[WorkerPayrollItem]
    raw_material_bills: List[RawMaterialBillItem]

