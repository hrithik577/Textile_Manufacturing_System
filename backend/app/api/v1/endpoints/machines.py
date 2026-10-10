from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
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
