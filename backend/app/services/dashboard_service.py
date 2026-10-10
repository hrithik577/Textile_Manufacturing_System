from datetime import date, datetime, timedelta, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.order import SalesOrder, OrderStatus
from app.models.production import (
    ProductionOrder,
    ProductionStatus,
    Machine,
    MachineStatus,
    ProductionEvent,
)
from app.models.quality import FabricRoll, RollStatus, RollGrade
from app.models.inventory import Material
from app.models.workforce import AttendanceRecord
from app.models.finance import Invoice
from app.models.alert import Alert, AlertStatus, AlertSeverity
from app.schemas.dashboard import (
    DashboardSummaryResponse,
    ProductionTrendResponse,
    ProductionTrendPoint,
)


def get_dashboard_summary(db: Session) -> DashboardSummaryResponse:
    today = date.today()
    
    # Orders
    active_orders = (
        db.query(SalesOrder)
        .filter(SalesOrder.status.in_([OrderStatus.CONFIRMED, OrderStatus.IN_PRODUCTION, OrderStatus.QUALITY_CHECK, OrderStatus.READY_FOR_DISPATCH]))
        .count()
    )
    orders_in_prod = (
        db.query(ProductionOrder)
        .filter(ProductionOrder.status == ProductionStatus.IN_PROGRESS)
        .count()
    )
    
    # Rolls waiting dispatch
    pending_dispatch = (
        db.query(FabricRoll)
        .filter(FabricRoll.current_status.in_([RollStatus.PASS, RollStatus.ALLOCATED_FOR_DISPATCH]))
        .count()
    )
    
    # Alerts
    active_alerts = db.query(Alert).filter(Alert.status == AlertStatus.ACTIVE).count()
    critical_alerts = (
        db.query(Alert)
        .filter(Alert.status == AlertStatus.ACTIVE, Alert.severity == AlertSeverity.CRITICAL)
        .count()
    )
    
    # Low stock materials
    materials = db.query(Material).all()
    low_stock = sum(1 for m in materials if m.current_stock <= m.reorder_threshold)
    
    # Machines
    total_machines = db.query(Machine).count()
    running_machines = db.query(Machine).filter(Machine.status == MachineStatus.RUNNING).count()

    # Today's production output
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    today_output = (
        db.query(func.sum(ProductionEvent.quantity))
        .filter(ProductionEvent.event_timestamp >= today_start)
        .scalar()
        or 0.0
    )
    if today_output == 0.0:
        # Sum shift output from machine telemetry if present
        today_output = sum(float(m.shift_output_m or 0.0) for m in db.query(Machine).all())

    # Standard Defensible Industrial OEE Calculation
    from app.services.oee_service import calculate_plant_oee
    plant_oee_res = calculate_plant_oee(db)
    oee = plant_oee_res.oee_percentage if plant_oee_res.oee_percentage is not None else 0.0


    # Financials
    monthly_revenue = (
        db.query(func.sum(SalesOrder.total_amount))
        .filter(SalesOrder.status != OrderStatus.CANCELLED)
        .scalar()
        or 0.0
    )
    monthly_collected = db.query(func.sum(Invoice.paid_amount)).scalar() or 0.0

    # Active workers from actual attendance records
    active_workers = (
        db.query(AttendanceRecord)
        .filter(AttendanceRecord.date == today, AttendanceRecord.status == "present")
        .count()
    )

    return DashboardSummaryResponse(
        active_orders_count=active_orders,
        orders_in_production=orders_in_prod,
        pending_dispatch_rolls=pending_dispatch,
        active_alerts_count=active_alerts,
        critical_alerts_count=critical_alerts,
        low_stock_items_count=low_stock,
        running_machines_count=running_machines,
        total_machines_count=total_machines,
        overall_oee_percentage=oee,
        today_production_output_m=round(float(today_output), 1),
        monthly_revenue_booked=round(float(monthly_revenue), 2),
        monthly_collected_cash=round(float(monthly_collected), 2),
        active_workers_on_shift=active_workers,
    )


def get_production_trend(db: Session, days: int = 7) -> ProductionTrendResponse:
    today = date.today()
    trend_points: List[ProductionTrendPoint] = []

    total_target = 0.0
    total_actual = 0.0

    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        day_start = datetime.combine(d, datetime.min.time()).replace(tzinfo=timezone.utc)
        day_end = datetime.combine(d, datetime.max.time()).replace(tzinfo=timezone.utc)

        actual_output = (
            db.query(func.sum(ProductionEvent.quantity))
            .filter(ProductionEvent.event_timestamp >= day_start, ProductionEvent.event_timestamp <= day_end)
            .scalar()
            or 0.0
        )

        target = 3500.0
        scrap = round(float(actual_output) * 0.02, 1) if actual_output > 0 else 0.0
        eff = round((float(actual_output) / target * 100.0), 1) if (target > 0 and actual_output > 0) else 0.0

        total_target += target
        total_actual += float(actual_output)

        trend_points.append(
            ProductionTrendPoint(
                date=d.isoformat(),
                target_meterage=target,
                actual_meterage=round(float(actual_output), 1),
                efficiency_pct=eff,
                scrap_meterage=scrap,
            )
        )

    avg_eff = round((total_actual / total_target * 100.0) if total_target > 0 else 0.0, 1)

    return ProductionTrendResponse(
        trend_data=trend_points,
        total_actual_m=round(total_actual, 1),
        total_target_m=round(total_target, 1),
        average_efficiency_pct=avg_eff,
    )
