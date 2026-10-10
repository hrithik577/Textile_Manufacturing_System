from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import (
    NotFoundException,
    InsufficientStockException,
    ConflictException,
    TextileAppException,
)
from app.models.user import User
from app.models.inventory import (
    Material,
    MaterialLot,
    InventoryMovement,
    MaterialType,
    MovementType,
)
from app.schemas.inventory import (
    MaterialCreate,
    MaterialUpdate,
    ReceiptRequest,
    ReservationRequest,
    ConsumptionRequest,
    AdjustmentRequest,
    LowStockItem,
    LowStockResponse,
)
from app.services.audit_service import log_audit_event


def get_materials(
    db: Session,
    material_type: Optional[MaterialType] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Material], int]:
    query = db.query(Material)
    if material_type:
        query = query.filter(Material.material_type == material_type)
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total


def get_material_by_id(db: Session, material_id: int) -> Material:
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise NotFoundException("Material", material_id)
    return material


def create_material(db: Session, material_in: MaterialCreate, current_user: User) -> Material:
    existing = db.query(Material).filter(Material.material_code == material_in.material_code).first()
    if existing:
        raise ConflictException(f"Material with code '{material_in.material_code}' already exists.")
        
    material = Material(
        material_code=material_in.material_code,
        name=material_in.name,
        material_type=material_in.material_type,
        unit=material_in.unit,
        reorder_threshold=material_in.reorder_threshold,
        safety_stock=material_in.safety_stock,
        standard_cost_per_unit=material_in.standard_cost_per_unit,
        description=material_in.description,
        current_stock=0.0,
    )
    db.add(material)
    db.flush()
    
    # If initial stock was provided, record an initial receipt lot and movement
    if material_in.initial_stock and material_in.initial_stock > 0:
        lot = MaterialLot(
            lot_number=f"INIT-{material.material_code}",
            material_id=material.id,
            received_quantity=material_in.initial_stock,
            available_quantity=material_in.initial_stock,
            reserved_quantity=0.0,
            unit=material.unit,
            unit_cost=material.standard_cost_per_unit,
            storage_location="Warehouse A",
        )
        db.add(lot)
        db.flush()
        
        movement = InventoryMovement(
            material_id=material.id,
            lot_id=lot.id,
            movement_type=MovementType.RECEIPT,
            quantity=material_in.initial_stock,
            unit=material.unit,
            source_location="Initial Setup",
            destination_location="Warehouse A",
            reference_type="initial_setup",
            actor_id=current_user.id,
            notes="Initial stock initialization",
        )
        db.add(movement)
        material.current_stock = material_in.initial_stock

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="create_material",
        entity_type="material",
        entity_id=str(material.id),
        changes_summary={"code": material.material_code, "name": material.name},
    )

    db.commit()
    db.refresh(material)
    return material


def get_inventory_movements(
    db: Session,
    material_id: Optional[int] = None,
    movement_type: Optional[MovementType] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[InventoryMovement], int]:
    query = db.query(InventoryMovement)
    if material_id:
        query = query.filter(InventoryMovement.material_id == material_id)
    if movement_type:
        query = query.filter(InventoryMovement.movement_type == movement_type)
        
    total = query.count()
    items = query.order_by(InventoryMovement.movement_timestamp.desc()).offset(skip).limit(limit).all()
    return items, total


def process_material_receipt(
    db: Session,
    receipt_in: ReceiptRequest,
    current_user: User,
) -> InventoryMovement:
    """Record receipt of raw materials, creating lot and updating stock ledger."""
    material = get_material_by_id(db, receipt_in.material_id)
    
    # Unit consistency check
    if receipt_in.unit.lower() != material.unit.lower():
        raise TextileAppException(
            status_code=400,
            detail=f"Unit mismatch: Material uses '{material.unit}', but receipt provided '{receipt_in.unit}'.",
            error_code="UNIT_MISMATCH",
        )
        
    # Check for duplicate lot number
    existing_lot = db.query(MaterialLot).filter(MaterialLot.lot_number == receipt_in.lot_number).first()
    if existing_lot:
        # If same lot, increment lot available quantity
        lot = existing_lot
        lot.received_quantity += receipt_in.quantity
        lot.available_quantity += receipt_in.quantity
    else:
        lot = MaterialLot(
            lot_number=receipt_in.lot_number,
            material_id=material.id,
            supplier_id=receipt_in.supplier_id,
            received_quantity=receipt_in.quantity,
            available_quantity=receipt_in.quantity,
            reserved_quantity=0.0,
            unit=material.unit,
            unit_cost=receipt_in.unit_cost,
            storage_location=receipt_in.storage_location,
        )
        db.add(lot)
        db.flush()

    # Authoritative stock recalculation
    material.current_stock += receipt_in.quantity
    
    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lot.id,
        movement_type=MovementType.RECEIPT,
        quantity=receipt_in.quantity,
        unit=material.unit,
        source_location="Supplier Goods In",
        destination_location=receipt_in.storage_location,
        reference_type="purchase_receipt",
        reference_id=receipt_in.lot_number,
        actor_id=current_user.id,
        notes=receipt_in.notes or f"Goods receipt for {material.name}",
    )
    db.add(movement)
    db.flush()

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="inventory_receipt",
        entity_type="material",
        entity_id=str(material.id),
        changes_summary={"quantity": receipt_in.quantity, "lot_number": receipt_in.lot_number},
    )

    db.commit()
    db.refresh(movement)
    return movement


