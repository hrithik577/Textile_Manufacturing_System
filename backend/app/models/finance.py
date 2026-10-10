import enum
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Numeric, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class CostCategory(str, enum.Enum):
    RAW_MATERIAL = "raw_material"
    ELECTRICITY = "electricity"
    LABOR = "labor"
    DYE_CHEMICAL = "dye_chemical"
    OVERHEAD = "overhead"
    MAINTENANCE = "maintenance"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "bank_transfer"
    CREDIT_LETTER = "credit_letter"
    CHEQUE = "cheque"
    CASH = "cash"


class CostEntry(Base, TimestampMixin):
    __tablename__ = "cost_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    category: Mapped[CostCategory] = mapped_column(
        Enum(CostCategory, name="cost_category"),
        nullable=False,
        index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    
    sales_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    entry_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    sales_order = relationship("SalesOrder", back_populates="cost_entries")
    production_order = relationship("ProductionOrder", back_populates="cost_entries")


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="RESTRICT"), nullable=False, index=True)
    sales_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("sales_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    paid_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0.0, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    
    status: Mapped[InvoiceStatus] = mapped_column(
        Enum(InvoiceStatus, name="invoice_status"),
        default=InvoiceStatus.ISSUED,
        nullable=False,
        index=True
    )
    
    issue_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    customer = relationship("Customer", back_populates="invoices")
    sales_order = relationship("SalesOrder", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    invoice_id: Mapped[int] = mapped_column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, name="payment_method"),
        default=PaymentMethod.BANK_TRANSFER,
        nullable=False
    )
    reference_number: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
