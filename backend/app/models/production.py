import enum
from datetime import date, datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class ProductionStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class MachineStatus(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    STOPPED = "stopped"
    MAINTENANCE = "maintenance"
    BREAKDOWN = "breakdown"


class ProcessType(str, enum.Enum):
    SPINNING = "spinning"
    WEAVING = "weaving"
    DYEING = "dyeing"
    FINISHING = "finishing"
    PRINTING = "printing"
    CUTTING = "cutting"
    STITCHING = "stitching"
    PACKAGING = "packaging"


class DataSourceType(str, enum.Enum):
    SIMULATOR = "simulator"
    MANUAL = "manual"
    SENSOR = "sensor"


class ProductionOrder(Base, TimestampMixin):
    __tablename__ = "production_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    production_order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    sales_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    target_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    completed_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="m", nullable=False)
    
    status: Mapped[ProductionStatus] = mapped_column(
        Enum(ProductionStatus, name="production_status"),
        default=ProductionStatus.SCHEDULED,
        nullable=False,
        index=True
    )
    
    planned_start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    planned_end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="production_orders")
    operations = relationship("ProductionOperation", back_populates="production_order", cascade="all, delete-orphan")
    fabric_rolls = relationship("FabricRoll", back_populates="production_order")
    cost_entries = relationship("CostEntry", back_populates="production_order")
    production_events = relationship("ProductionEvent", back_populates="production_order")


class Machine(Base, TimestampMixin):
    __tablename__ = "machines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    machine_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    process_type: Mapped[ProcessType] = mapped_column(
        Enum(ProcessType, name="process_type"),
        default=ProcessType.WEAVING,
        nullable=False
    )
    status: Mapped[MachineStatus] = mapped_column(
        Enum(MachineStatus, name="machine_status"),
        default=MachineStatus.IDLE,
        nullable=False,
        index=True
    )
    
    active_production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True)
    current_speed_rpm: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True)
    rated_speed_mpm: Mapped[Optional[float]] = mapped_column(Float, default=None, nullable=True) # Standard rated speed in metres per minute
    shift_output_m: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    downtime_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    data_source: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type"),
        default=DataSourceType.SIMULATOR,
        nullable=False
    )
    last_heartbeat: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    active_production_order = relationship("ProductionOrder")
    events = relationship("MachineEvent", back_populates="machine", cascade="all, delete-orphan")
    operations = relationship("ProductionOperation", back_populates="machine")


class ProductionOperation(Base, TimestampMixin):
    __tablename__ = "production_operations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    process_name: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    machine_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    
    planned_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    actual_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False) # pending, in_progress, completed, interrupted

    # Relationships
    production_order = relationship("ProductionOrder", back_populates="operations")
    machine = relationship("Machine", back_populates="operations")


class MachineEvent(Base, TimestampMixin):
    __tablename__ = "machine_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False) # Idempotency key
    machine_id: Mapped[int] = mapped_column(Integer, ForeignKey("machines.id", ondelete="CASCADE"), nullable=False, index=True)
    production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True)
    
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True) # state_change, speed_change, downtime_start, downtime_end, maintenance
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    downtime_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    data_source: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type_me"),
        default=DataSourceType.SIMULATOR,
        nullable=False
    )
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    machine = relationship("Machine", back_populates="events")


class ProductionEvent(Base, TimestampMixin):
    __tablename__ = "production_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False) # Idempotency key
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    machine_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("machines.id", ondelete="SET NULL"), nullable=True)
    
    event_type: Mapped[str] = mapped_column(String(64), nullable=False) # batch_start, meterage_output, defect_detected, batch_end
    quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="m", nullable=False)
    event_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    
    source: Mapped[DataSourceType] = mapped_column(
        Enum(DataSourceType, name="data_source_type_pe"),
        default=DataSourceType.SIMULATOR,
        nullable=False
    )
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    production_order = relationship("ProductionOrder", back_populates="production_events")
    machine = relationship("Machine")
