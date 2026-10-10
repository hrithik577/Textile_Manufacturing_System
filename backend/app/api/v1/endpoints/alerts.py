from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.alert import AlertCategory, AlertSeverity, AlertStatus
from app.schemas.alert import AlertRead, AlertPatch
from app.services.alert_service import (
    get_alerts,
    get_alert_by_id,
    patch_alert_status,
)

router = APIRouter(prefix="/alerts", tags=["Alerts & Anomalies"])


@router.get("", response_model=List[AlertRead], summary="List factory alerts")
def list_alerts(
    status: Optional[AlertStatus] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    category: Optional[AlertCategory] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_alerts(db, status=status, severity=severity, category=category, skip=skip, limit=limit)
    return [AlertRead.model_validate(a) for a in items]


@router.get("/{alert_id}", response_model=AlertRead, summary="Get alert by ID")
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    alert = get_alert_by_id(db, alert_id)
    return AlertRead.model_validate(alert)


@router.patch("/{alert_id}", response_model=AlertRead, summary="Acknowledge, resolve, or dismiss an alert")
def update_alert(
    alert_id: int,
    patch_in: AlertPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION, UserRole.QUALITY])),
):
    alert = patch_alert_status(db, alert_id, patch_in, current_user)
    return AlertRead.model_validate(alert)
