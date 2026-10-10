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


class OEEMachineBreakdown(BaseModel):
    machine_id: int
    machine_code: str
    machine_name: str
    process_type: str
    status: str
    rated_speed_mpm: Optional[float] = None
    
    # Availability
    planned_production_minutes: float
    downtime_minutes: float
    runtime_minutes: float
    availability: Optional[float] = None
    
    # Performance
    actual_output_meters: float
    expected_output_meters: float
    performance: Optional[float] = None
    performance_diagnostic: Optional[str] = None
    
    # Quality
    total_inspected_meters: float
    first_pass_good_meters: float
    quality: Optional[float] = None
    
    # Overall
    oee: Optional[float] = None
    oee_percentage: Optional[float] = None
    calculation_status: str # valid, insufficient_data, no_planned_time, no_runtime
    missing_reasons: List[str] = []


class PlantOEEResponse(BaseModel):
    reporting_window_start: datetime
    reporting_window_end: datetime
    data_freshness: datetime
    data_completeness_pct: float
    data_mode: str # "live" or "demo"
    
    # Plant Aggregate Ratios
    total_planned_minutes: float
    total_runtime_minutes: float
    total_downtime_minutes: float
    availability: Optional[float] = None
    
    total_actual_meters: float
    total_expected_meters: float
    performance: Optional[float] = None
    
    total_inspected_meters: float
    total_first_pass_good_meters: float
    quality: Optional[float] = None
    
    oee: Optional[float] = None
    oee_percentage: Optional[float] = None
    
    calculation_status: str # valid, insufficient_data
    missing_reasons: List[str] = []
    machine_breakdowns: List[OEEMachineBreakdown] = []

