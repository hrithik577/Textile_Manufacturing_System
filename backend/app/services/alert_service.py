from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException
from app.models.user import User
from app.models.alert import Alert, AlertCategory, AlertSeverity, AlertStatus
from app.schemas.alert import AlertPatch
from app.services.audit_service import log_audit_event


def get_alerts(
    db: Session,
    status: Optional[AlertStatus] = None,
    severity: Optional[AlertSeverity] = None,
    category: Optional[AlertCategory] = None,
    skip: int = 0,
    limit: int = 50,
) -> Tuple[List[Alert], int]:
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if severity:
        query = query.filter(Alert.severity == severity)
    if category:
        query = query.filter(Alert.category == category)
        
    total = query.count()
    items = query.order_by(Alert.created_at.desc()).offset(skip).limit(limit).all()
    return items, total


def get_alert_by_id(db: Session, alert_id: int) -> Alert:
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise NotFoundException("Alert", alert_id)
    return alert


def create_alert(
    db: Session,
    category: AlertCategory,
    severity: AlertSeverity,
    title: str,
    description: str,
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
) -> Alert:
    """Create a system or intelligence-generated operational alert."""
    alert = Alert(
        category=category,
        severity=severity,
        title=title,
        description=description,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        status=AlertStatus.ACTIVE,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def patch_alert_status(
    db: Session,
    alert_id: int,
    patch_in: AlertPatch,
    current_user: User,
) -> Alert:
    alert = get_alert_by_id(db, alert_id)
    old_status = alert.status
    
    if patch_in.status:
        alert.status = patch_in.status
        if patch_in.status in [AlertStatus.RESOLVED, AlertStatus.DISMISSED]:
            alert.resolved_at = datetime.now(timezone.utc)
            
    log_audit_event(
        db=db,
        actor_id=current_user.id,
        action="patch_alert_status",
        entity_type="alert",
        entity_id=str(alert.id),
        changes_summary={"old_status": old_status.value, "new_status": alert.status.value, "notes": patch_in.notes},
    )

    db.commit()
    db.refresh(alert)
    return alert
