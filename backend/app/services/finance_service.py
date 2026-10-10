from datetime import datetime, timezone
from typing import List, Optional, Tuple, Dict
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import NotFoundException, ConflictException, UnauthorizedAccessException
from app.models.user import User, UserRole
from app.models.finance import (
    CostEntry,
    Invoice,
    Payment,
    CostCategory,
    InvoiceStatus,
    PaymentMethod,
)
from app.models.order import SalesOrder, OrderStatus
from app.schemas.finance import (
    CostEntryCreate,
    InvoiceCreate,
    PaymentCreate,
    FinanceSummaryResponse,
)
from app.services.audit_service import log_audit_event


def get_cost_entries(
    db: Session,
    current_user: User,
    category: Optional[CostCategory] = None,
    sales_order_id: Optional[int] = None,
    production_order_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[CostEntry], int]:
    # Cost entries are confidential from buyer accounts
    if current_user.role == UserRole.BUYER:
        raise UnauthorizedAccessException("Cost entries are confidential and restricted from buyer accounts.")
        
    query = db.query(CostEntry)
    if category:
        query = query.filter(CostEntry.category == category)
    if sales_order_id:
        query = query.filter(CostEntry.sales_order_id == sales_order_id)
    if production_order_id:
        query = query.filter(CostEntry.production_order_id == production_order_id)
        
    total = query.count()
    items = query.order_by(CostEntry.entry_timestamp.desc()).offset(skip).limit(limit).all()
    return items, total


def create_cost_entry(
    db: Session,
    cost_in: CostEntryCreate,
    current_user: User,
) -> CostEntry:
    if current_user.role == UserRole.BUYER:
        raise UnauthorizedAccessException("Cost recording is restricted.")
        
    entry = CostEntry(
        category=cost_in.category,
        amount=cost_in.amount,
        currency=cost_in.currency,
        sales_order_id=cost_in.sales_order_id,
        production_order_id=cost_in.production_order_id,
        description=cost_in.description,
        entry_timestamp=datetime.now(timezone.utc),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_invoices(
    db: Session,
    current_user: User,
    customer_id: Optional[int] = None,
    status: Optional[InvoiceStatus] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Invoice], int]:
    query = db.query(Invoice)
    
    # Buyer data isolation
    if current_user.role == UserRole.BUYER:
        if not current_user.customer_id:
            return [], 0
        query = query.filter(Invoice.customer_id == current_user.customer_id)
    elif customer_id:
        query = query.filter(Invoice.customer_id == customer_id)
        
    if status:
        query = query.filter(Invoice.status == status)
        
    total = query.count()
    items = query.order_by(Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def create_invoice(
    db: Session,
    invoice_in: InvoiceCreate,
    current_user: User,
) -> Invoice:
    existing = db.query(Invoice).filter(Invoice.invoice_number == invoice_in.invoice_number).first()
    if existing:
        raise ConflictException(f"Invoice '{invoice_in.invoice_number}' already exists.")
        
    invoice = Invoice(
        invoice_number=invoice_in.invoice_number,
        customer_id=invoice_in.customer_id,
        sales_order_id=invoice_in.sales_order_id,
        total_amount=invoice_in.total_amount,
        paid_amount=0.0,
        currency=invoice_in.currency,
        status=InvoiceStatus.ISSUED,
        issue_date=invoice_in.issue_date,
        due_date=invoice_in.due_date,
        notes=invoice_in.notes,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


def record_payment(
    db: Session,
    payment_in: PaymentCreate,
    current_user: User,
) -> Payment:
    invoice = db.query(Invoice).filter(Invoice.id == payment_in.invoice_id).first()
    if not invoice:
        raise NotFoundException("Invoice", payment_in.invoice_id)
        
    payment = Payment(
        invoice_id=invoice.id,
        amount=payment_in.amount,
        payment_date=payment_in.payment_date,
        payment_method=payment_in.payment_method,
        reference_number=payment_in.reference_number,
        notes=payment_in.notes,
    )
    db.add(payment)
    
    # Update invoice paid balance and status
    invoice.paid_amount += payment_in.amount
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = InvoiceStatus.PAID
    elif invoice.paid_amount > 0:
        invoice.status = InvoiceStatus.PARTIALLY_PAID
        
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="record_payment",
        entity_type="invoice",
        entity_id=str(invoice.id),
        changes_summary={"paid_amount": payment_in.amount, "invoice_status": invoice.status.value},
    )

    db.commit()
    db.refresh(payment)
    return payment


def get_finance_summary(db: Session, current_user: User) -> FinanceSummaryResponse:
    if current_user.role == UserRole.BUYER:
        raise UnauthorizedAccessException("Factory financial health summary is restricted from buyer accounts.")
        
    # Total revenue booked from confirmed/active/completed sales orders
    total_revenue_booked = (
        db.query(func.sum(SalesOrder.total_amount))
        .filter(SalesOrder.status != OrderStatus.CANCELLED)
        .scalar()
        or 0.0
    )
    
    # Total invoiced and cash collected
    total_invoiced = db.query(func.sum(Invoice.total_amount)).scalar() or 0.0
    total_collected_cash = db.query(func.sum(Invoice.paid_amount)).scalar() or 0.0
    outstanding_receivables = round(total_invoiced - total_collected_cash, 2)
    
    # Cost entries grouped by category
    cost_entries = db.query(CostEntry).all()
    costs_by_category: Dict[str, float] = {
        "raw_material": 0.0,
        "electricity": 0.0,
        "labor": 0.0,
        "dye_chemical": 0.0,
        "overhead": 0.0,
        "maintenance": 0.0,
    }
    for c in cost_entries:
        cat_key = c.category.value
        costs_by_category[cat_key] = round(costs_by_category.get(cat_key, 0.0) + c.amount, 2)
        
    total_production_costs = round(sum(costs_by_category.values()), 2)
    gross_margin = round(total_revenue_booked - total_production_costs, 2)
    gross_margin_pct = round((gross_margin / total_revenue_booked * 100) if total_revenue_booked > 0 else 0.0, 2)

    return FinanceSummaryResponse(
        currency="USD",
        total_revenue_booked=round(total_revenue_booked, 2),
        total_invoiced=round(total_invoiced, 2),
        total_collected_cash=round(total_collected_cash, 2),
        outstanding_receivables=outstanding_receivables,
        total_production_costs=total_production_costs,
        gross_factory_margin=gross_margin,
        gross_margin_percentage=gross_margin_pct,
        costs_by_category=costs_by_category,
    )
