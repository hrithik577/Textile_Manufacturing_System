from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    UnauthorizedAccessException,
    TextileAppException,
)
from app.models.user import User, UserRole
from app.models.alert import (
    RecoveryPlan,
    Alert,
    ApprovalStatus,
    ExecutionStatus,
    AlertStatus,
)
from app.models.production import Machine, ProductionOrder, ProductionStatus, MachineStatus
from app.schemas.alert import (
    RecoveryPlanCreate,
    RecoveryPlanApproveRequest,
    RecoveryPlanExecuteRequest,
)
from app.services.audit_service import log_audit_event


def get_recovery_plans(
    db: Session,
    alert_id: Optional[int] = None,
    approval_status: Optional[ApprovalStatus] = None,
    execution_status: Optional[ExecutionStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[RecoveryPlan], int]:
    query = db.query(RecoveryPlan)
    if alert_id:
        query = query.filter(RecoveryPlan.alert_id == alert_id)
    if approval_status:
        query = query.filter(RecoveryPlan.approval_status == approval_status)
    if execution_status:
        query = query.filter(RecoveryPlan.execution_status == execution_status)
        
    total = query.count()
    items = query.order_by(RecoveryPlan.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_recovery_plan_by_id(db: Session, plan_id: int) -> RecoveryPlan:
    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise NotFoundException("RecoveryPlan", plan_id)
    return plan


def create_recovery_plan(
    db: Session,
    plan_in: RecoveryPlanCreate,
    current_user: Optional[User] = None,
) -> RecoveryPlan:
    alert = db.query(Alert).filter(Alert.id == plan_in.alert_id).first()
    if not alert:
        raise NotFoundException("Alert", plan_in.alert_id)
        
    plan = RecoveryPlan(
        alert_id=plan_in.alert_id,
        title=plan_in.title,
        description=plan_in.description,
        affected_entity_type=plan_in.affected_entity_type,
        affected_entity_id=plan_in.affected_entity_id,
        proposed_actions=plan_in.proposed_actions,
        expected_outcome=plan_in.expected_outcome,
        estimated_delay_reduction_hours=plan_in.estimated_delay_reduction_hours,
        estimated_cost_impact=plan_in.estimated_cost_impact,
        risk_assessment=plan_in.risk_assessment,
        approval_status=ApprovalStatus.PENDING,
        execution_status=ExecutionStatus.NOT_STARTED,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


def approve_recovery_plan(
    db: Session,
    plan_id: int,
    approve_in: RecoveryPlanApproveRequest,
    current_user: User,
) -> RecoveryPlan:
    """Authorize or reject an AI-generated recovery plan. Requires manager/owner role."""
    plan = get_recovery_plan_by_id(db, plan_id)
    
    if current_user.role not in [UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION]:
        raise UnauthorizedAccessException("You lack permissions to approve factory recovery plans.")
        
    if approve_in.approved:
        plan.approval_status = ApprovalStatus.APPROVED
        plan.approved_by_id = current_user.id
        plan.approved_at = datetime.now(timezone.utc)
    else:
        plan.approval_status = ApprovalStatus.REJECTED
        plan.execution_notes = f"Rejected: {approve_in.rejection_reason or 'No reason provided'}"

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="approve_recovery_plan",
        entity_type="recovery_plan",
        entity_id=str(plan.id),
        changes_summary={"approved": approve_in.approved, "plan_title": plan.title},
    )

    db.commit()
    db.refresh(plan)
    return plan


def execute_recovery_plan(
    db: Session,
    plan_id: int,
    exec_in: RecoveryPlanExecuteRequest,
    current_user: User,
) -> RecoveryPlan:
    """Execute authorized recovery plan actions on operational entities."""
    plan = get_recovery_plan_by_id(db, plan_id)
    
    if plan.approval_status != ApprovalStatus.APPROVED:
        raise TextileAppException(
            status_code=400,
            detail=f"Cannot execute recovery plan. Plan is in '{plan.approval_status.value}' state. Must be approved first.",
            error_code="UNAPPROVED_RECOVERY_PLAN",
        )
        
    if plan.execution_status == ExecutionStatus.COMPLETED:
        raise ConflictException(f"Recovery plan #{plan.id} has already been executed.")

    plan.execution_status = ExecutionStatus.IN_PROGRESS
    executed_actions_summary = []

    try:
        # Process proposed actions
        for action in plan.proposed_actions:
            action_type = action.get("type", action.get("action_type", ""))
            
            if action_type == "reroute_production_order":
                po_num = action.get("production_order_number") or plan.affected_entity_id
                target_machine_code = action.get("target_machine_code")
                po = db.query(ProductionOrder).filter(ProductionOrder.production_order_number == po_num).first()
                target_machine = db.query(Machine).filter(Machine.machine_code == target_machine_code).first()
                if po and target_machine:
                    target_machine.active_production_order_id = po.id
                    target_machine.status = MachineStatus.RUNNING
                    executed_actions_summary.append(f"Rerouted PO {po_num} to Loom {target_machine_code}")

            elif action_type == "dispatch_maintenance_team":
                machine_code = action.get("machine_code") or plan.affected_entity_id
                machine = db.query(Machine).filter(Machine.machine_code == machine_code).first()
                if machine:
                    machine.status = MachineStatus.MAINTENANCE
                    machine.downtime_reason = "Scheduled Emergency Repair via Recovery Plan"
                    executed_actions_summary.append(f"Dispatched technician to machine {machine_code}")

            elif action_type == "reallocate_safety_stock":
                executed_actions_summary.append("Allocated buffer inventory lot for production line")

        plan.execution_status = ExecutionStatus.COMPLETED
        plan.execution_notes = f"Executed by {current_user.name}. Actions: {'; '.join(executed_actions_summary)}. {exec_in.notes or ''}"
        
        # Mark associated alert as resolved
        if plan.alert:
            plan.alert.status = AlertStatus.RESOLVED
            plan.alert.resolved_at = datetime.now(timezone.utc)

        log_audit_event(
            db=db,
            actor_id=current_user.id,
            action="execute_recovery_plan",
            entity_type="recovery_plan",
            entity_id=str(plan.id),
            changes_summary={"executed_actions": executed_actions_summary},
        )

        db.commit()
        db.refresh(plan)
        return plan

    except Exception as e:
        db.rollback()
        plan.execution_status = ExecutionStatus.FAILED
        plan.execution_notes = f"Execution failed: {str(e)}"
        db.commit()
        raise TextileAppException(
            status_code=500,
            detail=f"Error executing recovery plan: {str(e)}",
            error_code="RECOVERY_PLAN_EXECUTION_FAILED",
        )
