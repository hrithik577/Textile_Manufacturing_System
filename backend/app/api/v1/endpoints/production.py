from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.production import ProductionStatus, ProductionEvent
from app.schemas.production import (
    ProductionOrderRead,
    ProductionOrderCreate,
    ProductionEventCreate,
    ProductionEventRead,
    PlantOEEResponse,
)
from app.services.production_service import (
    get_production_orders,
    get_production_order_by_id,
    create_production_order,
    record_production_event,
)
from app.services.oee_service import calculate_plant_oee

router = APIRouter(prefix="/production", tags=["Production"])


@router.get("/orders", response_model=List[ProductionOrderRead], summary="List production orders")
def list_production_orders(
    status: Optional[ProductionStatus] = Query(None),
    sales_order_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_production_orders(db, status=status, sales_order_id=sales_order_id, skip=skip, limit=limit)
    return [ProductionOrderRead.model_validate(po) for po in items]


@router.post("/orders", response_model=ProductionOrderRead, status_code=status.HTTP_201_CREATED, summary="Create a production order")
def add_production_order(
    po_in: ProductionOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    po = create_production_order(db, po_in, current_user)
    return ProductionOrderRead.model_validate(po)


@router.get("/orders/{production_order_id}", response_model=ProductionOrderRead, summary="Get production order by ID")
def get_production_order(
    production_order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    po = get_production_order_by_id(db, production_order_id)
    return ProductionOrderRead.model_validate(po)


@router.get("/events", response_model=List[ProductionEventRead], summary="List production events")
def list_production_events(
    production_order_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(ProductionEvent)
    if production_order_id:
        query = query.filter(ProductionEvent.production_order_id == production_order_id)
    events = query.order_by(ProductionEvent.event_timestamp.desc()).offset(skip).limit(limit).all()
    return [ProductionEventRead.model_validate(e) for e in events]


@router.post("/events", response_model=ProductionEventRead, status_code=status.HTTP_201_CREATED, summary="Record production event")
def add_production_event(
    event_in: ProductionEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    event, _ = record_production_event(db, event_in, current_user)
    return ProductionEventRead.model_validate(event)


@router.get("/oee", response_model=PlantOEEResponse, summary="Get standard industrial OEE calculation and machine breakdown")
def get_plant_oee(
    start_time: Optional[datetime] = Query(None, description="Window start timestamp (ISO 8601)"),
    end_time: Optional[datetime] = Query(None, description="Window end timestamp (ISO 8601)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Standard Defensible OEE calculation: Availability × Performance × Quality.
    - Availability: Run Time / Planned Time (merges overlapping downtime events).
    - Performance: Actual Output / (rated_speed_mpm × Run Time).
    - Quality: First-Pass Good Output / Total Inspected Output (reworks excluded).
    """
    return calculate_plant_oee(db, start_dt=start_time, end_dt=end_time)

