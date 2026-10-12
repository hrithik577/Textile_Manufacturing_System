"""
Rescue Engine API — aggregates Alerts + Recovery Plans into a rich
RescueIssue response shape that the frontend Rescue Engine™ page expects.
"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.alert import Alert, AlertStatus, AlertCategory, AlertSeverity, ApprovalStatus, ExecutionStatus, RecoveryPlan
from app.models.order import SalesOrder
from app.models.production import Machine
from pydantic import BaseModel, ConfigDict, Field
from typing import Any, Dict

router = APIRouter(prefix="/rescue-engine", tags=["Rescue Engine"])


# ─── Pydantic response models matching the frontend RescueIssue shape ────────

class RecoveryPlanOut(BaseModel):
    id: str
    planCode: str
    title: str
    summary: str
    strategyDescription: str
    estimatedDelayChangeDays: float
    estimatedCostUsd: float
    riskLevel: str
    feasibilityScorePercent: int
    steps: List[str]
    pros: List[str]
    cons: List[str]
    requiredApprovals: List[str]


class ImpactAnalysis(BaseModel):
    delayDays: float
    costImpactUsd: float
    orderAtRisk: str
    description: str


class RescueIssueOut(BaseModel):
    id: str
    issueCode: str
    title: str
    severity: str
    category: str
    affectedOrderId: Optional[str] = None
    affectedOrderNumber: Optional[str] = None
    customerName: Optional[str] = None
    affectedMachineId: Optional[str] = None
    affectedMachineName: Optional[str] = None
    detectionTime: str
    evidence: List[str]
    likelyCause: str
    impactAnalysis: ImpactAnalysis
    status: str
    recoveryPlans: List[RecoveryPlanOut]
    selectedPlanId: Optional[str] = None
    executionStatus: Optional[str] = None
    approvedBy: Optional[str] = None
    approvedAt: Optional[str] = None
    resolutionNotes: Optional[str] = None


class ApprovePlanRequest(BaseModel):
    planId: str
    approverName: str
    notes: Optional[str] = None


class RejectPlanRequest(BaseModel):
    planId: str
    reason: str


def _severity_map(s: AlertSeverity) -> str:
    return s.value  # critical, high, medium, low


def _category_map(c: AlertCategory) -> str:
    mapping = {
        AlertCategory.MACHINE_BREAKDOWN: "machine_breakdown",
        AlertCategory.QUALITY_DEFECT_SPIKE: "quality_spike",
        AlertCategory.INVENTORY_SHORTAGE: "material_shortage",
        AlertCategory.PRODUCTION_DELAY: "deadline_bottleneck",
        AlertCategory.COST_OVERRUN: "capacity_conflict",
    }
    return mapping.get(c, "machine_breakdown")


def _status_map(alert: Alert) -> str:
    """Map DB alert + plan approval status to frontend RescueStatus."""
    plans = alert.recovery_plans
    if alert.status == AlertStatus.RESOLVED:
        return "resolved"
    if not plans:
        return "detected"
    approved = [p for p in plans if p.approval_status == ApprovalStatus.APPROVED]
    if approved:
        in_exec = [p for p in approved if p.execution_status == ExecutionStatus.IN_PROGRESS]
        if in_exec:
            return "in_execution"
        return "approved"
    pending = [p for p in plans if p.approval_status == ApprovalStatus.PENDING]
    if pending:
        return "evaluating"
    return "detected"


def _plan_to_out(plan: RecoveryPlan) -> RecoveryPlanOut:
    """Convert a DB RecoveryPlan to a frontend RecoveryPlanOut."""
    actions = plan.proposed_actions or []
    steps = [a.get("description", a.get("type", str(a))) for a in actions if isinstance(a, dict)]
    if not steps:
        steps = ["Review the situation", "Execute mitigation", "Monitor results"]

    risk_raw_full = plan.risk_assessment or ""
    risk_parts = risk_raw_full.split(";")
    risk_raw = risk_parts[0].strip()  # e.g. "low" or "medium" or "high"

    pros: List[str] = []
    cons: List[str] = []
    req_approvals: List[str] = ["Plant Manager"]

    for part in risk_parts[1:]:
        if part.startswith("pros:"):
            pros = [p.strip() for p in part[5:].split("|") if p.strip()]
        elif part.startswith("cons:"):
            cons = [c.strip() for c in part[5:].split("|") if c.strip()]
        elif part.startswith("approvals:"):
            req_approvals = [a.strip() for a in part[10:].split("|") if a.strip()]

    # Parse feasibility from risk_assessment prefix if encoded, else derive from risk level
    feasibility = 90 if risk_raw.startswith("low") else (75 if risk_raw.startswith("medium") else 60)

    delay_days = -(plan.estimated_delay_reduction_hours or 0) / 24
    cost = plan.estimated_cost_impact or 0.0

    return RecoveryPlanOut(
        id=f"plan-{plan.id}",
        planCode=f"PLAN-{chr(64 + (plan.id % 26 or 1))} (Recovery Option {plan.id})",
        title=plan.title,
        summary=plan.description[:200] if plan.description else plan.title,
        strategyDescription=plan.expected_outcome,
        estimatedDelayChangeDays=round(delay_days, 1),
        estimatedCostUsd=round(cost, 0),
        riskLevel=risk_raw.split()[0] if risk_raw else "medium",
        feasibilityScorePercent=feasibility,
        steps=steps,
        pros=pros if pros else [plan.expected_outcome[:120]],
        cons=cons if cons else ["Requires management approval", "Minor operational disruption"],
        requiredApprovals=req_approvals,
    )


def _alert_to_rescue_issue(alert: Alert, db: Session) -> RescueIssueOut:
    """Convert a DB Alert (with plans eagerly loaded) to RescueIssueOut."""
    # Find linked sales order from entity_id if entity_type is 'order'
    affected_order_number = None
    customer_name = None
    affected_order_id = None
    if alert.entity_type == "order" and alert.entity_id:
        so = db.query(SalesOrder).filter(SalesOrder.order_number == alert.entity_id).first()
        if so:
            affected_order_number = so.order_number
            customer_name = so.customer.name if so.customer else None
            affected_order_id = str(so.id)

    # Machine info
    affected_machine_id = None
    affected_machine_name = None
    if alert.entity_type == "machine" and alert.entity_id:
        m = db.query(Machine).filter(Machine.machine_code == alert.entity_id).first()
        if m:
            affected_machine_id = m.machine_code
            affected_machine_name = m.name

    # Derive evidence from alert description
    evidence = [alert.description]
    if alert.entity_type == "machine" and alert.entity_id:
        evidence.append(f"Affected machine: {alert.entity_id}")
    if alert.entity_type == "material" and alert.entity_id:
        evidence.append(f"Affected material SKU: {alert.entity_id}")

    # Plans
    plans_out = [_plan_to_out(p) for p in (alert.recovery_plans or [])]
    selected_plan_id = None
    approved_by = None
    approved_at = None
    exec_status_str = None

    approved_plans = [p for p in alert.recovery_plans if p.approval_status == ApprovalStatus.APPROVED]
    if approved_plans:
        ap = approved_plans[0]
        selected_plan_id = f"plan-{ap.id}"
        if ap.approved_by:
            approved_by = ap.approved_by.full_name if hasattr(ap.approved_by, "full_name") else ap.approved_by.email
        if ap.approved_at:
            approved_at = ap.approved_at.strftime("%Y-%m-%d %H:%M")
        exec_status_str = f"Plan approved. Execution status: {ap.execution_status.value}"

    cost_impact = sum(p.estimated_cost_impact or 0 for p in alert.recovery_plans) or 5000.0
    delay_hours = max((p.estimated_delay_reduction_hours or 0) for p in alert.recovery_plans) if alert.recovery_plans else 48.0

    return RescueIssueOut(
        id=f"alert-{alert.id}",
        issueCode=f"RESCUE-{alert.created_at.year}-{alert.id:03d}",
        title=alert.title,
        severity=_severity_map(alert.severity),
        category=_category_map(alert.category),
        affectedOrderId=affected_order_id,
        affectedOrderNumber=affected_order_number,
        customerName=customer_name,
        affectedMachineId=affected_machine_id,
        affectedMachineName=affected_machine_name,
        detectionTime=alert.created_at.strftime("%Y-%m-%d %I:%M %p"),
        evidence=evidence,
        likelyCause=alert.description,
        impactAnalysis=ImpactAnalysis(
            delayDays=round(delay_hours / 24, 1),
            costImpactUsd=round(cost_impact, 0),
            orderAtRisk=affected_order_number or alert.entity_id or "N/A",
            description=f"Alert category: {alert.category.value}. Immediate intervention required to prevent operational delay.",
        ),
        status=_status_map(alert),
        recoveryPlans=plans_out,
        selectedPlanId=selected_plan_id,
        executionStatus=exec_status_str,
        approvedBy=approved_by,
        approvedAt=approved_at,
    )


@router.get("/issues", response_model=List[RescueIssueOut], summary="List all active rescue issues (alerts + recovery plans)")
def list_rescue_issues(
    status: Optional[str] = Query(None, description="Filter by rescue status: detected, evaluating, approved, resolved"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = (
        db.query(Alert)
        .options(
            joinedload(Alert.recovery_plans).joinedload(RecoveryPlan.approved_by)
        )
        .filter(Alert.status != AlertStatus.DISMISSED)
        .order_by(Alert.severity.desc(), Alert.created_at.desc())
    )
    alerts = query.all()
    issues = [_alert_to_rescue_issue(a, db) for a in alerts]

    if status:
        issues = [i for i in issues if i.status == status]

    return issues


@router.get("/issues/{issue_id}", response_model=RescueIssueOut, summary="Get a single rescue issue by ID")
def get_rescue_issue(
    issue_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # issue_id is formatted as "alert-{int}"
    try:
        alert_id = int(issue_id.replace("alert-", ""))
    except ValueError:
        raise HTTPException(status_code=404, detail="Issue not found")

    alert = (
        db.query(Alert)
        .options(joinedload(Alert.recovery_plans).joinedload(RecoveryPlan.approved_by))
        .filter(Alert.id == alert_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Issue not found")
    return _alert_to_rescue_issue(alert, db)


@router.post("/issues/{issue_id}/approve-plan", summary="Approve a recovery plan for a rescue issue")
def approve_plan(
    issue_id: str,
    req: ApprovePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    try:
        plan_id = int(req.planId.replace("plan-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    plan.approval_status = ApprovalStatus.APPROVED
    plan.approved_by_id = current_user.id
    plan.approved_at = datetime.now(timezone.utc)
    plan.execution_status = ExecutionStatus.IN_PROGRESS
    plan.execution_notes = req.notes

    db.commit()
    return {"success": True, "message": f"Plan {req.planId} approved by {current_user.email}"}


@router.post("/issues/{issue_id}/reject-plan", summary="Reject a recovery plan")
def reject_plan(
    issue_id: str,
    req: RejectPlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    try:
        plan_id = int(req.planId.replace("plan-", ""))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    plan = db.query(RecoveryPlan).filter(RecoveryPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Recovery plan not found")

    plan.approval_status = ApprovalStatus.REJECTED
    plan.execution_notes = f"Rejected: {req.reason}"
    db.commit()
    return {"success": True, "message": f"Plan {req.planId} rejected"}
