from typing import Dict, Any, List
from sqlalchemy.orm import Session
from datetime import date
from app.models.order import SalesOrder, OrderStatus
from app.models.production import ProductionOrder, ProductionStatus, Machine, MachineStatus
from app.models.inventory import Material
from app.models.quality import FabricRoll, QualityInspection, RollStatus
from app.models.alert import Alert, AlertStatus, RecoveryPlan, ApprovalStatus, ExecutionStatus
from app.schemas.alert import RecoveryPlanCreate


def get_intelligence_context(db: Session) -> Dict[str, Any]:
    """Provide high-dimensional factory context for Member 3's Intelligence & Optimization Engine."""
    today = date.today()
    
    # 1. Orders at risk of delay
    active_orders = db.query(SalesOrder).filter(SalesOrder.status.in_([OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION])).all()
    orders_data = []
    for o in active_orders:
        days_left = (o.required_delivery_date - today).days
        orders_data.append({
            "order_id": o.id,
            "order_number": o.order_number,
            "required_delivery_date": str(o.required_delivery_date),
            "days_until_deadline": days_left,
            "priority": o.priority.value,
            "status": o.status.value,
        })

    # 2. Machine Bottlenecks
    machines = db.query(Machine).all()
    machines_data = []
    for m in machines:
        machines_data.append({
            "machine_code": m.machine_code,
            "name": m.name,
            "process": m.process_type.value,
            "status": m.status.value,
            "active_po": m.active_production_order.production_order_number if m.active_production_order else None,
            "speed_rpm": m.current_speed_rpm,
            "shift_output_m": m.shift_output_m,
            "downtime_reason": m.downtime_reason,
        })

    # 3. Material Availability & Deficits
    materials = db.query(Material).all()
    materials_data = []
    for mat in materials:
        materials_data.append({
            "material_code": mat.material_code,
            "name": mat.name,
            "current_stock": mat.current_stock,
            "reorder_threshold": mat.reorder_threshold,
            "is_low_stock": mat.current_stock <= mat.reorder_threshold,
            "unit": mat.unit,
        })

    # 4. Active Alerts
    alerts = db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).all()
    alerts_data = [
        {
            "alert_id": a.id,
            "category": a.category.value,
            "severity": a.severity.value,
            "title": a.title,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
        }
        for a in alerts
    ]

    return {
        "timestamp": str(today),
        "active_orders": orders_data,
        "machines": machines_data,
        "materials": materials_data,
        "active_alerts": alerts_data,
    }


def submit_intelligence_recovery_plan(
    db: Session,
    plan_in: RecoveryPlanCreate,
) -> RecoveryPlan:
    """Accept and persist an AI-generated recovery plan from Member 3's Intelligence Engine."""
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
