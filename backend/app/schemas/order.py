from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.order import OrderStatus, OrderPriority
from app.schemas.customer import CustomerRead


class SalesOrderItemBase(BaseModel):
    fabric_type: str
    color_code: Optional[str] = None
    gsm: Optional[int] = None
    width_inches: Optional[float] = 58.0
    target_quantity: float = Field(gt=0, description="Quantity must be greater than zero")
    unit: str = "m"
    unit_price: float = Field(ge=0, description="Unit price cannot be negative")
    notes: Optional[str] = None


class SalesOrderItemCreate(SalesOrderItemBase):
    pass


class SalesOrderItemRead(SalesOrderItemBase):
    id: int
    sales_order_id: int
    total_price: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalesOrderBase(BaseModel):
    order_number: str
    customer_id: int
    order_date: date = Field(default_factory=date.today)
    required_delivery_date: date
    priority: OrderPriority = OrderPriority.NORMAL
    currency: str = "INR"
    notes: Optional[str] = None


class SalesOrderCreate(SalesOrderBase):
    items: List[SalesOrderItemCreate] = Field(min_length=1, description="Order must contain at least one item")


class SalesOrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    required_delivery_date: Optional[date] = None
    notes: Optional[str] = None


class SalesOrderRead(SalesOrderBase):
    id: int
    status: OrderStatus
    total_amount: float
    customer: Optional[CustomerRead] = None
    items: List[SalesOrderItemRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalesOrderListResponse(BaseModel):
    items: List[SalesOrderRead]
    total: int
    page: int = 1
    page_size: int = 50


class OrderTimelineEvent(BaseModel):
    timestamp: datetime
    event_type: str # order_placed, production_scheduled, weaving_started, inspection_passed, dispatched, delivered
    title: str
    description: str
    actor: Optional[str] = None
    status: str
    metadata: Optional[dict] = None


class OrderTimelineResponse(BaseModel):
    order_id: int
    order_number: str
    status: OrderStatus
    current_progress_pct: float
    timeline: List[OrderTimelineEvent]


class OrderCostSummaryResponse(BaseModel):
    order_id: int
    order_number: str
    currency: str = "INR"
    
    # Revenue & Invoicing
    agreed_order_value: float
    total_invoiced: float
    total_paid: float
    outstanding_balance: float
    
    # Production Costs Breakdown
    raw_material_cost: float
    electricity_cost: float
    labor_cost: float
    dye_chemical_cost: float
    overhead_cost: float
    maintenance_cost: float
    total_production_cost: float
    
    # Profitability / Margins
    estimated_gross_margin: float # agreed_order_value - total_production_cost
    gross_margin_percentage: float # (margin / agreed_order_value) * 100
