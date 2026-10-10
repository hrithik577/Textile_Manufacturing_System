import enum
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class ShipmentStatus(str, enum.Enum):
    DRAFT = "draft"
    PACKED = "packed"
    DISPATCHED = "dispatched"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Shipment(Base, TimestampMixin):
    __tablename__ = "shipments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shipment_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    sales_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="RESTRICT"), nullable=False, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    status: Mapped[ShipmentStatus] = mapped_column(
        Enum(ShipmentStatus, name="shipment_status"),
        default=ShipmentStatus.DRAFT,
        nullable=False,
        index=True
    )
    
    dispatch_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    tracking_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    carrier: Mapped[Optional[str]] = mapped_column(String(128), default="DHL Global Forwarding", nullable=True)
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    destination_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="shipments")
    customer = relationship("Customer", back_populates="shipments")
    items = relationship("ShipmentItem", back_populates="shipment", cascade="all, delete-orphan")


class ShipmentItem(Base, TimestampMixin):
    __tablename__ = "shipment_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shipment_id: Mapped[int] = mapped_column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False, index=True)
    roll_id: Mapped[int] = mapped_column(Integer, ForeignKey("fabric_rolls.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    dispatched_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="m", nullable=False)

    # Relationships
    shipment = relationship("Shipment", back_populates="items")
    roll = relationship("FabricRoll", back_populates="shipment_items")
