from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ConflictException
from app.models.user import User
from app.models.quality import (
    FabricRoll,
    QualityInspection,
    RollStatus,
    InspectionResult,
    RollGrade,
)
from app.models.production import ProductionOrder, Machine
from app.models.order import SalesOrder
from app.models.dispatch import ShipmentItem, Shipment
from app.schemas.quality import (
    FabricRollCreate,
    QualityInspectionCreate,
    QualityInspectionRead,
    RollGenealogyResponse,
)
from app.services.audit_service import log_audit_event


def get_fabric_rolls(
    db: Session,
    status: Optional[RollStatus] = None,
    sales_order_id: Optional[int] = None,
    production_order_id: Optional[int] = None,
    grade: Optional[RollGrade] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[FabricRoll], int]:
    query = db.query(FabricRoll)
    if status:
        query = query.filter(FabricRoll.current_status == status)
    if sales_order_id:
        query = query.filter(FabricRoll.sales_order_id == sales_order_id)
    if production_order_id:
        query = query.filter(FabricRoll.production_order_id == production_order_id)
    if grade:
        query = query.filter(FabricRoll.grade == grade)
        
    total = query.count()
    items = query.order_by(FabricRoll.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_fabric_roll_by_id(db: Session, roll_id_or_code: str) -> FabricRoll:
    if roll_id_or_code.isdigit():
        roll = db.query(FabricRoll).filter(FabricRoll.id == int(roll_id_or_code)).first()
    else:
        roll = db.query(FabricRoll).filter(FabricRoll.roll_code == roll_id_or_code).first()
        
    if not roll:
        raise NotFoundException("FabricRoll", roll_id_or_code)
    return roll


def create_fabric_roll(
    db: Session,
    roll_in: FabricRollCreate,
    current_user: User,
) -> FabricRoll:
    existing = db.query(FabricRoll).filter(FabricRoll.roll_code == roll_in.roll_code).first()
    if existing:
        raise ConflictException(f"Fabric roll with code '{roll_in.roll_code}' already exists.")
        
    roll = FabricRoll(
        roll_code=roll_in.roll_code,
        production_order_id=roll_in.production_order_id,
        sales_order_id=roll_in.sales_order_id,
        fabric_type=roll_in.fabric_type,
        length_m=roll_in.length_m,
        weight_kg=roll_in.weight_kg,
        width_inches=roll_in.width_inches,
        gsm=roll_in.gsm,
        grade=roll_in.grade,
        current_status=roll_in.current_status,
        current_location=roll_in.current_location,
        notes=roll_in.notes,
    )
    db.add(roll)
    db.flush()
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="create_fabric_roll",
        entity_type="fabric_roll",
        entity_id=str(roll.id),
        changes_summary={"roll_code": roll.roll_code, "length_m": roll.length_m},
    )
    
    db.commit()
    db.refresh(roll)
    return roll


def record_quality_inspection(
    db: Session,
    inspection_in: QualityInspectionCreate,
    current_user: User,
) -> QualityInspection:
    roll = db.query(FabricRoll).filter(FabricRoll.id == inspection_in.roll_id).first()
    if not roll:
        raise NotFoundException("FabricRoll", inspection_in.roll_id)
        
    # Calculate 4-point system score if defects provided
    points_per_100_sqm = 0.0
    if inspection_in.defect_details and roll.length_m > 0 and roll.width_inches:
        total_points = sum(d.get("points", 1) * d.get("count", 1) for d in inspection_in.defect_details)
        width_m = (roll.width_inches * 2.54) / 100.0
        total_sqm = roll.length_m * width_m
        if total_sqm > 0:
            points_per_100_sqm = round((total_points * 100.0) / total_sqm, 2)
            
    inspection = QualityInspection(
        roll_id=roll.id,
        inspector_id=current_user.id,
        inspection_date=datetime.now(timezone.utc),
        result=inspection_in.result,
        defect_count=inspection_in.defect_count,
        defect_details=inspection_in.defect_details,
        disposition=inspection_in.disposition,
        points_per_100_sqm=points_per_100_sqm,
        notes=inspection_in.notes,
    )
    db.add(inspection)
    
    # Update roll status and grade based on inspection result
    if inspection_in.result == InspectionResult.PASS:
        roll.current_status = RollStatus.PASS
        if points_per_100_sqm <= 15:
            roll.grade = RollGrade.GRADE_A
        elif points_per_100_sqm <= 28:
            roll.grade = RollGrade.GRADE_B
        else:
            roll.grade = RollGrade.GRADE_C
        roll.current_location = "Finished Goods Bay A"
    elif inspection_in.result == InspectionResult.HOLD:
        roll.current_status = RollStatus.HOLD
        roll.current_location = "Quality Quarantine"
    elif inspection_in.result == InspectionResult.REWORK:
        roll.current_status = RollStatus.REWORK
        roll.current_location = "Mending / Re-inspection Section"
    elif inspection_in.result == InspectionResult.REJECT:
        roll.current_status = RollStatus.REJECTED
        roll.grade = RollGrade.SCRAP
        roll.current_location = "Scrap / Reject Yard"

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="record_quality_inspection",
        entity_type="quality_inspection",
        entity_id=str(inspection.roll_id),
        changes_summary={
            "result": inspection_in.result.value,
            "defects": inspection_in.defect_count,
            "new_status": roll.current_status.value,
        },
    )

    db.commit()
    db.refresh(inspection)
    return inspection


def get_roll_genealogy(db: Session, roll_id_or_code: str) -> RollGenealogyResponse:
    roll = get_fabric_roll_by_id(db, roll_id_or_code)
    
    # Trace sales order
    so_data = None
    if roll.sales_order:
        so_data = {
            "order_number": roll.sales_order.order_number,
            "customer": roll.sales_order.customer.name if roll.sales_order.customer else None,
            "required_delivery_date": str(roll.sales_order.required_delivery_date),
            "status": roll.sales_order.status.value,
        }
        
    # Trace production order & machine origin
    po_data = None
    machine_data = None
    if roll.production_order:
        po_data = {
            "po_number": roll.production_order.production_order_number,
            "target_quantity": roll.production_order.target_quantity,
            "completed_quantity": roll.production_order.completed_quantity,
            "status": roll.production_order.status.value,
        }
        # Find machine used for weaving operation
        for op in roll.production_order.operations:
            if op.machine:
                machine_data = {
                    "machine_code": op.machine.machine_code,
                    "name": op.machine.name,
                    "process_type": op.machine.process_type.value,
                }
                break
                
    # Trace shipment
    shipment_data = None
    if roll.shipment_items:
        shp_item = roll.shipment_items[0]
        shipment_data = {
            "shipment_number": shp_item.shipment.shipment_number,
            "status": shp_item.shipment.status.value,
            "carrier": shp_item.shipment.carrier,
            "tracking_reference": shp_item.shipment.tracking_reference,
            "dispatch_date": str(shp_item.shipment.dispatch_date) if shp_item.shipment.dispatch_date else None,
        }

    return RollGenealogyResponse(
        roll_id=roll.id,
        roll_code=roll.roll_code,
        fabric_type=roll.fabric_type,
        length_m=roll.length_m,
        grade=roll.grade,
        current_status=roll.current_status,
        created_at=roll.created_at,
        sales_order=so_data,
        production_order=po_data,
        machine_origin=machine_data,
        inspections=[QualityInspectionRead.model_validate(ins) for ins in roll.inspections],
        shipment=shipment_data,
    )
