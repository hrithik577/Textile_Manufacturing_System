from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.alert import ApprovalStatus, ExecutionStatus
from app.schemas.alert import (
    RecoveryPlanRead,
    RecoveryPlanCreate,
    RecoveryPlanApproveRequest,
    RecoveryPlanExecuteRequest,
)
from app.services.recovery_service import (
    get_recovery_plans,
    get_recovery_plan_by_id,
    create_recovery_plan,
    approve_recovery_plan,
    execute_recovery_plan,
)

router = APIRouter(prefix="/recovery-plans", tags=["Rescue Engine & Recovery Plans"])


@router.get("", response_model=List[RecoveryPlanRead], summary="List AI recovery and mitigation plans")
def list_plans(
    alert_id: Optional[int] = Query(None),
    approval_status: Optional[ApprovalStatus] = Query(None),
    execution_status: Optional[ExecutionStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_recovery_plans(
        db,
        alert_id=alert_id,
        approval_status=approval_status,
        execution_status=execution_status,
        skip=skip,
        limit=limit,
    )
    return [RecoveryPlanRead.model_validate(p) for p in items]


@router.post("", response_model=RecoveryPlanRead, status_code=status.HTTP_201_CREATED, summary="Create an AI recovery plan proposal")
def add_plan(
    plan_in: RecoveryPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    plan = create_recovery_plan(db, plan_in, current_user)
    return RecoveryPlanRead.model_validate(plan)


@router.get("/{plan_id}", response_model=RecoveryPlanRead, summary="Get recovery plan by ID")
def get_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    plan = get_recovery_plan_by_id(db, plan_id)
    return RecoveryPlanRead.model_validate(plan)


@router.post("/{plan_id}/approve", response_model=RecoveryPlanRead, summary="Approve or reject a recovery plan")
def approve_plan(
    plan_id: int,
    approve_in: RecoveryPlanApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    """Authorizes the recovery plan. Proposing an action does NOT automatically execute it."""
    plan = approve_recovery_plan(db, plan_id, approve_in, current_user)
    return RecoveryPlanRead.model_validate(plan)


@router.post("/{plan_id}/execute", response_model=RecoveryPlanRead, summary="Execute approved recovery plan actions")
def execute_plan(
    plan_id: int,
    exec_in: RecoveryPlanExecuteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    """Executes the approved mitigation action (e.g. reroutes orders, dispatches technicians, reallocates stock)."""
    plan = execute_recovery_plan(db, plan_id, exec_in, current_user)
    return RecoveryPlanRead.model_validate(plan)
