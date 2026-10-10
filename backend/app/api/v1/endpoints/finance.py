from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.finance import CostCategory, InvoiceStatus
from app.schemas.finance import (
    CostEntryRead,
    CostEntryCreate,
    InvoiceRead,
    InvoiceCreate,
    PaymentRead,
    PaymentCreate,
    FinanceSummaryResponse,
    ClosingTheBooksResponse,
)
from app.services.finance_service import (
    get_cost_entries,
    create_cost_entry,
    get_invoices,
    create_invoice,
    record_payment,
    get_finance_summary,
    get_closing_the_books_data,
)

router = APIRouter(prefix="/finance", tags=["Finance & Invoicing"])


@router.get("/summary", response_model=FinanceSummaryResponse, summary="Get overall factory financial clarity summary")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    """Calculates total revenue, invoicing, cash collected, production costs, and factory margins."""
    return get_finance_summary(db, current_user)


@router.get("/closing-the-books", response_model=ClosingTheBooksResponse, summary="Get dynamic Month-End Financial Closing & P&L Reconciliation")
def get_closing_the_books(
    period: str = Query("October 2026"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    """Authoritative P&L, order margins, machine yields, and worker payroll queried from live PostgreSQL."""
    return get_closing_the_books_data(db, current_user, period=period)


@router.get("/cost-entries", response_model=List[CostEntryRead], summary="List production and operational cost entries")
def list_cost_entries(
    category: Optional[CostCategory] = Query(None),
    sales_order_id: Optional[int] = Query(None),
    production_order_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    items, _ = get_cost_entries(
        db,
        current_user=current_user,
        category=category,
        sales_order_id=sales_order_id,
        production_order_id=production_order_id,
        skip=skip,
        limit=limit,
    )
    return [CostEntryRead.model_validate(c) for c in items]


@router.post("/cost-entries", response_model=CostEntryRead, status_code=status.HTTP_201_CREATED, summary="Record a cost entry")
def add_cost_entry(
    cost_in: CostEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    entry = create_cost_entry(db, cost_in, current_user)
    return CostEntryRead.model_validate(entry)


@router.get("/invoices", response_model=List[InvoiceRead], summary="List customer invoices")
def list_invoices(
    customer_id: Optional[int] = Query(None),
    status: Optional[InvoiceStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_invoices(db, current_user=current_user, customer_id=customer_id, status=status, skip=skip, limit=limit)
    return [InvoiceRead.model_validate(inv) for inv in items]


@router.post("/invoices", response_model=InvoiceRead, status_code=status.HTTP_201_CREATED, summary="Create a customer invoice")
def add_invoice(
    invoice_in: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    invoice = create_invoice(db, invoice_in, current_user)
    return InvoiceRead.model_validate(invoice)


@router.post("/payments", response_model=PaymentRead, status_code=status.HTTP_201_CREATED, summary="Record customer invoice payment")
def add_payment(
    payment_in: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.FINANCE])),
):
    payment = record_payment(db, payment_in, current_user)
    return PaymentRead.model_validate(payment)
