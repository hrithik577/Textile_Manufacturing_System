from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.inventory import MaterialType, MovementType


class MaterialBase(BaseModel):
    material_code: str
    name: str
    material_type: MaterialType = MaterialType.YARN
    unit: str = "kg"
    reorder_threshold: float = Field(ge=0, default=100.0)
    safety_stock: float = Field(ge=0, default=50.0)
    standard_cost_per_unit: float = Field(ge=0, default=0.0)
    description: Optional[str] = None


class MaterialCreate(MaterialBase):
    initial_stock: Optional[float] = Field(default=0.0, ge=0)


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    material_type: Optional[MaterialType] = None
    unit: Optional[str] = None
    reorder_threshold: Optional[float] = None
    safety_stock: Optional[float] = None
    standard_cost_per_unit: Optional[float] = None
    description: Optional[str] = None


class MaterialLotRead(BaseModel):
    id: int
    lot_number: str
    material_id: int
    supplier_id: Optional[int] = None
    received_quantity: float
    available_quantity: float
    reserved_quantity: float
    unit: str
    received_date: date
    expiry_date: Optional[date] = None
    unit_cost: float
    storage_location: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MaterialRead(MaterialBase):
    id: int
    current_stock: float
    lots: List[MaterialLotRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryMovementRead(BaseModel):
    id: int
    material_id: int
    lot_id: Optional[int] = None
    movement_type: MovementType
    quantity: float
    unit: str
    source_location: Optional[str] = None
    destination_location: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    actor_id: Optional[int] = None
    notes: Optional[str] = None
    movement_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class ReceiptRequest(BaseModel):
    material_id: int
    supplier_id: Optional[int] = None
    lot_number: str
    quantity: float = Field(gt=0, description="Quantity must be greater than zero")
    unit: str
    unit_cost: float = Field(ge=0, default=0.0)
    storage_location: str = "Warehouse A"
    notes: Optional[str] = None


class ReservationRequest(BaseModel):
    material_id: int
    lot_id: Optional[int] = None
    quantity: float = Field(gt=0, description="Quantity must be greater than zero")
    unit: str
    production_order_id: Optional[int] = None
    sales_order_id: Optional[int] = None
    notes: Optional[str] = None


class ConsumptionRequest(BaseModel):
    material_id: int
    lot_id: Optional[int] = None
    quantity: float = Field(gt=0, description="Quantity must be greater than zero")
    unit: str
    production_order_id: Optional[int] = None
    process_name: Optional[str] = None
    notes: Optional[str] = None


class AdjustmentRequest(BaseModel):
    material_id: int
    lot_id: Optional[int] = None
    quantity: float # Can be positive (found stock) or negative (damaged/lost)
    unit: str
    reason: str
    notes: Optional[str] = None


class LowStockItem(BaseModel):
    material_id: int
    material_code: str
    name: str
    material_type: MaterialType
    current_stock: float
    reorder_threshold: float
    safety_stock: float
    unit: str
    deficit: float
    recommended_reorder_qty: float


class LowStockResponse(BaseModel):
    items: List[LowStockItem]
    total_low_stock_materials: int
