from typing import Optional, Any, Dict
from sqlalchemy.orm import Session
from app.models.audit import AuditLog


def log_audit_event(
    db: Session,
    actor_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: str,
    changes_summary: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Create an immutable audit log entry for significant system operations."""
    audit_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        changes_summary=changes_summary,
        ip_address=ip_address,
    )
    db.add(audit_entry)
    db.flush()
    return audit_entry
