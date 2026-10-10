from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ConflictException
from app.models.user import User
from app.models.production import (
    ProductionOrder,
    ProductionOperation,
    Machine,
    MachineEvent,
    ProductionEvent,
    ProductionStatus,
    MachineStatus,
    DataSourceType,
)
from app.schemas.production import (
    ProductionOrderCreate,
    ProductionEventCreate,
)
from app.schemas.machine import MachineEventCreate, MachineItem
from app.services.audit_service import log_audit_event


def get_production_orders(
    db: Session,
    status: Optional[ProductionStatus] = None,
    sales_order_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[ProductionOrder], int]:
    query = db.query(ProductionOrder)
    if status:
        query = query.filter(ProductionOrder.status == status)
    if sales_order_id:
        query = query.filter(ProductionOrder.sales_order_id == sales_order_id)
        
    total = query.count()
    items = query.order_by(ProductionOrder.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_production_order_by_id(db: Session, po_id: int) -> ProductionOrder:
    po = db.query(ProductionOrder).filter(ProductionOrder.id == po_id).first()
    if not po:
        raise NotFoundException("ProductionOrder", po_id)
    return po


def create_production_order(
    db: Session,
    po_in: ProductionOrderCreate,
    current_user: User,
) -> ProductionOrder:
    existing = db.query(ProductionOrder).filter(ProductionOrder.production_order_number == po_in.production_order_number).first()
    if existing:
        raise ConflictException(f"Production Order '{po_in.production_order_number}' already exists.")
        
    po = ProductionOrder(
        production_order_number=po_in.production_order_number,
        sales_order_id=po_in.sales_order_id,
        target_quantity=po_in.target_quantity,
        unit=po_in.unit,
        status=ProductionStatus.SCHEDULED,
        planned_start_date=po_in.planned_start_date,
        planned_end_date=po_in.planned_end_date,
        notes=po_in.notes,
    )
    
    if po_in.operations:
        for op in po_in.operations:
            po.operations.append(
                ProductionOperation(
                    process_name=op.process_name,
                    sequence=op.sequence,
                    machine_id=op.machine_id,
                    planned_quantity=op.planned_quantity,
                    actual_quantity=op.actual_quantity,
                    status=op.status,
                )
            )
    else:
        # Default standard textile operations
        po.operations.extend([
            ProductionOperation(process_name="Warping & Sizing", sequence=1, planned_quantity=po_in.target_quantity),
            ProductionOperation(process_name="Weaving", sequence=2, planned_quantity=po_in.target_quantity),
            ProductionOperation(process_name="Quality Inspection", sequence=3, planned_quantity=po_in.target_quantity),
        ])
        
    db.add(po)
    db.flush()
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="create_production_order",
        entity_type="production_order",
        entity_id=str(po.id),
        changes_summary={"po_number": po.production_order_number, "target_quantity": po.target_quantity},
    )
    
    db.commit()
    db.refresh(po)
    return po


def get_machines(db: Session) -> List[MachineItem]:
    machines = db.query(Machine).all()
    result = []
    for m in machines:
        current_order_no = None
        if m.active_production_order:
            current_order_no = m.active_production_order.production_order_number
            
        result.append(
            MachineItem(
                id=m.id,
                machine_id=m.machine_code,
                machine_code=m.machine_code,
                name=m.name,
                process=m.process_type.value,
                process_type=m.process_type,
                status=m.status,
                current_order_id=current_order_no,
                active_production_order_id=m.active_production_order_id,
                current_speed_rpm=m.current_speed_rpm or 0.0,
                shift_output_m=m.shift_output_m or 0.0,
                downtime_reason=m.downtime_reason,
                data_source=m.data_source,
                last_heartbeat=m.last_heartbeat,
                last_updated=m.updated_at,
                created_at=m.created_at,
            )
        )
    return result


def get_machine_by_id(db: Session, machine_id_or_code: str) -> Machine:
    if machine_id_or_code.isdigit():
        machine = db.query(Machine).filter(Machine.id == int(machine_id_or_code)).first()
    else:
        machine = db.query(Machine).filter(Machine.machine_code == machine_id_or_code).first()
        
    if not machine:
        raise NotFoundException("Machine", machine_id_or_code)
    return machine


