from datetime import date, datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.exceptions import NotFoundException, ConflictException, UnauthorizedAccessException
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.order import SalesOrder, SalesOrderItem, OrderStatus, OrderPriority
from app.models.production import ProductionOrder, ProductionStatus, MachineEvent, ProductionEvent
from app.models.quality import FabricRoll, QualityInspection, RollStatus
from app.models.dispatch import Shipment, ShipmentItem, ShipmentStatus
from app.models.finance import CostEntry, Invoice, Payment, CostCategory
from app.schemas.order import (
    SalesOrderCreate,
    PortalOrderPlacementCreate,
    SalesOrderUpdate,
    OrderTimelineResponse,
    OrderTimelineEvent,
    OrderCostSummaryResponse,
)
from app.services.audit_service import log_audit_event


def get_orders(
    db: Session,
    current_user: User,
    status: Optional[OrderStatus] = None,
    customer_id: Optional[int] = None,
    priority: Optional[OrderPriority] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[SalesOrder], int]:
    query = db.query(SalesOrder)
    
    # Enforce buyer tenant isolation
    if current_user.role == UserRole.BUYER:
        if not current_user.customer_id:
            return [], 0
        query = query.filter(SalesOrder.customer_id == current_user.customer_id)
    elif customer_id:
        query = query.filter(SalesOrder.customer_id == customer_id)
        
    if status:
        query = query.filter(SalesOrder.status == status)
    if priority:
        query = query.filter(SalesOrder.priority == priority)
        
    total = query.count()
    orders = query.order_by(SalesOrder.created_at.desc()).offset(skip).limit(limit).all()
    return orders, total


def get_order_by_id(db: Session, order_id: int, current_user: User) -> SalesOrder:
    order = db.query(SalesOrder).filter(SalesOrder.id == order_id).first()
    if not order:
        raise NotFoundException("SalesOrder", order_id)
        
    # Enforce buyer tenant isolation
    if current_user.role == UserRole.BUYER:
        if current_user.customer_id != order.customer_id:
            raise UnauthorizedAccessException("You do not have permission to access orders from another customer.")
            
    return order


def create_order(db: Session, order_in: SalesOrderCreate, current_user: User) -> SalesOrder:
    existing = db.query(SalesOrder).filter(SalesOrder.order_number == order_in.order_number).first()
    if existing:
        raise ConflictException(f"Order with number '{order_in.order_number}' already exists.")
        
    # If buyer creates order, ensure customer_id matches their assigned account
    if current_user.role == UserRole.BUYER:
        if not current_user.customer_id:
            raise UnauthorizedAccessException("Buyer account is not assigned to a customer.")
        customer_id = current_user.customer_id
    else:
        customer_id = order_in.customer_id
        
    # Calculate item totals and overall order value
    total_amount = 0.0
    items_to_add = []
    
    for item in order_in.items:
        line_total = round(item.target_quantity * item.unit_price, 2)
        total_amount += line_total
        items_to_add.append(
            SalesOrderItem(
                fabric_type=item.fabric_type,
                color_code=item.color_code,
                gsm=item.gsm,
                width_inches=item.width_inches,
                target_quantity=item.target_quantity,
                unit=item.unit,
                unit_price=item.unit_price,
                total_price=line_total,
                notes=item.notes,
            )
        )
        
    sales_order = SalesOrder(
        order_number=order_in.order_number,
        customer_id=customer_id,
        order_date=order_in.order_date,
        required_delivery_date=order_in.required_delivery_date,
        status=OrderStatus.CONFIRMED,
        priority=order_in.priority,
        currency=order_in.currency,
        total_amount=round(total_amount, 2),
        notes=order_in.notes,
        items=items_to_add,
    )
    
    db.add(sales_order)
    db.flush()
    
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="create_sales_order",
        entity_type="sales_order",
        entity_id=str(sales_order.id),
        changes_summary={"order_number": sales_order.order_number, "total_amount": total_amount},
    )
    
    db.commit()
    db.refresh(sales_order)
    return sales_order


