"""Domain models for the Everest Textile OS Virtual Factory Simulator.

All simulated entities explicitly flag source='simulator'.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, computed_field


class MachineState(str, Enum):
    RUNNING = "running"
    IDLE = "idle"
    SETUP = "setup"
    BREAKDOWN = "breakdown"
    MAINTENANCE = "maintenance"


class ProcessType(str, Enum):
    RAW_MATERIAL_PREP = "raw_material_prep"
    SPINNING = "spinning"
    WEAVING = "weaving"
    KNITTING = "knitting"
    DYEING_FINISHING = "dyeing_finishing"
    INSPECTION = "inspection"
    ROLL_CREATION = "roll_creation"


class OrderPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class OrderStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    AT_RISK = "at_risk"
    ON_HOLD = "on_hold"


class VirtualMachine(BaseModel):
    """Simulated textile machinery with deterministic operational state."""
    machine_id: str
    name: str
    process_type: ProcessType
    state: MachineState = MachineState.IDLE
    assigned_order_id: Optional[str] = None
    rate_per_hour: float = Field(default=50.0, description="Base production rate per hour in output_unit")
    efficiency: float = Field(default=0.90, ge=0.0, le=1.0, description="Operational efficiency factor")
    maintenance_state: str = Field(default="nominal", description="e.g. nominal, inspection_due, overdue")
    output_unit: str = "meters"
    last_updated_at: datetime
    source: str = "simulator"
    downtime_reason: Optional[str] = None
    setup_remaining_minutes: int = 0
    total_operating_minutes: float = 0.0
    total_downtime_minutes: float = 0.0
    accumulated_output: float = 0.0
    defect_multiplier: float = 1.0


class MaterialBatch(BaseModel):
    """In-transit or delivered shipment batch of raw materials."""
    batch_id: str
    material_id: str
    quantity: float
    expected_arrival: datetime
    status: str = "in_transit"  # in_transit, arrived, delayed


class MaterialInventory(BaseModel):
    """Virtual inventory stock item with rigorous availability accounting."""
    material_id: str
    name: str
    unit: str  # kg, meters, liters
    total_stock: float = Field(ge=0.0)
    reserved_stock: float = Field(default=0.0, ge=0.0)
    incoming_batches: List[MaterialBatch] = Field(default_factory=list)
    source: str = "simulator"

    @computed_field
    @property
    def available_stock(self) -> float:
        """Unreserved material immediately available for allocation."""
        return max(0.0, self.total_stock - self.reserved_stock)


class FabricRoll(BaseModel):
    """Simulated manufactured roll of inspected fabric."""
    roll_id: str
    order_id: str
    machine_id: str
    length_meters: float
    defect_count: int = 0
    grade: str = "A"  # A, B, C, Scrap
    status: str = "uninspected"  # uninspected, pass, rework, rejected
    created_at: datetime
    source: str = "simulator"


class ProductionOrder(BaseModel):
    """Textile customer production work order."""
    order_id: str
    customer_name: str
    fabric_type: str
    ordered_quantity: float = Field(gt=0.0)
    produced_quantity: float = Field(default=0.0, ge=0.0)
    unit: str = "meters"
    stages_required: List[str] = Field(
        default_factory=lambda: [
            "raw_material_prep",
            "weaving",
            "dyeing_finishing",
            "inspection",
            "roll_creation",
        ]
    )
    current_stage: str = "weaving"
    stage_progress: Dict[str, float] = Field(default_factory=dict)
    deadline: datetime
    created_at: datetime
    status: OrderStatus = OrderStatus.PENDING
    priority: OrderPriority = OrderPriority.NORMAL
    required_materials: Dict[str, float] = Field(
        default_factory=dict, description="material_id -> quantity needed per total order"
    )
    reserved_materials: Dict[str, float] = Field(
        default_factory=dict, description="material_id -> currently reserved quantity"
    )
    assigned_machine_ids: List[str] = Field(default_factory=list)
    source: str = "simulator"


class SimEvent(BaseModel):
    """Structured, replay-safe simulation event."""
    event_id: str
    event_type: str
    machine_id: Optional[str] = None
    production_order_id: Optional[str] = None
    timestamp: datetime
    source: str = "simulator"
    details: Dict[str, Any] = Field(default_factory=dict)
    idempotency_key: Optional[str] = None
