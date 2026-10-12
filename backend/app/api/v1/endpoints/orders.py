from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.order import OrderStatus, OrderPriority
from app.schemas.order import (
    SalesOrderRead,
    SalesOrderCreate,
    PortalOrderPlacementCreate,
    SalesOrderUpdate,
    SalesOrderListResponse,
    OrderTimelineResponse,
    OrderCostSummaryResponse,
)
from app.services.order_service import (
    get_orders,
    get_order_by_id,
    create_order,
    place_portal_order,
    update_order_status,
    get_order_timeline,
    get_order_cost_summary,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/place", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED, summary="Place order via Buyer / Client Portal")
def place_order_from_portal(
    portal_in: PortalOrderPlacementCreate,
    db: Session = Depends(get_db),
):
    """Client/Buyer portal order placement endpoint. Automatically finds/creates client account, calculates totals, and creates sales order."""
    order = place_portal_order(db=db, portal_in=portal_in)
    return SalesOrderRead.model_validate(order)


@router.get("", response_model=SalesOrderListResponse, summary="List sales orders")
def list_orders(
    status: Optional[OrderStatus] = Query(None, description="Filter by order status"),
    priority: Optional[OrderPriority] = Query(None, description="Filter by priority"),
    customer_id: Optional[int] = Query(None, description="Filter by customer ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve sales orders. For buyer users, strictly filtered to their own customer ID."""
    skip = (page - 1) * page_size
    items, total = get_orders(
        db=db,
        current_user=current_user,
        status=status,
        customer_id=customer_id,
        priority=priority,
        skip=skip,
        limit=page_size,
    )
    return SalesOrderListResponse(
        items=[SalesOrderRead.model_validate(o) for o in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=SalesOrderRead, status_code=status.HTTP_201_CREATED, summary="Create a new sales order")
def add_order(
    order_in: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Create a new sales order with line items. Recalculates total price securely on backend."""
    order = create_order(db=db, order_in=order_in, current_user=current_user)
    return SalesOrderRead.model_validate(order)


@router.get("/{order_id}", response_model=SalesOrderRead, summary="Get sales order by ID")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieve sales order details with items. Validates buyer isolation boundary."""
    order = get_order_by_id(db, order_id, current_user)
    return SalesOrderRead.model_validate(order)


@router.patch("/{order_id}", response_model=SalesOrderRead, summary="Update sales order status")
def patch_order(
    order_id: int,
    update_in: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION, UserRole.FINANCE])),
):
    """Update order status or metadata. Restricted from buyer role."""
    order = update_order_status(db, order_id, update_in, current_user)
    return SalesOrderRead.model_validate(order)


@router.get("/{order_id}/timeline", response_model=OrderTimelineResponse, summary="Get order end-to-end milestone timeline")
def get_timeline(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Traces full lifecycle from placement -> weaving -> quality inspection -> dispatch."""
    return get_order_timeline(db, order_id, current_user)


@router.get("/{order_id}/cost-summary", response_model=OrderCostSummaryResponse, summary="Get order financial & cost breakdown")
def get_cost_summary(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    """Calculates revenue vs raw materials, electricity, labor, overheads, and margin."""
    return get_order_cost_summary(db, order_id, current_user)