def place_portal_order(db: Session, portal_in: PortalOrderPlacementCreate) -> SalesOrder:
    # 1. Find or create Customer
    customer = db.query(Customer).filter(
        (Customer.email == portal_in.customer_email) | (Customer.name == portal_in.customer_company)
    ).first()
    
    if not customer:
        clean_code = "CUST-" + "".join(c for c in portal_in.customer_company.upper() if c.isalnum())[:6]
        count = db.query(Customer).filter(Customer.code.like(f"{clean_code}%")).count()
        if count > 0:
            clean_code = f"{clean_code}{count + 1}"
            
        customer = Customer(
            code=clean_code,
            name=portal_in.customer_company,
            contact_person=portal_in.customer_name,
            email=portal_in.customer_email,
            phone=portal_in.customer_phone,
            address=portal_in.delivery_destination or "Standard Delivery Hub",
            payment_terms_days=30,
            is_active=True,
        )
        db.add(customer)
        db.flush()
        
    # 2. Generate unique order number SO-2026-XXX
    existing_count = db.query(SalesOrder).count()
    order_num = f"SO-2026-{existing_count + 1:03d}"
    while db.query(SalesOrder).filter(SalesOrder.order_number == order_num).first():
        existing_count += 1
        order_num = f"SO-2026-{existing_count + 1:03d}"
        
    # 3. Process line items
    total_amount = 0.0
    items_to_add = []
    for item in portal_in.items:
        line_total = round(item.target_quantity * item.unit_price, 2)
        total_amount += line_total
        items_to_add.append(
            SalesOrderItem(
                fabric_type=item.fabric_type,
                color_code=item.color_code,
                gsm=item.gsm,
                width_inches=item.width_inches,
                target_quantity=item.target_quantity,
                unit=item.unit,
                unit_price=item.unit_price,
                total_price=line_total,
                notes=item.notes,
            )
        )
        
    sales_order = SalesOrder(
        order_number=order_num,
        customer_id=customer.id,
        order_date=date.today(),
        required_delivery_date=portal_in.required_delivery_date,
        status=OrderStatus.CONFIRMED,
        priority=portal_in.priority,
        currency=portal_in.currency,
        total_amount=round(total_amount, 2),
        notes=f"Placed via Buyer Portal | PO: {portal_in.customer_po or 'N/A'} | Destination: {portal_in.delivery_destination or 'Default'} | {portal_in.notes or ''}",
        items=items_to_add,
    )
    db.add(sales_order)
    db.flush()
    
    first_user = db.query(User).first()
    log_audit_event(
        db=db,
        actor_id=first_user.id if first_user else 1,
        action="portal_order_placed",
        entity_type="sales_order",
        entity_id=str(sales_order.id),
        changes_summary={
            "order_number": sales_order.order_number,
            "buyer_company": portal_in.customer_company,
            "total_amount": total_amount,
            "currency": portal_in.currency,
        },
    )
    
    db.commit()
    db.refresh(sales_order)
    return sales_order


def update_order_status(
    db: Session,
    order_id: int,
    update_data: SalesOrderUpdate,
    current_user: User,
) -> SalesOrder:
    order = get_order_by_id(db, order_id, current_user)
    
    if current_user.role == UserRole.BUYER:
        raise UnauthorizedAccessException("Buyers cannot modify internal order processing status.")
        
    old_status = order.status
    if update_data.status:
        order.status = update_data.status
    if update_data.priority:
        order.priority = update_data.priority
    if update_data.required_delivery_date:
        order.required_delivery_date = update_data.required_delivery_date
    if update_data.notes is not None:
        order.notes = update_data.notes
        
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="update_sales_order",
        entity_type="sales_order",
        entity_id=str(order.id),
        changes_summary={"old_status": old_status.value, "new_status": order.status.value},
    )
    
    db.commit()
    db.refresh(order)
    return order


