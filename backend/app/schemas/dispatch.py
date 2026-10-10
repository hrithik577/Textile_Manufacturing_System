from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.dispatch import ShipmentStatus
from app.schemas.quality import FabricRollRead


class ShipmentItemCreate(BaseModel):
    roll_id: int
    dispatched_quantity: Optional[float] = None
    unit: str = "m"


class ShipmentItemRead(BaseModel):
    id: int
    shipment_id: int
    roll_id: int
    dispatched_quantity: float
    unit: str
    roll: Optional[FabricRollRead] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShipmentBase(BaseModel):
    shipment_number: str
    sales_order_id: int
    customer_id: int
    carrier: Optional[str] = "DHL Global Forwarding"
    vehicle_number: Optional[str] = None
    destination_address: Optional[str] = None
    notes: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    roll_ids: Optional[List[int]] = []


class ShipmentRead(ShipmentBase):
    id: int
    status: ShipmentStatus
    dispatch_date: Optional[datetime] = None
    tracking_reference: Optional[str] = None
    total_rolls: int = 0
    total_meterage: float = 0.0
    items: List[ShipmentItemRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ShipmentConfirmResponse(BaseModel):
    shipment_id: int
    shipment_number: str
    status: ShipmentStatus
    dispatch_date: datetime
    tracking_reference: str
    dispatched_rolls_count: int
    total_meterage: float
    message: str
