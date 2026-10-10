from typing import List, Optional, Any, Dict
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, ConfigDict
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.dispatch import Shipment, ShipmentStatus
from app.models.quality import FabricRoll, RollStatus, QualityInspection
from app.models.order import SalesOrder
from app.models.customer import Customer
from app.schemas.dispatch import (
    ShipmentRead,
    ShipmentCreate,
    ShipmentItemRead,
    ShipmentItemCreate,
    ShipmentConfirmResponse,
)
from app.services.dispatch_service import (
    get_shipments,
    get_shipment_by_id,
    create_shipment,
    add_item_to_shipment,
    confirm_shipment_dispatch,
)

router = APIRouter(prefix="/dispatch", tags=["Dispatch & Shipments"])


# ──────────────────────────────────────────────────────────────────────────────
# Frontend-shaped response models for Dispatch page compatibility
# ──────────────────────────────────────────────────────────────────────────────

class FinishedGoodsRollOut(BaseModel):
    id: str
    rollBarcode: str
    orderId: str
    orderNumber: str
    customerName: str
    fabricType: str
    color: str
    gsm: int
    widthInches: float
    netLengthMeters: float
    grossWeightKg: float
    grade: str
    warehouseLocation: str
    status: str
    inspectionId: str
    inspectionDate: str
    inspectorName: str


class DispatchRecordOut(BaseModel):
    id: str
    dispatchNumber: str
    orderId: str
    orderNumber: str
    customerName: str
    destinationCity: str
    destinationAddress: str
    carrierName: str
    trackingNumber: str
    vehicleNumber: str
    driverName: str
    driverPhone: str
    rollIds: List[str]
    totalMeters: float
    totalRolls: int
    grossWeightKg: float
    dispatchedAt: str
    dispatchedBy: str
    status: str
    challanNumber: str
    invoiceNumber: Optional[str] = None
    notes: Optional[str] = None


def _roll_status_to_frontend(status: RollStatus) -> str:
    mapping = {
        RollStatus.PASS: "in_warehouse",
        RollStatus.ALLOCATED_FOR_DISPATCH: "staged_for_dispatch",
        RollStatus.DISPATCHED: "dispatched",
        RollStatus.HOLD: "in_warehouse",
        RollStatus.REWORK: "in_warehouse",
        RollStatus.REJECTED: "in_warehouse",
        RollStatus.UNINSPECTED: "in_warehouse",
    }
    return mapping.get(status, "in_warehouse")


def _roll_to_out(roll: FabricRoll, db: Session) -> FinishedGoodsRollOut:
    """Convert a FabricRoll ORM object to the frontend FinishedGoodsRollOut shape."""
    # Get linked order and customer info
    order_number = "N/A"
    customer_name = "Unknown"
    order_id = "0"
    if roll.sales_order_id:
        so = db.query(SalesOrder).options(joinedload(SalesOrder.customer)).filter(SalesOrder.id == roll.sales_order_id).first()
        if so:
            order_number = so.order_number
            order_id = str(so.id)
            if so.customer:
                customer_name = so.customer.name

    # Get most recent inspection
    inspection = (
        db.query(QualityInspection)
        .filter(QualityInspection.roll_id == roll.id)
        .order_by(QualityInspection.inspection_date.desc())
        .first()
    )
    insp_id = f"INS-{roll.id:04d}"
    insp_date = "N/A"
    insp_name = "QC Lab Team"
    if inspection:
        insp_id = f"INS-{inspection.id:04d}"
        if isinstance(inspection.inspection_date, datetime):
            insp_date = inspection.inspection_date.strftime("%Y-%m-%d")
        else:
            insp_date = str(inspection.inspection_date)
        if inspection.inspector and hasattr(inspection.inspector, "email"):
            insp_name = inspection.inspector.email

    # Derive color from fabric_type or notes
    color = "Natural"
    fabric_lower = (roll.fabric_type or "").lower()
    if "navy" in fabric_lower or "blue" in fabric_lower:
        color = "Navy Blue"
    elif "white" in fabric_lower or "ecru" in fabric_lower:
        color = "Optical White"
    elif "black" in fabric_lower:
        color = "Jet Black"
    elif "grey" in fabric_lower or "gray" in fabric_lower:
        color = "Slate Grey"
    elif "khaki" in fabric_lower or "beige" in fabric_lower:
        color = "Khaki Beige"

    return FinishedGoodsRollOut(
        id=str(roll.id),
        rollBarcode=roll.roll_code,
        orderId=order_id,
        orderNumber=order_number,
        customerName=customer_name,
        fabricType=roll.fabric_type,
        color=color,
        gsm=roll.gsm or 210,
        widthInches=roll.width_inches or 58.0,
        netLengthMeters=roll.length_m,
        grossWeightKg=roll.weight_kg or round(roll.length_m * 0.21, 1),
        grade=roll.grade.value if roll.grade else "A",
        warehouseLocation=roll.current_location or "Finished Goods Bay A",
        status=_roll_status_to_frontend(roll.current_status),
        inspectionId=insp_id,
        inspectionDate=insp_date,
        inspectorName=insp_name,
    )


