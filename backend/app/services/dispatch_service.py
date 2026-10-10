import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import (
    NotFoundException,
    ConflictException,
    IneligibleRollDispatchException,
    DuplicateDispatchException,
    TextileAppException,
)
from app.models.user import User, UserRole
from app.models.dispatch import Shipment, ShipmentItem, ShipmentStatus
from app.models.quality import FabricRoll, RollStatus
from app.models.order import SalesOrder, OrderStatus
from app.schemas.dispatch import (
    ShipmentCreate,
    ShipmentConfirmResponse,
)
from app.services.audit_service import log_audit_event


def get_shipments(
    db: Session,
    current_user: User,
    status: Optional[ShipmentStatus] = None,
    customer_id: Optional[int] = None,
    sales_order_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Shipment], int]:
    query = db.query(Shipment)
    
    # Buyer data isolation
    if current_user.role == UserRole.BUYER:
        if not current_user.customer_id:
            return [], 0
        query = query.filter(Shipment.customer_id == current_user.customer_id)
    elif customer_id:
        query = query.filter(Shipment.customer_id == customer_id)
        
    if status:
        query = query.filter(Shipment.status == status)
    if sales_order_id:
        query = query.filter(Shipment.sales_order_id == sales_order_id)
        
    total = query.count()
    items = query.order_by(Shipment.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_shipment_by_id(db: Session, shipment_id: int, current_user: User) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise NotFoundException("Shipment", shipment_id)
        
    if current_user.role == UserRole.BUYER:
        if current_user.customer_id != shipment.customer_id:
            raise NotFoundException("Shipment", shipment_id)
            
    return shipment


def add_roll_to_shipment_internal(
    db: Session,
    shipment: Shipment,
    roll: FabricRoll,
    dispatched_quantity: Optional[float] = None,
) -> ShipmentItem:
    """Validate quality eligibility and prevent double dispatching before adding roll."""
    # 1. Block held, rejected, rework, and uninspected rolls
    if roll.current_status not in [RollStatus.PASS, RollStatus.ALLOCATED_FOR_DISPATCH]:
        raise IneligibleRollDispatchException(
            roll_code=roll.roll_code,
            current_status=roll.current_status.value,
            reason=f"Only rolls with 'pass' inspection status can be dispatched. Current status is '{roll.current_status.value}'.",
        )
        
    # 2. Prevent duplicate dispatching of the same roll across any existing confirmed shipment
    existing_dispatched_item = (
        db.query(ShipmentItem)
        .join(Shipment)
        .filter(
            ShipmentItem.roll_id == roll.id,
            Shipment.status.in_([ShipmentStatus.DISPATCHED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED]),
        )
        .first()
    )
    if existing_dispatched_item:
        raise DuplicateDispatchException(
            roll_code=roll.roll_code,
            previous_shipment_id=existing_dispatched_item.shipment_id,
        )
        
    # Check if already added in this shipment
    existing_in_this = (
        db.query(ShipmentItem)
        .filter(
            ShipmentItem.shipment_id == shipment.id,
            ShipmentItem.roll_id == roll.id,
        )
        .first()
    )
    if existing_in_this:
        return existing_in_this

    qty = dispatched_quantity if dispatched_quantity is not None else roll.length_m
    item = ShipmentItem(
        shipment_id=shipment.id,
        roll_id=roll.id,
        dispatched_quantity=qty,
        unit="m",
    )
    db.add(item)
    
    # Mark roll as allocated
    roll.current_status = RollStatus.ALLOCATED_FOR_DISPATCH
    return item


def create_shipment(
    db: Session,
    shipment_in: ShipmentCreate,
    current_user: User,
) -> Shipment:
    existing = db.query(Shipment).filter(Shipment.shipment_number == shipment_in.shipment_number).first()
    if existing:
        raise ConflictException(f"Shipment '{shipment_in.shipment_number}' already exists.")
        
    sales_order = db.query(SalesOrder).filter(SalesOrder.id == shipment_in.sales_order_id).first()
    if not sales_order:
        raise NotFoundException("SalesOrder", shipment_in.sales_order_id)
        
    shipment = Shipment(
        shipment_number=shipment_in.shipment_number,
        sales_order_id=shipment_in.sales_order_id,
        customer_id=sales_order.customer_id,
        carrier=shipment_in.carrier,
        vehicle_number=shipment_in.vehicle_number,
        destination_address=shipment_in.destination_address or (sales_order.customer.address if sales_order.customer else None),
        status=ShipmentStatus.DRAFT,
        notes=shipment_in.notes,
    )
    db.add(shipment)
    db.flush()
    
    # Add initial rolls if provided
    if shipment_in.roll_ids:
        for roll_id in shipment_in.roll_ids:
            roll = db.query(FabricRoll).filter(FabricRoll.id == roll_id).first()
            if not roll:
                raise NotFoundException("FabricRoll", roll_id)
            add_roll_to_shipment_internal(db, shipment, roll)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="create_shipment",
        entity_type="shipment",
        entity_id=str(shipment.id),
        changes_summary={"shipment_number": shipment.shipment_number},
    )

    db.commit()
    db.refresh(shipment)
    return shipment


