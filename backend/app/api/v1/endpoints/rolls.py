from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.quality import RollStatus, RollGrade
from app.schemas.quality import (
    FabricRollRead,
    FabricRollCreate,
    RollGenealogyResponse,
)
from app.services.quality_service import (
    get_fabric_rolls,
    get_fabric_roll_by_id,
    create_fabric_roll,
    get_roll_genealogy,
)

router = APIRouter(prefix="/rolls", tags=["Fabric Rolls & Genealogy"])


@router.get("", response_model=List[FabricRollRead], summary="List fabric rolls")
def list_rolls(
    status: Optional[RollStatus] = Query(None),
    sales_order_id: Optional[int] = Query(None),
    production_order_id: Optional[int] = Query(None),
    grade: Optional[RollGrade] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_fabric_rolls(
        db,
        status=status,
        sales_order_id=sales_order_id,
        production_order_id=production_order_id,
        grade=grade,
        skip=skip,
        limit=limit,
    )
    return [FabricRollRead.model_validate(r) for r in items]


@router.post("", response_model=FabricRollRead, status_code=status.HTTP_201_CREATED, summary="Create fabric roll barcode record")
def add_roll(
    roll_in: FabricRollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION, UserRole.QUALITY])),
):
    roll = create_fabric_roll(db, roll_in, current_user)
    return FabricRollRead.model_validate(roll)


@router.get("/{roll_id}", response_model=FabricRollRead, summary="Get fabric roll by ID or code")
def get_roll(
    roll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    roll = get_fabric_roll_by_id(db, roll_id)
    return FabricRollRead.model_validate(roll)


@router.get("/{roll_id}/genealogy", response_model=RollGenealogyResponse, summary="Get full end-to-end roll genealogy tree")
def get_genealogy(
    roll_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Traces full roll lineage: customer order -> production order -> loom machine -> inspections -> shipment."""
    return get_roll_genealogy(db, roll_id)
