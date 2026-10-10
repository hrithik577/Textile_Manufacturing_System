import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.production import Machine, MachineEvent, MachineStatus, ProductionOrder
from app.models.alert import Alert, AlertCategory, AlertSeverity, AlertStatus
from app.core.exceptions import NotFoundException
from app.schemas.machine import (
    MachineItem,
    MachineListResponse,
    MachineHistoryResponse,
    MachineEventCreate,
    MachineEventRead,
)
from app.services.production_service import (
    get_machines,
    get_machine_by_id,
    get_machine_history,
    record_machine_event,
)

router = APIRouter(prefix="/machines", tags=["Machines"])


@router.get("", response_model=MachineListResponse, summary="List factory machines and live telemetry status")
def list_machines(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns machines with status, active order, speed, output, and data provenance."""
    items = get_machines(db)
    return MachineListResponse(items=items, total=len(items))


@router.patch("/{machine_id}/status", summary="Update machine status & log event in PostgreSQL")
def update_machine_status(
    machine_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Updates machine status mid-shift, records downtime/stoppage events, and triggers alerts in PostgreSQL."""
    machine = get_machine_by_id(db, machine_id)
    new_status_str = payload.get("status")
    reason = payload.get("reason")

    if new_status_str:
        try:
            machine.status = MachineStatus(new_status_str.lower())
        except ValueError:
            pass

    if reason is not None:
        machine.downtime_reason = reason

    # Speed & output telemetry adjustments based on status
    if machine.status == MachineStatus.RUNNING:
        machine.downtime_reason = None
        if not machine.current_speed_rpm or machine.current_speed_rpm == 0:
            machine.current_speed_rpm = 820.0 if "airjet" in machine.name.lower() else (650.0 if "rapier" in machine.name.lower() else 250.0)
    elif machine.status in [MachineStatus.BREAKDOWN, MachineStatus.MAINTENANCE, MachineStatus.IDLE]:
        machine.current_speed_rpm = 0.0

    machine.last_heartbeat = datetime.now(timezone.utc)

    # Record MachineEvent in PostgreSQL
    event = MachineEvent(
        event_id=f"EVT-{uuid.uuid4().hex[:12].upper()}",
        machine_id=machine.id,
        production_order_id=machine.active_production_order_id,
        event_type="status_change" if machine.status == MachineStatus.RUNNING else "downtime_start",
        start_time=datetime.now(timezone.utc),
        downtime_reason=reason,
    )
    db.add(event)

    # If breakdown, create Alert in PostgreSQL
    if machine.status == MachineStatus.BREAKDOWN:
        alert = Alert(
            category=AlertCategory.MACHINE_BREAKDOWN,
            severity=AlertSeverity.HIGH,
            title=f"Machine Breakdown: {machine.name} ({machine.machine_code})",
            description=reason or "Mid-shift machine stoppage reported on weaving floor. Immediate mechanical attention required.",
            entity_type="machine",
            entity_id=machine.machine_code,
            status=AlertStatus.ACTIVE,
        )
        db.add(alert)

    db.commit()
    db.refresh(machine)
    return {
        "success": True,
        "machine_id": machine.machine_code,
        "status": machine.status.value,
        "speed_rpm": machine.current_speed_rpm,
        "downtime_reason": machine.downtime_reason,
        "shift_output_m": machine.shift_output_m,
    }


@router.post("/{machine_id}/mount-order", summary="Mount sales/production order on machine")
def mount_order_on_machine(
    machine_id: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Mounts a specific production/sales order on a loom or dyeing vat."""
    machine = get_machine_by_id(db, machine_id)
    po_id = payload.get("production_order_id")

    if po_id:
        po = db.query(ProductionOrder).filter(ProductionOrder.id == int(po_id)).first()
        if po:
            machine.active_production_order_id = po.id
            machine.status = MachineStatus.RUNNING
            if not machine.current_speed_rpm or machine.current_speed_rpm == 0:
                machine.current_speed_rpm = 750.0

    db.commit()
    db.refresh(machine)
    return {
        "success": True,
        "machine_id": machine.machine_code,
        "active_production_order_id": machine.active_production_order_id,
        "status": machine.status.value,
    }


@router.get("/{machine_id}/history", response_model=MachineHistoryResponse, summary="Get machine event history")
def get_history(
    machine_id: str,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    machine, events = get_machine_history(db, machine_id, limit=limit)
    return MachineHistoryResponse(
        machine_id=machine.machine_code,
        name=machine.name,
        events=[MachineEventRead.model_validate(e) for e in events],
        total_events=len(events),
    )


@router.post("/{machine_id}/events", response_model=MachineEventRead, status_code=status.HTTP_201_CREATED, summary="Record machine event")
def add_event(
    machine_id: str,
    event_in: MachineEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    event, _ = record_machine_event(db, event_in, current_user)
    return MachineEventRead.model_validate(event)

