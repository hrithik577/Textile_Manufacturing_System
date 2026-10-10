from datetime import date, datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.production import ProductionStatus, DataSourceType


class ProductionOperationBase(BaseModel):
    process_name: str
    sequence: int = 1
    machine_id: Optional[int] = None
    planned_quantity: float = Field(gt=0)
    actual_quantity: float = 0.0
    status: str = "pending"


class ProductionOperationRead(ProductionOperationBase):
    id: int
    production_order_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductionOrderBase(BaseModel):
    production_order_number: str
    sales_order_id: Optional[int] = None
    target_quantity: float = Field(gt=0)
    unit: str = "m"
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    notes: Optional[str] = None


class ProductionOrderCreate(ProductionOrderBase):
    operations: Optional[List[ProductionOperationBase]] = None


class ProductionOrderRead(ProductionOrderBase):
    id: int
    completed_quantity: float
    status: ProductionStatus
    actual_start_date: Optional[datetime] = None
    actual_end_date: Optional[datetime] = None
    operations: List[ProductionOperationRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductionEventCreate(BaseModel):
    event_id: str
    production_order_id: int
    machine_id: Optional[int] = None
    event_type: str # batch_start, meterage_output, defect_detected, batch_end
    quantity: float = 0.0
    unit: str = "m"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    source: DataSourceType = DataSourceType.SIMULATOR
    notes: Optional[str] = None


class ProductionEventRead(BaseModel):
    id: int
    event_id: str
    production_order_id: int
    machine_id: Optional[int] = None
    event_type: str
    quantity: float
    unit: str
    event_timestamp: datetime
    source: DataSourceType
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