def process_material_reservation(
    db: Session,
    reservation_in: ReservationRequest,
    current_user: User,
) -> InventoryMovement:
    """Reserve material stock for production order. Rejects if stock is insufficient."""
    material = get_material_by_id(db, reservation_in.material_id)
    
    if reservation_in.unit.lower() != material.unit.lower():
        raise TextileAppException(
            status_code=400,
            detail=f"Unit mismatch: Material uses '{material.unit}', reservation used '{reservation_in.unit}'.",
            error_code="UNIT_MISMATCH",
        )

    # Check available stock across lots or specific lot
    if reservation_in.lot_id:
        lot = db.query(MaterialLot).filter(MaterialLot.id == reservation_in.lot_id).first()
        if not lot or lot.material_id != material.id:
            raise NotFoundException("MaterialLot", reservation_in.lot_id)
        if lot.available_quantity < reservation_in.quantity:
            raise InsufficientStockException(
                material_name=material.name,
                requested=reservation_in.quantity,
                available=lot.available_quantity,
                unit=material.unit,
            )
        lot.available_quantity -= reservation_in.quantity
        lot.reserved_quantity += reservation_in.quantity
        lot_id = lot.id
    else:
        # Check overall available stock
        lots = db.query(MaterialLot).filter(
            MaterialLot.material_id == material.id,
            MaterialLot.available_quantity > 0
        ).order_by(MaterialLot.received_date.asc()).all()
        
        total_available = sum(l.available_quantity for l in lots)
        if total_available < reservation_in.quantity:
            raise InsufficientStockException(
                material_name=material.name,
                requested=reservation_in.quantity,
                available=total_available,
                unit=material.unit,
            )
            
        remaining_to_reserve = reservation_in.quantity
        lot_id = None
        for l in lots:
            if remaining_to_reserve <= 0:
                break
            can_reserve = min(l.available_quantity, remaining_to_reserve)
            l.available_quantity -= can_reserve
            l.reserved_quantity += can_reserve
            remaining_to_reserve -= can_reserve
            lot_id = l.id

    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lot_id,
        movement_type=MovementType.RESERVATION,
        quantity=reservation_in.quantity,
        unit=material.unit,
        source_location="Available Stock",
        destination_location="Reserved for Production",
        reference_type="production_order" if reservation_in.production_order_id else "sales_order",
        reference_id=str(reservation_in.production_order_id or reservation_in.sales_order_id or ""),
        actor_id=current_user.id,
        notes=reservation_in.notes or f"Reserved for PO #{reservation_in.production_order_id}",
    )
    db.add(movement)
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="inventory_reservation",
        entity_type="material",
        entity_id=str(material.id),
        changes_summary={"reserved_qty": reservation_in.quantity},
    )

    db.commit()
    db.refresh(movement)
    return movement