def get_order_timeline(db: Session, order_id: int, current_user: User) -> OrderTimelineResponse:
    order = get_order_by_id(db, order_id, current_user)
    events: List[OrderTimelineEvent] = []
    
    # 1. Order Creation
    events.append(
        OrderTimelineEvent(
            timestamp=order.created_at,
            event_type="order_placed",
            title="Order Placed & Confirmed",
            description=f"Sales Order #{order.order_number} confirmed for customer {order.customer.name if order.customer else 'Customer'}.",
            actor="Sales System",
            status="completed",
        )
    )
    
    # 2. Production Orders
    pos = db.query(ProductionOrder).filter(ProductionOrder.sales_order_id == order.id).all()
    for po in pos:
        events.append(
            OrderTimelineEvent(
                timestamp=po.created_at,
                event_type="production_scheduled",
                title=f"Production Order Scheduled ({po.production_order_number})",
                description=f"Target: {po.target_quantity} {po.unit}, Status: {po.status.value}.",
                status="completed" if po.status in [ProductionStatus.IN_PROGRESS, ProductionStatus.COMPLETED] else "scheduled",
            )
        )
        if po.actual_start_date:
            events.append(
                OrderTimelineEvent(
                    timestamp=po.actual_start_date,
                    event_type="production_started",
                    title=f"Weaving & Processing Commenced",
                    description=f"Active on production line for PO #{po.production_order_number}.",
                    status="in_progress",
                )
            )
        if po.actual_end_date or po.status == ProductionStatus.COMPLETED:
            events.append(
                OrderTimelineEvent(
                    timestamp=po.actual_end_date or po.updated_at,
                    event_type="production_completed",
                    title=f"Fabric Production Completed",
                    description=f"Total completed: {po.completed_quantity} {po.unit}.",
                    status="completed",
                )
            )

    # 3. Quality Inspections & Fabric Rolls
    rolls = db.query(FabricRoll).filter(FabricRoll.sales_order_id == order.id).all()
    for roll in rolls:
        for ins in roll.inspections:
            events.append(
                OrderTimelineEvent(
                    timestamp=ins.inspection_date,
                    event_type="quality_inspection",
                    title=f"Quality Inspection ({ins.result.value.upper()})",
                    description=f"Roll #{roll.roll_code} inspected. Defects: {ins.defect_count}. Disposition: {ins.disposition}.",
                    actor=ins.inspector.name if ins.inspector else "Quality Team",
                    status="completed" if ins.result == "pass" else "warning",
                )
            )

    # 4. Shipments
    shipments = db.query(Shipment).filter(Shipment.sales_order_id == order.id).all()
    for shp in shipments:
        events.append(
            OrderTimelineEvent(
                timestamp=shp.created_at,
                event_type="shipment_created",
                title=f"Shipment #{shp.shipment_number} Prepared",
                description=f"Carrier: {shp.carrier}. Status: {shp.status.value}.",
                status="in_progress",
            )
        )
        if shp.dispatch_date:
            events.append(
                OrderTimelineEvent(
                    timestamp=shp.dispatch_date,
                    event_type="dispatched",
                    title=f"Dispatched via {shp.carrier}",
                    description=f"Tracking reference: {shp.tracking_reference or 'Pending carrier scan'}. Destination: {shp.destination_address or 'Customer facility'}.",
                    status="completed",
                )
            )

    # Sort timeline chronologically
    events.sort(key=lambda x: x.timestamp)
    
    # Calculate progress percentage
    progress = 10.0
    if order.status == OrderStatus.CONFIRMED:
        progress = 20.0
    elif order.status == OrderStatus.IN_PRODUCTION:
        progress = 50.0
    elif order.status == OrderStatus.QUALITY_CHECK:
        progress = 75.0
    elif order.status == OrderStatus.READY_FOR_DISPATCH:
        progress = 85.0
    elif order.status == OrderStatus.PARTIALLY_DISPATCHED:
        progress = 90.0
    elif order.status == OrderStatus.COMPLETED:
        progress = 100.0

    return OrderTimelineResponse(
        order_id=order.id,
        order_number=order.order_number,
        status=order.status,
        current_progress_pct=progress,
        timeline=events,
    )


def get_order_cost_summary(db: Session, order_id: int, current_user: User) -> OrderCostSummaryResponse:
    order = get_order_by_id(db, order_id, current_user)
    
    # Buyers must not see internal production cost breakdowns or factory margins
    if current_user.role == UserRole.BUYER:
        raise UnauthorizedAccessException("Internal cost breakdowns are confidential and restricted from buyer accounts.")
        
    cost_entries = db.query(CostEntry).filter(CostEntry.sales_order_id == order.id).all()
    
    raw_material_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.RAW_MATERIAL)
    electricity_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.ELECTRICITY)
    labor_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.LABOR)
    dye_chemical_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.DYE_CHEMICAL)
    overhead_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.OVERHEAD)
    maintenance_cost = sum(c.amount for c in cost_entries if c.category == CostCategory.MAINTENANCE)
    
    total_production_cost = round(
        raw_material_cost + electricity_cost + labor_cost + dye_chemical_cost + overhead_cost + maintenance_cost,
        2
    )
    
    invoices = db.query(Invoice).filter(Invoice.sales_order_id == order.id).all()
    total_invoiced = round(sum(inv.total_amount for inv in invoices), 2)
    total_paid = round(sum(inv.paid_amount for inv in invoices), 2)
    outstanding_balance = round(order.total_amount - total_paid, 2)
    
    gross_margin = round(order.total_amount - total_production_cost, 2)
    gross_margin_pct = round((gross_margin / order.total_amount * 100) if order.total_amount > 0 else 0.0, 2)

    return OrderCostSummaryResponse(
        order_id=order.id,
        order_number=order.order_number,
        currency=order.currency,
        agreed_order_value=order.total_amount,
        total_invoiced=total_invoiced,
        total_paid=total_paid,
        outstanding_balance=outstanding_balance,
        raw_material_cost=round(raw_material_cost, 2),
        electricity_cost=round(electricity_cost, 2),
        labor_cost=round(labor_cost, 2),
        dye_chemical_cost=round(dye_chemical_cost, 2),
        overhead_cost=round(overhead_cost, 2),
        maintenance_cost=round(maintenance_cost, 2),
        total_production_cost=total_production_cost,
        estimated_gross_margin=gross_margin,
        gross_margin_percentage=gross_margin_pct,
    )
