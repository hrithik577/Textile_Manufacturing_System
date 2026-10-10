from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.production import MachineStatus, ProcessType, DataSourceType


class MachineEventCreate(BaseModel):
    event_id: str
    machine_id: int
    production_order_id: Optional[int] = None
    event_type: str # state_change, speed_change, downtime_start, downtime_end, maintenance, heartbeat
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    downtime_reason: Optional[str] = None
    data_source: DataSourceType = DataSourceType.SIMULATOR
    details: Optional[Dict[str, Any]] = None


class MachineEventRead(BaseModel):
    id: int
    event_id: str
    machine_id: int
    production_order_id: Optional[int] = None
    event_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    downtime_reason: Optional[str] = None
    data_source: DataSourceType
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MachineItem(BaseModel):
    id: int
    machine_id: str # machine_code e.g. "M-001"
    machine_code: str
    name: str
    process: str # e.g. "weaving"
    process_type: ProcessType
    status: MachineStatus
    current_order_id: Optional[str] = None # e.g. "PO-001"
    active_production_order_id: Optional[int] = None
    current_speed_rpm: float = 0.0
    shift_output_m: float = 0.0
    downtime_reason: Optional[str] = None
    data_source: DataSourceType = DataSourceType.SIMULATOR
    last_heartbeat: Optional[datetime] = None
    last_updated: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MachineListResponse(BaseModel):
    items: List[MachineItem]
    total: int


class MachineHistoryResponse(BaseModel):
    machine_id: str
    name: str
    events: List[MachineEventRead]
    total_events: int