def process_material_consumption(
    db: Session,
    consumption_in: ConsumptionRequest,
    current_user: User,
) -> InventoryMovement:
    """Consume material for production line. Enforces positive balance check."""
    material = get_material_by_id(db, consumption_in.material_id)
    
    if consumption_in.unit.lower() != material.unit.lower():
        raise TextileAppException(
            status_code=400,
            detail=f"Unit mismatch: Material uses '{material.unit}', consumption used '{consumption_in.unit}'.",
            error_code="UNIT_MISMATCH",
        )

    # Check total available/reserved stock
    if material.current_stock < consumption_in.quantity:
        raise InsufficientStockException(
            material_name=material.name,
            requested=consumption_in.quantity,
            available=material.current_stock,
            unit=material.unit,
        )

    # Deduct from lots (prioritize reserved or oldest available)
    if consumption_in.lot_id:
        lot = db.query(MaterialLot).filter(MaterialLot.id == consumption_in.lot_id).first()
        if not lot or lot.material_id != material.id:
            raise NotFoundException("MaterialLot", consumption_in.lot_id)
        if (lot.available_quantity + lot.reserved_quantity) < consumption_in.quantity:
            raise InsufficientStockException(
                material_name=material.name,
                requested=consumption_in.quantity,
                available=lot.available_quantity + lot.reserved_quantity,
                unit=material.unit,
            )
        if lot.reserved_quantity >= consumption_in.quantity:
            lot.reserved_quantity -= consumption_in.quantity
        else:
            remaining = consumption_in.quantity - lot.reserved_quantity
            lot.reserved_quantity = 0.0
            lot.available_quantity -= remaining
        lot_id = lot.id
    else:
        # Deduct across lots FIFO
        lots = db.query(MaterialLot).filter(MaterialLot.material_id == material.id).order_by(MaterialLot.received_date.asc()).all()
        remaining_to_deduct = consumption_in.quantity
        lot_id = None
        for l in lots:
            if remaining_to_deduct <= 0:
                break
            # Prefer reserved, then available
            total_lot_stock = l.reserved_quantity + l.available_quantity
            if total_lot_stock <= 0:
                continue
            deduct_amount = min(total_lot_stock, remaining_to_deduct)
            if l.reserved_quantity >= deduct_amount:
                l.reserved_quantity -= deduct_amount
            else:
                from_avail = deduct_amount - l.reserved_quantity
                l.reserved_quantity = 0.0
                l.available_quantity -= from_avail
            remaining_to_deduct -= deduct_amount
            lot_id = l.id

    # Deduct from material total stock
    material.current_stock -= consumption_in.quantity
    
    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lot_id,
        movement_type=MovementType.CONSUMPTION,
        quantity=consumption_in.quantity,
        unit=material.unit,
        source_location="Warehouse / Shopfloor",
        destination_location=f"Production Line ({consumption_in.process_name or 'Weaving'})",
        reference_type="production_order",
        reference_id=str(consumption_in.production_order_id or ""),
        actor_id=current_user.id,
        notes=consumption_in.notes or f"Consumed in production order #{consumption_in.production_order_id}",
    )
    db.add(movement)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="inventory_consumption",
        entity_type="material",
        entity_id=str(material.id),
        changes_summary={"consumed_qty": consumption_in.quantity},
    )

    db.commit()
    db.refresh(movement)
    return movement


def process_material_adjustment(
    db: Session,
    adj_in: AdjustmentRequest,
    current_user: User,
) -> InventoryMovement:
    """Adjust inventory following physical stock audit."""
    material = get_material_by_id(db, adj_in.material_id)
    
    if (material.current_stock + adj_in.quantity) < 0:
        raise InsufficientStockException(
            material_name=material.name,
            requested=abs(adj_in.quantity),
            available=material.current_stock,
            unit=material.unit,
        )

    material.current_stock += adj_in.quantity
    
    lot_id = None
    if adj_in.lot_id:
        lot = db.query(MaterialLot).filter(MaterialLot.id == adj_in.lot_id).first()
        if lot:
            lot.available_quantity = max(0.0, lot.available_quantity + adj_in.quantity)
            lot_id = lot.id

    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lot_id,
        movement_type=MovementType.ADJUSTMENT,
        quantity=adj_in.quantity,
        unit=material.unit,
        source_location="Audit Adjustment",
        destination_location="Authoritative Ledger",
        reference_type="manual_audit",
        actor_id=current_user.id,
        notes=f"Reason: {adj_in.reason}. {adj_in.notes or ''}",
    )
    db.add(movement)

    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="inventory_adjustment",
        entity_type="material",
        entity_id=str(material.id),
        changes_summary={"adjustment": adj_in.quantity, "reason": adj_in.reason},
    )

    db.commit()
    db.refresh(movement)
    return movement


def get_low_stock_materials(db: Session) -> LowStockResponse:
    """Identify materials falling below reorder thresholds."""
    materials = db.query(Material).all()
    low_stock_items = []
    
    for m in materials:
        if m.current_stock <= m.reorder_threshold:
            deficit = round(m.reorder_threshold - m.current_stock, 2)
            recommended_reorder = round(deficit + m.safety_stock, 2)
            low_stock_items.append(
                LowStockItem(
                    material_id=m.id,
                    material_code=m.material_code,
                    name=m.name,
                    material_type=m.material_type,
                    current_stock=m.current_stock,
                    reorder_threshold=m.reorder_threshold,
                    safety_stock=m.safety_stock,
                    unit=m.unit,
                    deficit=deficit,
                    recommended_reorder_qty=recommended_reorder,
                )
            )
            
    return LowStockResponse(
        items=low_stock_items,
        total_low_stock_materials=len(low_stock_items),
    )
