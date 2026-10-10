import enum
from datetime import date, datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Enum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class RollStatus(str, enum.Enum):
    UNINSPECTED = "uninspected"
    PASS = "pass"
    HOLD = "hold"
    REWORK = "rework"
    REJECTED = "rejected"
    ALLOCATED_FOR_DISPATCH = "allocated_for_dispatch"
    DISPATCHED = "dispatched"


class InspectionResult(str, enum.Enum):
    PASS = "pass"
    REWORK = "rework"
    HOLD = "hold"
    REJECT = "reject"


class RollGrade(str, enum.Enum):
    GRADE_A = "A"
    GRADE_B = "B"
    GRADE_C = "C"
    SCRAP = "scrap"


class FabricRoll(Base, TimestampMixin):
    __tablename__ = "fabric_rolls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    roll_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    
    production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    sales_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    fabric_type: Mapped[str] = mapped_column(String(255), nullable=False)
    length_m: Mapped[float] = mapped_column(Float, nullable=False)
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    width_inches: Mapped[Optional[float]] = mapped_column(Float, default=58.0, nullable=True)
    gsm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    grade: Mapped[RollGrade] = mapped_column(
        Enum(RollGrade, name="roll_grade"),
        default=RollGrade.GRADE_A,
        nullable=False
    )
    current_status: Mapped[RollStatus] = mapped_column(
        Enum(RollStatus, name="roll_status"),
        default=RollStatus.UNINSPECTED,
        nullable=False,
        index=True
    )
    current_location: Mapped[str] = mapped_column(String(100), default="Inspection Bay 1", nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    production_order = relationship("ProductionOrder", back_populates="fabric_rolls")
    sales_order = relationship("SalesOrder", back_populates="fabric_rolls")
    inspections = relationship("QualityInspection", back_populates="roll", cascade="all, delete-orphan")
    shipment_items = relationship("ShipmentItem", back_populates="roll")


class QualityInspection(Base, TimestampMixin):
    __tablename__ = "quality_inspections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    roll_id: Mapped[int] = mapped_column(Integer, ForeignKey("fabric_rolls.id", ondelete="CASCADE"), nullable=False, index=True)
    inspector_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    inspection_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    result: Mapped[InspectionResult] = mapped_column(
        Enum(InspectionResult, name="inspection_result"),
        nullable=False,
        index=True
    )
    defect_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    defect_details: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True) # e.g. [{"type": "oil_stain", "points": 4, "meter": 22.5}]
    
    disposition: Mapped[str] = mapped_column(String(255), default="approved_for_dispatch", nullable=False)
    points_per_100_sqm: Mapped[Optional[float]] = mapped_column(Float, default=0.0, nullable=True) # 4-point system calculation
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    roll = relationship("FabricRoll", back_populates="inspections")
    inspector = relationship("User")
