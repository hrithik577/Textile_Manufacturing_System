from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.quality import RollStatus, InspectionResult, RollGrade


class QualityInspectionBase(BaseModel):
    roll_id: int
    result: InspectionResult
    defect_count: int = 0
    defect_details: Optional[List[Dict[str, Any]]] = None
    disposition: str = "approved_for_dispatch"
    points_per_100_sqm: Optional[float] = 0.0
    notes: Optional[str] = None


class QualityInspectionCreate(QualityInspectionBase):
    pass


class QualityInspectionRead(QualityInspectionBase):
    id: int
    inspector_id: Optional[int] = None
    inspection_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FabricRollBase(BaseModel):
    roll_code: str
    production_order_id: Optional[int] = None
    sales_order_id: Optional[int] = None
    fabric_type: str
    length_m: float = Field(gt=0)
    weight_kg: Optional[float] = None
    width_inches: Optional[float] = 58.0
    gsm: Optional[int] = None
    grade: RollGrade = RollGrade.GRADE_A
    current_status: RollStatus = RollStatus.UNINSPECTED
    current_location: str = "Inspection Bay 1"
    notes: Optional[str] = None


class FabricRollCreate(FabricRollBase):
    pass


class FabricRollRead(FabricRollBase):
    id: int
    inspections: List[QualityInspectionRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RollGenealogyResponse(BaseModel):
    roll_id: int
    roll_code: str
    fabric_type: str
    length_m: float
    grade: RollGrade
    current_status: RollStatus
    created_at: datetime
    
    # Traceability links
    sales_order: Optional[dict] = None
    production_order: Optional[dict] = None
    machine_origin: Optional[dict] = None
    inspections: List[QualityInspectionRead] = []
    shipment: Optional[dict] = None
