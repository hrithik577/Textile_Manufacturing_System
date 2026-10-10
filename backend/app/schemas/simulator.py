from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class SimulatorEventPayload(BaseModel):
    event_id: str = Field(description="Unique event ID for idempotency")
    machine_id: str = Field(description="Machine code e.g. 'M-001' or integer ID")
    production_order_id: Optional[str] = Field(default=None, description="Production order number e.g. 'PO-001' or ID")
    event_type: str = Field(description="e.g. 'output_update', 'state_change', 'speed_change', 'downtime_start', 'downtime_end', 'defect_detected', 'heartbeat'")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Operational telemetry
    status: Optional[str] = None # e.g. "running", "stopped", "breakdown", "idle"
    output_quantity: Optional[float] = 0.0
    unit: Optional[str] = "m"
    current_speed_rpm: Optional[float] = None
    downtime_reason: Optional[str] = None
    
    # Provenance
    source: str = Field(default="simulator", description="Must be 'simulator', 'sensor', or 'manual'")
    details: Optional[Dict[str, Any]] = None


class SimulatorBatchPayload(BaseModel):
    events: List[SimulatorEventPayload]


class SimulatorIngestionResult(BaseModel):
    event_id: str
    status: str # "processed", "duplicate_skipped", "error"
    message: str
    machine_state: Optional[dict] = None
    alert_generated: Optional[dict] = None


class SimulatorIngestionResponse(BaseModel):
    total_received: int
    processed_count: int
    duplicates_skipped: int
    errors_count: int
    results: List[SimulatorIngestionResult]