def _shipment_to_dispatch_record(shipment: Shipment, db: Session) -> DispatchRecordOut:
    """Convert a Shipment ORM object to the frontend DispatchRecord shape."""
    order_number = "N/A"
    customer_name = "Unknown"
    order_id = "0"
    if shipment.sales_order:
        order_number = shipment.sales_order.order_number
        order_id = str(shipment.sales_order.id)
        if shipment.customer:
            customer_name = shipment.customer.name

    roll_ids = [str(item.roll_id) for item in shipment.items]
    total_meters = sum(item.dispatched_quantity for item in shipment.items)
    total_rolls = len(shipment.items)
    gross_weight = round(total_meters * 0.21, 1)

    dispatched_at = "Pending"
    if shipment.dispatch_date:
        if isinstance(shipment.dispatch_date, datetime):
            dispatched_at = shipment.dispatch_date.strftime("%Y-%m-%d %H:%M")
        else:
            dispatched_at = str(shipment.dispatch_date)

    status_map = {
        ShipmentStatus.DRAFT: "staged",
        ShipmentStatus.PACKED: "staged",
        ShipmentStatus.DISPATCHED: "in_transit",
        ShipmentStatus.IN_TRANSIT: "in_transit",
        ShipmentStatus.DELIVERED: "delivered",
        ShipmentStatus.CANCELLED: "staged",
    }

    # Get invoice number from linked finance records if available
    invoice_number = None
    try:
        from app.models.finance import Invoice
        inv = db.query(Invoice).filter(Invoice.sales_order_id == shipment.sales_order_id).first()
        if inv:
            invoice_number = inv.invoice_number
    except Exception:
        pass

    return DispatchRecordOut(
        id=str(shipment.id),
        dispatchNumber=shipment.shipment_number,
        orderId=order_id,
        orderNumber=order_number,
        customerName=customer_name,
        destinationCity=_extract_city(shipment.destination_address),
        destinationAddress=shipment.destination_address or "Address on file",
        carrierName=shipment.carrier or "DHL Global Forwarding",
        trackingNumber=shipment.tracking_reference or "TRK-PENDING",
        vehicleNumber=shipment.vehicle_number or "N/A",
        driverName="Driver Assigned",
        driverPhone="+91 98450 00000",
        rollIds=roll_ids,
        totalMeters=round(total_meters, 1),
        totalRolls=total_rolls,
        grossWeightKg=gross_weight,
        dispatchedAt=dispatched_at,
        dispatchedBy="Dispatch Team",
        status=status_map.get(shipment.status, "staged"),
        challanNumber=f"DC-{shipment.id:04d}-{shipment.created_at.year}",
        invoiceNumber=invoice_number,
        notes=shipment.notes,
    )


def _extract_city(address: Optional[str]) -> str:
    if not address:
        return "N/A"
    parts = address.split(",")
    if len(parts) >= 2:
        return ", ".join(p.strip() for p in parts[-2:])
    return address[:50]


