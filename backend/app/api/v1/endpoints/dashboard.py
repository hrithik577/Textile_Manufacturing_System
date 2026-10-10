from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse, ProductionTrendResponse
from app.schemas.alert import AlertRead
from app.services.dashboard_service import get_dashboard_summary, get_production_trend
from app.services.alert_service import get_alerts

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse, summary="Get overall factory dashboard KPIs")
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Aggregates high-level metrics: OEE %, active orders, machine statuses, production output, and alerts."""
    return get_dashboard_summary(db)


@router.get("/production-trend", response_model=ProductionTrendResponse, summary="Get daily production output vs target trend")
def get_trend(
    days: int = Query(7, ge=1, le=60, description="Number of days for trend history"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retrieves target vs actual output meterage and efficiency curve over time."""
    return get_production_trend(db, days=days)


@router.get("/alerts", response_model=List[AlertRead], summary="Get recent high-priority factory alerts for dashboard")
def get_dashboard_alerts(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Quick summary of active alerts for dashboard widget display."""
    alerts, _ = get_alerts(db, limit=limit)
    return alerts
