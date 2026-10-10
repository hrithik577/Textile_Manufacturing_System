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
