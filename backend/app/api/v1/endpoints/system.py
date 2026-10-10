from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.production import Machine, DataSourceType, MachineEvent, ProductionEvent, ProductionOrder, ProductionOperation
from app.models.order import SalesOrder, SalesOrderItem
from app.models.inventory import Material, MaterialLot, InventoryMovement
from app.models.quality import FabricRoll, QualityInspection
from app.models.dispatch import Shipment, ShipmentItem
from app.models.finance import Invoice, Payment, CostEntry
from app.models.alert import Alert, RecoveryPlan
from app.models.workforce import AttendanceRecord
from app.models.yarniq import (
    YarnPurchaseOrder,
    YarnPurchaseOrderLine,
    YarnGoodsReceipt,
    YarnGoodsReceiptLine,
    YarnLot,
    YarnReservation,
    YarnStockLedgerEntry,
    YarnRecommendation,
)
from app.db.seed import seed_database

router = APIRouter(prefix="/system", tags=["System Mode"])


@router.get("/mode", summary="Get active system mode (Live Factory vs Demo Factory)")
def get_system_mode(db: Session = Depends(get_db)):
    """
    Returns whether the system is operating in Live Factory or Demo Factory mode,
    along with dataset summary metrics.
    """
    machines_count = db.query(Machine).count()
    simulated_machines = (
        db.query(Machine)
        .filter(Machine.data_source == DataSourceType.SIMULATOR)
        .count()
    )
    sales_orders_count = db.query(SalesOrder).count()
    production_orders_count = db.query(ProductionOrder).count()
    rolls_count = db.query(FabricRoll).count()
    users_count = db.query(User).count()

    is_demo = simulated_machines > 0 or (
        db.query(MachineEvent)
        .filter(MachineEvent.data_source == DataSourceType.SIMULATOR)
        .first()
        is not None
    )

    mode = "demo" if is_demo else "live"

    return {
        "mode": mode,
        "is_demo": is_demo,
        "environment": settings.ENVIRONMENT,
        "allow_demo_seed": settings.ALLOW_DEMO_SEED,
        "badge": "[DEMO DATASET ACTIVE · SIMULATED MILL OPERATIONS]" if is_demo else "[LIVE FACTORY MODE · PERSISTED DATA]",
        "counts": {
            "users": users_count,
            "machines": machines_count,
            "simulated_machines": simulated_machines,
            "sales_orders": sales_orders_count,
            "production_orders": production_orders_count,
            "fabric_rolls": rolls_count,
        },
    }


@router.post("/demo-seed", summary="Explicitly populate coherent demo factory dataset")
def run_demo_seed(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Explicitly populates the demo dataset for hackathon demonstrations or local testing.
    Rejects execution if in production and ALLOW_DEMO_SEED is not explicitly permitted.
    """
    is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")
    if is_prod and not settings.ALLOW_DEMO_SEED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Violation: Demo data seeding is disabled in production environments.",
        )

    seed_database(db)
    return {
        "status": "success",
        "message": "Demo Factory dataset seeded successfully with coherent cross-module records.",
        "mode": "demo",
    }


@router.post("/demo-reset", summary="Reset demo transactions to leave clean Live Factory state")
def run_demo_reset(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
):
    """
    Purges demo transactional ledgers while preserving user accounts and master catalog.
    Transitions system to pristine Live Factory mode.
    """
    is_prod = settings.ENVIRONMENT.lower() in ("production", "prod")
    if is_prod and not settings.ALLOW_DEMO_SEED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Security Violation: Demo reset endpoint is disabled in production.",
        )

    # Purge transactional records in safe foreign-key order
    db.query(ShipmentItem).delete()
    db.query(Shipment).delete()
    db.query(Payment).delete()
    db.query(Invoice).delete()
    db.query(CostEntry).delete()
    db.query(QualityInspection).delete()
    db.query(FabricRoll).delete()
    db.query(MachineEvent).delete()
    db.query(ProductionEvent).delete()
    db.query(ProductionOperation).delete()
    db.query(ProductionOrder).delete()
    db.query(SalesOrderItem).delete()
    db.query(SalesOrder).delete()
    db.query(YarnReservation).delete()
    db.query(YarnStockLedgerEntry).delete()
    db.query(YarnGoodsReceiptLine).delete()
    db.query(YarnGoodsReceipt).delete()
    db.query(YarnPurchaseOrderLine).delete()
    db.query(YarnPurchaseOrder).delete()
    db.query(YarnRecommendation).delete()
    db.query(InventoryMovement).delete()
    db.query(RecoveryPlan).delete()
    db.query(Alert).delete()
    db.query(AttendanceRecord).delete()

    # Reset machines to idle live state
    for m in db.query(Machine).all():
        m.status = "idle"
        m.shift_output_m = 0.0
        m.current_speed_rpm = 0.0
        m.downtime_reason = None
        m.data_source = DataSourceType.MANUAL

    db.commit()

    return {
        "status": "success",
        "message": "Demo transactions cleared. Factory reset to clean Live mode with master catalog preserved.",
        "mode": "live",
    }
