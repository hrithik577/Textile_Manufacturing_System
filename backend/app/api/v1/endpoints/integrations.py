from typing import Dict, Any
from fastapi import APIRouter, Depends, Header, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import verify_simulator_secret
from app.schemas.simulator import (
    SimulatorEventPayload,
    SimulatorBatchPayload,
    SimulatorIngestionResult,
    SimulatorIngestionResponse,
)
from app.schemas.alert import RecoveryPlanCreate, RecoveryPlanRead
from app.integrations.simulator import ingest_simulator_event, ingest_simulator_batch
from app.integrations.intelligence import get_intelligence_context, submit_intelligence_recovery_plan

router = APIRouter(prefix="/integrations", tags=["Member 3 Integrations (Simulator & Intelligence)"])


@router.post(
    "/simulator/event",
    response_model=SimulatorIngestionResult,
    summary="Ingest single telemetry event from Virtual Factory Simulator",
)
def handle_simulator_event(
    payload: SimulatorEventPayload,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_simulator_secret),
):
    """Idempotent ingestion endpoint for simulator events, updating machine state and triggering alerts."""
    return ingest_simulator_event(db, payload)


@router.post(
    "/simulator/batch",
    response_model=SimulatorIngestionResponse,
    summary="Ingest batch telemetry events from Virtual Factory Simulator",
)
def handle_simulator_batch(
    payload: SimulatorBatchPayload,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_simulator_secret),
):
    """Batch ingestion endpoint for simulated production shifts and telemetry bursts."""
    return ingest_simulator_batch(db, payload)


@router.get(
    "/intelligence/context",
    summary="Fetch operational context for AI Intelligence Engine",
)
def get_ai_context(
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_simulator_secret),
) -> Dict[str, Any]:
    """Exposes current order deadlines, machine bottleneck statuses, low-stock materials, and open alerts."""
    return get_intelligence_context(db)


@router.post(
    "/intelligence/recommendations",
    response_model=RecoveryPlanRead,
    status_code=status.HTTP_201_CREATED,
    summary="Submit AI-generated recovery recommendation",
)
def submit_ai_recommendation(
    plan_in: RecoveryPlanCreate,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_simulator_secret),
):
    """Accepts structured recovery proposal from Member 3's intelligence algorithms for review."""
    plan = submit_intelligence_recovery_plan(db, plan_in)
    return RecoveryPlanRead.model_validate(plan)
