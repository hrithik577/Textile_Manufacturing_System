from datetime import datetime, timezone
from typing import Optional, Any, Dict
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(128), nullable=False, index=True) # e.g. "inventory_adjustment", "dispatch_confirm", "order_status_change"
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True) # e.g. "sales_order", "fabric_roll", "shipment"
    entity_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    changes_summary: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    actor = relationship("User")
