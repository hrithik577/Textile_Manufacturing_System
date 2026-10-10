from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.dispatch import ShipmentStatus
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