@router.get("/shipments", response_model=List[ShipmentRead], summary="List shipments")
def list_shipments(
    status: Optional[ShipmentStatus] = Query(None),
    sales_order_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_shipments(db, current_user=current_user, status=status, sales_order_id=sales_order_id, skip=skip, limit=limit)
    result = []
    for s in items:
        tot_rolls = len(s.items)
        tot_m = sum(item.dispatched_quantity for item in s.items)
        read_obj = ShipmentRead.model_validate(s)
        read_obj.total_rolls = tot_rolls
        read_obj.total_meterage = round(tot_m, 2)
        result.append(read_obj)
    return result


@router.post("/shipments", response_model=ShipmentRead, status_code=status.HTTP_201_CREATED, summary="Create shipment packing order")
def add_shipment(
    shipment_in: ShipmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.DISPATCH])),
):
    shipment = create_shipment(db, shipment_in, current_user)
    read_obj = ShipmentRead.model_validate(shipment)
    read_obj.total_rolls = len(shipment.items)
    read_obj.total_meterage = sum(i.dispatched_quantity for i in shipment.items)
    return read_obj


@router.get("/shipments/{shipment_id}", response_model=ShipmentRead, summary="Get shipment details")
def get_shipment(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shipment = get_shipment_by_id(db, shipment_id, current_user)
    read_obj = ShipmentRead.model_validate(shipment)
    read_obj.total_rolls = len(shipment.items)
    read_obj.total_meterage = sum(i.dispatched_quantity for i in shipment.items)
    return read_obj


@router.post("/shipments/{shipment_id}/items", response_model=ShipmentItemRead, status_code=status.HTTP_201_CREATED, summary="Add verified roll to shipment")
def add_roll_item(
    shipment_id: int,
    item_in: ShipmentItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.DISPATCH])),
):
    """Enforces quality pass status and duplicate prevention before adding roll."""
    item = add_item_to_shipment(db, shipment_id, item_in.roll_id, item_in.dispatched_quantity, current_user)
    return ShipmentItemRead.model_validate(item)


@router.post("/dispatch/shipments/{shipment_id}/confirm", response_model=ShipmentConfirmResponse, summary="Confirm shipment dispatch", include_in_schema=False)
@router.post("/shipments/{shipment_id}/confirm", response_model=ShipmentConfirmResponse, summary="Confirm shipment dispatch (Atomic)")
def confirm_dispatch(
    shipment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.DISPATCH])),
):
    """Executes atomic confirmation, marks rolls as dispatched, generates tracking reference, and updates sales order."""
    return confirm_shipment_dispatch(db, shipment_id, current_user)


# ──────────────────────────────────────────────────────────────────────────────
# Frontend-compatible endpoints for Dispatch & Store Shelf Console
# ──────────────────────────────────────────────────────────────────────────────

@router.get(
    "/finished-goods",
    response_model=List[FinishedGoodsRollOut],
    summary="List finished goods rolls (Dispatch Console format)",
)
def list_finished_goods(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter: in_warehouse|staged_for_dispatch|dispatched"),
    order_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all fabric rolls in the Dispatch Console shape — ready for barcode scanning and packing verification."""
    query = db.query(FabricRoll)

    if order_id:
        query = query.filter(FabricRoll.sales_order_id == order_id)

    # Map frontend status filter to DB RollStatus values
    if status_filter == "in_warehouse":
        query = query.filter(FabricRoll.current_status.in_([
            RollStatus.PASS, RollStatus.HOLD, RollStatus.REWORK, RollStatus.REJECTED, RollStatus.UNINSPECTED
        ]))
    elif status_filter == "staged_for_dispatch":
        query = query.filter(FabricRoll.current_status == RollStatus.ALLOCATED_FOR_DISPATCH)
    elif status_filter == "dispatched":
        query = query.filter(FabricRoll.current_status == RollStatus.DISPATCHED)

    rolls = query.order_by(FabricRoll.created_at.desc()).offset(skip).limit(limit).all()
    return [_roll_to_out(r, db) for r in rolls]


@router.get(
    "/records",
    response_model=List[DispatchRecordOut],
    summary="List dispatch records (historical shipments in Dispatch Console format)",
)
def list_dispatch_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Returns all confirmed shipment records in the frontend DispatchRecord shape."""
    shipments = (
        db.query(Shipment)
        .options(
            joinedload(Shipment.items),
            joinedload(Shipment.sales_order).joinedload(SalesOrder.customer),
            joinedload(Shipment.customer),
        )
        .filter(Shipment.status.in_([
            ShipmentStatus.DISPATCHED,
            ShipmentStatus.IN_TRANSIT,
            ShipmentStatus.DELIVERED,
        ]))
        .order_by(Shipment.dispatch_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_shipment_to_dispatch_record(s, db) for s in shipments]