def add_item_to_shipment(
    db: Session,
    shipment_id: int,
    roll_id: int,
    dispatched_quantity: Optional[float],
    current_user: User,
) -> ShipmentItem:
    shipment = get_shipment_by_id(db, shipment_id, current_user)
    if shipment.status != ShipmentStatus.DRAFT:
        raise TextileAppException(
            status_code=400,
            detail=f"Cannot add rolls to shipment with status '{shipment.status.value}'.",
            error_code="SHIPMENT_ALREADY_LOCKED",
        )
        
    roll = db.query(FabricRoll).filter(FabricRoll.id == roll_id).first()
    if not roll:
        raise NotFoundException("FabricRoll", roll_id)
        
    item = add_roll_to_shipment_internal(db, shipment, roll, dispatched_quantity)
    db.commit()
    db.refresh(item)
    return item


def confirm_shipment_dispatch(
    db: Session,
    shipment_id: int,
    current_user: User,
) -> ShipmentConfirmResponse:
    """Execute atomic shipment dispatch and enforce quality and idempotency safeguards."""
    shipment = get_shipment_by_id(db, shipment_id, current_user)
    
    if shipment.status in [ShipmentStatus.DISPATCHED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED]:
        raise ConflictException(f"Shipment '{shipment.shipment_number}' has already been dispatched.")
        
    if not shipment.items:
        raise TextileAppException(
            status_code=400,
            detail="Cannot dispatch an empty shipment. Please add verified fabric rolls first.",
            error_code="EMPTY_SHIPMENT",
        )

    # Re-verify every roll in the shipment
    total_meterage = 0.0
    for item in shipment.items:
        roll = item.roll
        if not roll:
            roll = db.query(FabricRoll).filter(FabricRoll.id == item.roll_id).first()
        if roll.current_status not in [RollStatus.PASS, RollStatus.ALLOCATED_FOR_DISPATCH]:
            raise IneligibleRollDispatchException(
                roll_code=roll.roll_code,
                current_status=roll.current_status.value,
                reason=f"Roll '{roll.roll_code}' cannot be dispatched with status '{roll.current_status.value}'.",
            )
        total_meterage += item.dispatched_quantity
        roll.current_status = RollStatus.DISPATCHED
        roll.current_location = f"In Transit ({shipment.carrier or 'Carrier'})"

    tracking_no = f"TRK-{uuid.uuid4().hex[:10].upper()}"
    dispatch_time = datetime.now(timezone.utc)
    
    shipment.status = ShipmentStatus.DISPATCHED
    shipment.dispatch_date = dispatch_time
    shipment.tracking_reference = tracking_no
    
    # Update linked Sales Order status
    sales_order = shipment.sales_order
    if sales_order:
        # Check total ordered vs total dispatched
        total_ordered = sum(item.target_quantity for item in sales_order.items)
        all_dispatched_rolls = (
            db.query(func.sum(ShipmentItem.dispatched_quantity))
            .join(Shipment)
            .filter(
                Shipment.sales_order_id == sales_order.id,
                Shipment.status.in_([ShipmentStatus.DISPATCHED, ShipmentStatus.IN_TRANSIT, ShipmentStatus.DELIVERED]),
            )
            .scalar()
            or 0.0
        )
        if all_dispatched_rolls >= total_ordered:
            sales_order.status = OrderStatus.COMPLETED
        else:
            sales_order.status = OrderStatus.PARTIALLY_DISPATCHED

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="confirm_shipment_dispatch",
        entity_type="shipment",
        entity_id=str(shipment.id),
        changes_summary={
            "tracking_reference": tracking_no,
            "dispatched_rolls_count": len(shipment.items),
            "total_meterage": total_meterage,
        },
    )

    db.commit()
    db.refresh(shipment)
    
    return ShipmentConfirmResponse(
        shipment_id=shipment.id,
        shipment_number=shipment.shipment_number,
        status=shipment.status,
        dispatch_date=dispatch_time,
        tracking_reference=tracking_no,
        dispatched_rolls_count=len(shipment.items),
        total_meterage=round(total_meterage, 2),
        message=f"Shipment {shipment.shipment_number} successfully dispatched with {len(shipment.items)} verified fabric rolls.",
    )
