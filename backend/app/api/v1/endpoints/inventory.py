from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.inventory import MaterialType, MovementType
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
