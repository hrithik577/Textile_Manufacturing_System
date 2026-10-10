import enum
from datetime import date, datetime
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class OrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    QUALITY_CHECK = "quality_check"
    READY_FOR_DISPATCH = "ready_for_dispatch"
    PARTIALLY_DISPATCHED = "partially_dispatched"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class OrderPriority(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class SalesOrder(Base, TimestampMixin):
    __tablename__ = "sales_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    order_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    order_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    required_delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"),
        default=OrderStatus.CONFIRMED,
        nullable=False,
        index=True
    )
    priority: Mapped[OrderPriority] = mapped_column(
        Enum(OrderPriority, name="order_priority"),
        default=OrderPriority.NORMAL,
        nullable=False
    )
    
    currency: Mapped[str] = mapped_column(String(10), default="USD", nullable=False)
    total_amount: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="sales_orders")
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")
    production_orders = relationship("ProductionOrder", back_populates="sales_order")
    shipments = relationship("Shipment", back_populates="sales_order")
    invoices = relationship("Invoice", back_populates="sales_order")
    cost_entries = relationship("CostEntry", back_populates="sales_order")
    fabric_rolls = relationship("FabricRoll", back_populates="sales_order")


class SalesOrderItem(Base, TimestampMixin):
    __tablename__ = "sales_order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sales_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    
    fabric_type: Mapped[str] = mapped_column(String(255), nullable=False)
    color_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    gsm: Mapped[Optional[int]] = mapped_column(Integer, nullable=True) # Grams per Square Metre
    width_inches: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    target_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), default="m", nullable=False) # 'm', 'kg', 'rolls'
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="items")
