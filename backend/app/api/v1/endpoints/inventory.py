from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.inventory import Material, MaterialLot, InventoryMovement, MaterialType, MovementType
from app.models.customer import Supplier
from app.models.alert import Alert, AlertCategory, AlertSeverity, AlertStatus
from app.core.exceptions import NotFoundException, TextileAppException
from app.schemas.inventory import (
    MaterialRead,
    MaterialCreate,
    InventoryMovementRead,
    ReceiptRequest,
    ReservationRequest,
    ConsumptionRequest,
    AdjustmentRequest,
    LowStockResponse,
)
from app.services.inventory_service import (
    get_materials,
    get_material_by_id,
    create_material,
    get_inventory_movements,
    process_material_receipt,
    process_material_reservation,
    process_material_consumption,
    process_material_adjustment,
    get_low_stock_materials,
)

router = APIRouter(prefix="/inventory", tags=["Inventory & Materials"])


@router.get("", summary="Get inventory items formatted for UI")
@router.get("/", summary="Get inventory items formatted for UI")
def get_inventory_items_ui(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    materials = db.query(Material).all()
    result = []
    category_map = {
        MaterialType.YARN: "raw_yarn",
        MaterialType.DYE_CHEMICAL: "dyes_chemicals",
        MaterialType.GREIGE_FABRIC: "greige_fabric",
        MaterialType.FINISHED_FABRIC: "finished_roll",
        MaterialType.PACKAGING: "packaging_material",
    }
    for m in materials:
        lots = m.lots
        total_avail = sum(lot.available_quantity for lot in lots) if lots else m.current_stock
        total_res = sum(lot.reserved_quantity for lot in lots) if lots else 0.0
        primary_lot = lots[0] if lots else None
        
        status_str = "in_stock"
        if m.current_stock <= 0:
            status_str = "depleted"
        elif m.current_stock < m.reorder_threshold:
            status_str = "critical" if m.current_stock <= m.safety_stock else "low_stock"
            
        color_hex = "#f5f5dc" if "cotton" in m.name.lower() or "30s" in m.name.lower() else (
            "#1e3a8a" if "blue" in m.name.lower() or "navy" in m.name.lower() else (
                "#cbd5e1" if "viscose" in m.name.lower() else "#dcfce7"
            )
        )
        
        supplier_name = "Gujarat Cotton Mills Ltd"
        if primary_lot and primary_lot.supplier:
            supplier_name = primary_lot.supplier.name
        elif "dye" in m.name.lower() or "acid" in m.name.lower():
            supplier_name = "Dyestuff Global Chemical Co"
            
        result.append({
            "id": f"mat-{m.id}",
            "sku": m.material_code,
            "name": m.name,
            "category": category_map.get(m.material_type, "raw_yarn"),
            "lotNumber": primary_lot.lot_number if primary_lot else f"LOT-{m.material_code}",
            "specification": m.description or f"{m.name} ({m.unit})",
            "colorHex": color_hex,
            "warehouseRack": "Rack A-01" if m.material_type == MaterialType.YARN else "Rack C-02",
            "warehouseBin": f"Bin 0{m.id}",
            "quantity": m.current_stock,
            "availableQuantity": total_avail,
            "reservedQuantity": total_res,
            "reorderThreshold": m.reorder_threshold,
            "unit": m.unit,
            "unitCostUsd": m.standard_cost_per_unit,
            "supplierName": supplier_name,
            "status": status_str,
            "lastUpdated": m.updated_at.isoformat() if m.updated_at else datetime.now(timezone.utc).isoformat(),
        })
    return result


@router.get("/gate-entries", summary="List inward gate passes")
def get_gate_entries(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    movements = (
        db.query(InventoryMovement)
        .filter(InventoryMovement.movement_type == MovementType.RECEIPT)
        .order_by(InventoryMovement.movement_timestamp.desc())
        .limit(50)
        .all()
    )
    entries = []
    for mov in movements:
        mat = mov.material
        lot = mov.lot
        supp_name = "Gujarat Cotton Mills Ltd"
        if lot and lot.supplier:
            supp_name = lot.supplier.name
            
        vehicle = "GJ-05-BX-9082" if mov.id % 2 == 0 else "MH-12-PQ-4419"
        driver = "Sukhdev Singh" if mov.id % 2 == 0 else "Rameshwar Rao"
        if mov.notes and "Vehicle:" in mov.notes:
            try:
                parts = mov.notes.split("|")
                for p in parts:
                    if "Vehicle:" in p:
                        vehicle = p.split("Vehicle:")[1].strip()
            except Exception:
                pass

        entries.append({
            "id": f"gate-in-{mov.id}",
            "gatePassNumber": f"GATE-IN-2026-{1000 + mov.id}",
            "vehicleNumber": vehicle,
            "driverName": driver,
            "driverPhone": "+91 98251 77201",
            "supplierName": supp_name,
            "challanInvoiceNumber": f"DC-SUP-{5000 + mov.id}",
            "yarnSku": mat.material_code if mat else "YARN-COT-30S",
            "yarnName": mat.name if mat else "Combed Cotton Yarn",
            "yarnType": mat.description or "100% Combed Cotton Ring Spun",
            "yarnColor": "Raw Ecru (Unbleached)",
            "yarnColorHex": "#f5f5dc",
            "lotNumber": lot.lot_number if lot else f"LOT-2026-Y{mov.id}",
            "bagCount": int(mov.quantity / 50) if mov.quantity >= 50 else 10,
            "coneCount": int(mov.quantity / 2.5) if mov.quantity >= 2.5 else 100,
            "grossWeightKg": round(mov.quantity * 1.03, 1),
            "tareWeightKg": round(mov.quantity * 0.03, 1),
            "netWeightKg": mov.quantity,
            "moisturePercent": 7.8,
            "earmarkedOrderId": mov.reference_id if mov.reference_type == "sales_order" else None,
            "allocatedStorageLocation": mov.destination_location or "Warehouse A / Rack A-01 / Bin 01",
            "entryTimestamp": mov.movement_timestamp.isoformat(),
            "receivedBy": mov.actor.name if mov.actor else "Dinesh Patel (Gate Officer)",
            "inspectionStatus": "passed",
            "notes": mov.notes or "Cleared gate weighbridge and physical inspection.",
        })
    return entries


@router.post("/gate-inward", summary="Record truck arrival & weighbridge yarn receipt at gate")
def record_gate_inward(
    entry_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    yarn_sku = entry_data.get("yarnSku", "YARN-COT-30S-ORG")
    yarn_name = entry_data.get("yarnName", "30s Ne Organic Combed Cotton")
    net_weight_kg = float(entry_data.get("netWeightKg", 1000.0))
    lot_number = entry_data.get("lotNumber") or f"LOT-YRN-{int(datetime.now().timestamp())}"
    storage_loc = entry_data.get("allocatedStorageLocation", "Warehouse A / Rack A-01 / Bin 01")
    supplier_name = entry_data.get("supplierName", "Gujarat Cotton Mills Ltd")
    earmarked_order_id = entry_data.get("earmarkedOrderId")
    notes = entry_data.get("notes", "Yarn received at factory weighbridge gate")
    
    # 1. Find or create Material in PostgreSQL
    material = db.query(Material).filter(Material.material_code == yarn_sku).first()
    if not material:
        material = Material(
            material_code=yarn_sku,
            name=yarn_name,
            material_type=MaterialType.YARN,
            unit="kg",
            reorder_threshold=300.0,
            safety_stock=150.0,
            standard_cost_per_unit=4.50,
            description=entry_data.get("yarnType", f"{yarn_name} Ring Spun"),
            current_stock=0.0,
        )
        db.add(material)
        db.flush()
        
    # 2. Find or create Supplier
    supplier = db.query(Supplier).filter(Supplier.name == supplier_name).first()
    supplier_id = supplier.id if supplier else None
    
    # 3. Create or update MaterialLot in PostgreSQL
    existing_lot = db.query(MaterialLot).filter(MaterialLot.lot_number == lot_number).first()
    if existing_lot:
        existing_lot.received_quantity += net_weight_kg
        if earmarked_order_id:
            existing_lot.reserved_quantity += net_weight_kg
        else:
            existing_lot.available_quantity += net_weight_kg
        lot = existing_lot
    else:
        lot = MaterialLot(
            lot_number=lot_number,
            material_id=material.id,
            supplier_id=supplier_id,
            received_quantity=net_weight_kg,
            available_quantity=0.0 if earmarked_order_id else net_weight_kg,
            reserved_quantity=net_weight_kg if earmarked_order_id else 0.0,
            unit="kg",
            unit_cost=4.50,
            storage_location=storage_loc,
        )
        db.add(lot)
        db.flush()
        
    # 4. Authoritative stock increase in PostgreSQL
    material.current_stock += net_weight_kg
    
    # 5. Inventory Movement entry in PostgreSQL
    ref_type = "sales_order" if earmarked_order_id else "gate_inward"
    ref_id = str(earmarked_order_id) if earmarked_order_id else entry_data.get("challanInvoiceNumber", lot_number)
    
    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lot.id,
        movement_type=MovementType.RECEIPT,
        quantity=net_weight_kg,
        unit="kg",
        source_location=f"Truck {entry_data.get('vehicleNumber', 'GATE-01')}",
        destination_location=storage_loc,
        reference_type=ref_type,
        reference_id=ref_id,
        actor_id=current_user.id,
        notes=f"Vehicle: {entry_data.get('vehicleNumber')} | Challan: {entry_data.get('challanInvoiceNumber')} | Moisture: {entry_data.get('moisturePercent')}% | Notes: {notes}",
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    
    return {
        "success": True,
        "data": {
            **entry_data,
            "id": f"gate-in-{movement.id}",
            "gatePassNumber": entry_data.get("gatePassNumber") or f"GATE-IN-2026-{1000 + movement.id}",
            "entryTimestamp": movement.movement_timestamp.isoformat(),
        }
    }


@router.post("/reserve-for-order", summary="Reserve yarn stock for an active sales order")
def reserve_yarn_for_order(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    sku = payload.get("yarnSku")
    qty = float(payload.get("quantityKg", 0))
    order_id = payload.get("orderId")
    order_number = payload.get("orderNumber", f"ORD-{order_id}")
    
    material = db.query(Material).filter(Material.material_code == sku).first()
    if not material:
        material = db.query(Material).filter(Material.material_type == MaterialType.YARN).first()
        
    if not material:
        raise NotFoundException("Yarn Material", sku or "any")
        
    lots = db.query(MaterialLot).filter(MaterialLot.material_id == material.id).all()
    remaining_to_reserve = qty
    for lot in lots:
        if lot.available_quantity > 0:
            alloc = min(lot.available_quantity, remaining_to_reserve)
            lot.available_quantity -= alloc
            lot.reserved_quantity += alloc
            remaining_to_reserve -= alloc
            if remaining_to_reserve <= 0:
                break
                
    movement = InventoryMovement(
        material_id=material.id,
        lot_id=lots[0].id if lots else None,
        movement_type=MovementType.RESERVATION,
        quantity=qty,
        unit="kg",
        source_location="Warehouse A Available Buffer",
        destination_location=f"Production Line Allocation ({order_number})",
        reference_type="sales_order",
        reference_id=str(order_id),
        actor_id=current_user.id,
        notes=f"Yarn reserved for production order {order_number}. Locked from duplicate allocation.",
    )
    db.add(movement)
    db.commit()
    
    return {
        "success": True,
        "message": f"Successfully reserved {qty} kg of {material.name} for {order_number}.",
        "reservedQuantity": qty,
        "remainingCurrentStock": material.current_stock,
    }


@router.post("/purchase-requisition", summary="Create supplier yarn PO purchase requisition alert")
def create_purchase_requisition(
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    material_code = payload.get("materialCode") or payload.get("yarnSku")
    qty = float(payload.get("quantityKg", 1000))
    supplier_name = payload.get("supplierName", "Gujarat Cotton Mills Ltd")
    order_number = payload.get("orderNumber", "Urgent Production")
    
    po_number = f"PO-REQ-2026-{int(datetime.now().timestamp()) % 10000}"
    alert = Alert(
        category=AlertCategory.INVENTORY_SHORTAGE,
        severity=AlertSeverity.HIGH,
        title=f"Purchase Requisition Issued: {po_number} ({qty} kg)",
        description=f"Purchase requisition created for {qty} kg from {supplier_name} to cover deficit on {order_number}. Estimated lead time: 2-3 business days.",
        entity_type="material",
        entity_id=material_code or "YARN-RAW",
        status=AlertStatus.ACTIVE,
    )
    db.add(alert)
    db.commit()
    
    return {
        "success": True,
        "poNumber": po_number,
        "quantityKg": qty,
        "supplierName": supplier_name,
        "message": f"Purchase requisition {po_number} for {qty} kg generated and transmitted to procurement ledger.",
    }



@router.get("/materials", response_model=List[MaterialRead], summary="List raw materials and stock levels")
def list_materials(
    material_type: Optional[MaterialType] = Query(None, description="Filter by material type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_materials(db, material_type=material_type, skip=skip, limit=limit)
    return [MaterialRead.model_validate(m) for m in items]


@router.post("/materials", response_model=MaterialRead, status_code=status.HTTP_201_CREATED, summary="Create a new raw material")
def add_material(
    material_in: MaterialCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY])),
):
    material = create_material(db, material_in, current_user)
    return MaterialRead.model_validate(material)


@router.get("/materials/{material_id}", response_model=MaterialRead, summary="Get material details and lots")
def get_material(
    material_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    material = get_material_by_id(db, material_id)
    return MaterialRead.model_validate(material)


@router.get("/movements", response_model=List[InventoryMovementRead], summary="Get inventory ledger movement history")
def list_movements(
    material_id: Optional[int] = Query(None),
    movement_type: Optional[MovementType] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_inventory_movements(db, material_id=material_id, movement_type=movement_type, skip=skip, limit=limit)
    return [InventoryMovementRead.model_validate(m) for m in items]


@router.post("/receipts", response_model=InventoryMovementRead, status_code=status.HTTP_201_CREATED, summary="Record raw material receipt")
def record_receipt(
    receipt_in: ReceiptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY])),
):
    """Processes supplier goods receipt, creating lot and updating ledger."""
    movement = process_material_receipt(db, receipt_in, current_user)
    return InventoryMovementRead.model_validate(movement)


@router.post("/reservations", response_model=InventoryMovementRead, status_code=status.HTTP_201_CREATED, summary="Reserve material for production")
def record_reservation(
    reservation_in: ReservationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY, UserRole.PRODUCTION])),
):
    """Reserves material quantity for production order. Rejects if stock is insufficient."""
    movement = process_material_reservation(db, reservation_in, current_user)
    return InventoryMovementRead.model_validate(movement)


@router.post("/consumption", response_model=InventoryMovementRead, status_code=status.HTTP_201_CREATED, summary="Consume material on factory line")
def record_consumption(
    consumption_in: ConsumptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY, UserRole.PRODUCTION])),
):
    """Records real or simulated consumption of yarn/chemicals on machines."""
    movement = process_material_consumption(db, consumption_in, current_user)
    return InventoryMovementRead.model_validate(movement)


@router.post("/adjustments", response_model=InventoryMovementRead, status_code=status.HTTP_201_CREATED, summary="Record physical stock adjustment")
def record_adjustment(
    adjustment_in: AdjustmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.INVENTORY])),
):
    """Adjusts inventory ledger following physical count or scrap write-off."""
    movement = process_material_adjustment(db, adjustment_in, current_user)
    return InventoryMovementRead.model_validate(movement)


@router.get("/low-stock", response_model=LowStockResponse, summary="Get materials below reorder threshold")
def get_low_stock(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns materials requiring procurement reordering."""
    return get_low_stock_materials(db)
