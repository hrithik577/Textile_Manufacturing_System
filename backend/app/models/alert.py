import enum
from datetime import datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class AlertCategory(str, enum.Enum):
    PRODUCTION_DELAY = "production_delay"
    QUALITY_DEFECT_SPIKE = "quality_defect_spike"
    MACHINE_BREAKDOWN = "machine_breakdown"
    INVENTORY_SHORTAGE = "inventory_shortage"
    COST_OVERRUN = "cost_overrun"


class AlertSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class ExecutionStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Alert(Base, TimestampMixin):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category: Mapped[AlertCategory] = mapped_column(
        Enum(AlertCategory, name="alert_category"),
        nullable=False,
        index=True
    )
    severity: Mapped[AlertSeverity] = mapped_column(
        Enum(AlertSeverity, name="alert_severity"),
        default=AlertSeverity.MEDIUM,
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    entity_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # machine, order, material, roll
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    status: Mapped[AlertStatus] = mapped_column(
        Enum(AlertStatus, name="alert_status"),
        default=AlertStatus.ACTIVE,
        nullable=False,
        index=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    recovery_plans = relationship("RecoveryPlan", back_populates="alert", cascade="all, delete-orphan")


class RecoveryPlan(Base, TimestampMixin):
    __tablename__ = "recovery_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    alert_id: Mapped[int] = mapped_column(Integer, ForeignKey("alerts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    
    affected_entity_type: Mapped[str] = mapped_column(String(64), nullable=False) # machine, order, material
    affected_entity_id: Mapped[str] = mapped_column(String(64), nullable=False)
    
    proposed_actions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    expected_outcome: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_delay_reduction_hours: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    estimated_cost_impact: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    risk_assessment: Mapped[str] = mapped_column(String(255), default="low", nullable=False)
    
    approval_status: Mapped[ApprovalStatus] = mapped_column(
        Enum(ApprovalStatus, name="approval_status"),
        default=ApprovalStatus.PENDING,
        nullable=False,
        index=True
    )
    approved_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    execution_status: Mapped[ExecutionStatus] = mapped_column(
        Enum(ExecutionStatus, name="execution_status"),
        default=ExecutionStatus.NOT_STARTED,
        nullable=False,
        index=True
    )
    execution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    alert = relationship("Alert", back_populates="recovery_plans")
    approved_by = relationship("User")