def get_machine_history(db: Session, machine_id_or_code: str, limit: int = 100) -> Tuple[Machine, List[MachineEvent]]:
    machine = get_machine_by_id(db, machine_id_or_code)
    events = (
        db.query(MachineEvent)
        .filter(MachineEvent.machine_id == machine.id)
        .order_by(MachineEvent.start_time.desc())
        .limit(limit)
        .all()
    )
    return machine, events


def record_machine_event(
    db: Session,
    event_in: MachineEventCreate,
    current_user: Optional[User] = None,
) -> Tuple[MachineEvent, bool]:
    """Record a machine event with idempotency protection. Returns (event, is_new)."""
    existing = db.query(MachineEvent).filter(MachineEvent.event_id == event_in.event_id).first()
    if existing:
        return existing, False # Idempotent skip
        
    machine = db.query(Machine).filter(Machine.id == event_in.machine_id).first()
    if not machine:
        raise NotFoundException("Machine", event_in.machine_id)
        
    event = MachineEvent(
        event_id=event_in.event_id,
        machine_id=machine.id,
        production_order_id=event_in.production_order_id,
        event_type=event_in.event_type,
        start_time=event_in.start_time,
        end_time=event_in.end_time,
        downtime_reason=event_in.downtime_reason,
        data_source=event_in.data_source,
        details=event_in.details,
    )
    db.add(event)
    
    # Update machine state based on event
    machine.last_heartbeat = datetime.now(timezone.utc)
    if event_in.downtime_reason:
        machine.downtime_reason = event_in.downtime_reason
        machine.status = MachineStatus.BREAKDOWN if "breakdown" in event_in.downtime_reason.lower() else MachineStatus.STOPPED
    elif event_in.event_type in ["state_change", "running"]:
        machine.status = MachineStatus.RUNNING
        machine.downtime_reason = None
    elif event_in.event_type == "maintenance":
        machine.status = MachineStatus.MAINTENANCE
    elif event_in.event_type == "idle":
        machine.status = MachineStatus.IDLE
        machine.downtime_reason = None

    if event_in.production_order_id:
        machine.active_production_order_id = event_in.production_order_id
        
    db.commit()
    db.refresh(event)
    return event, True


def record_production_event(
    db: Session,
    event_in: ProductionEventCreate,
    current_user: Optional[User] = None,
) -> Tuple[ProductionEvent, bool]:
    """Record a production event (e.g. meterage output) with idempotency."""
    existing = db.query(ProductionEvent).filter(ProductionEvent.event_id == event_in.event_id).first()
    if existing:
        return existing, False
        
    po = db.query(ProductionOrder).filter(ProductionOrder.id == event_in.production_order_id).first()
    if not po:
        raise NotFoundException("ProductionOrder", event_in.production_order_id)
        
    event = ProductionEvent(
        event_id=event_in.event_id,
        production_order_id=po.id,
        machine_id=event_in.machine_id,
        event_type=event_in.event_type,
        quantity=event_in.quantity,
        unit=event_in.unit,
        event_timestamp=event_in.timestamp,
        source=event_in.source,
        actor_id=current_user.id if current_user else None,
    )
    db.add(event)
    
    # Update completed meterage on production order and active machine
    if event_in.quantity > 0:
        po.completed_quantity += event_in.quantity
        if po.status == ProductionStatus.SCHEDULED:
            po.status = ProductionStatus.IN_PROGRESS
            po.actual_start_date = datetime.now(timezone.utc)
        if po.completed_quantity >= po.target_quantity:
            po.status = ProductionStatus.COMPLETED
            po.actual_end_date = datetime.now(timezone.utc)
            
        if event_in.machine_id:
            machine = db.query(Machine).filter(Machine.id == event_in.machine_id).first()
            if machine:
                machine.shift_output_m += event_in.quantity
                machine.last_heartbeat = datetime.now(timezone.utc)

    db.commit()
    db.refresh(event)
    return event, True
