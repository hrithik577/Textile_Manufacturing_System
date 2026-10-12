import enum
from datetime import date, datetime, timezone
from typing import List, Optional, Any, Dict
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Enum, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class QualityStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    QUARANTINED = "quarantined"
    REJECTED = "rejected"


class POStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class ReadinessStatus(str, enum.Enum):
    READY = "READY"
    AT_RISK = "AT_RISK"
    BLOCKED = "BLOCKED"


class StockTransactionType(str, enum.Enum):
    GOODS_RECEIPT = "goods_receipt"
    QUALITY_HOLD = "quality_hold"
    QUALITY_RELEASE = "quality_release"
    RESERVATION = "reservation"
    RESERVATION_RELEASE = "reservation_release"
    MATERIAL_ISSUE = "material_issue"
    CONSUMPTION = "consumption"
    ADJUSTMENT = "adjustment"
    RETURN_REVERSAL = "return_reversal"


class RecommendationStatus(str, enum.Enum):
    PROPOSED = "proposed"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTED = "executed"


# ─── 1. Yarn Specification Master ───────────────────────────────────────────────
class YarnSpecification(Base, TimestampMixin):
    __tablename__ = "yarn_specifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    yarn_count: Mapped[str] = mapped_column(String(64), nullable=False)  # e.g. "30s Ne", "40s/2", "50D"
    yarn_type: Mapped[str] = mapped_column(String(100), nullable=False)   # e.g. "Combed Ring Spun", "Open End", "Filament"
    fibre_composition: Mapped[str] = mapped_column(String(150), nullable=False)  # e.g. "100% Cotton", "65/35 Poly-Cotton"
    color_name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Navy Blue", "Raw Ecru", "Charcoal"
    color_code: Mapped[str] = mapped_column(String(50), nullable=False)   # e.g. "PANTONE 19-4024 TCX", "#1e3a8a"
    unit: Mapped[str] = mapped_column(String(20), default="kg", nullable=False)
    standard_cost_per_kg: Mapped[float] = mapped_column(Float, default=4.50, nullable=False)
    reorder_threshold_kg: Mapped[float] = mapped_column(Float, default=500.0, nullable=False)
    safety_stock_kg: Mapped[float] = mapped_column(Float, default=250.0, nullable=False)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    lots = relationship("YarnLot", back_populates="specification")
    po_lines = relationship("YarnPurchaseOrderLine", back_populates="specification")
    receipt_lines = relationship("YarnGoodsReceiptLine", back_populates="specification")
    reservations = relationship("YarnReservation", back_populates="specification")
    ledger_entries = relationship("YarnStockLedgerEntry", back_populates="specification")


# ─── 2. Purchase Orders ──────────────────────────────────────────────────────────
class YarnPurchaseOrder(Base, TimestampMixin):
    __tablename__ = "yarn_purchase_orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    po_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    order_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    expected_delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[POStatus] = mapped_column(
        Enum(POStatus, name="po_status"),
        default=POStatus.CONFIRMED,
        nullable=False,
        index=True
    )
    total_ordered_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_received_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    supplier = relationship("Supplier")
    lines = relationship("YarnPurchaseOrderLine", back_populates="purchase_order", cascade="all, delete-orphan")
    receipts = relationship("YarnGoodsReceipt", back_populates="purchase_order")


class YarnPurchaseOrderLine(Base, TimestampMixin):
    __tablename__ = "yarn_po_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    po_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    specification_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="RESTRICT"), nullable=False, index=True)
    ordered_quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    received_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, default=4.50, nullable=False)
    tolerance_percent: Mapped[float] = mapped_column(Float, default=5.0, nullable=False)  # 5% acceptable variation

    # Relationships
    purchase_order = relationship("YarnPurchaseOrder", back_populates="lines")
    specification = relationship("YarnSpecification", back_populates="po_lines")


# ─── 3. Smart Gate Goods Receipt ────────────────────────────────────────────────
class YarnGoodsReceipt(Base, TimestampMixin):
    __tablename__ = "yarn_goods_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    receipt_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    po_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("yarn_purchase_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    challan_number: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    receipt_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    driver_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    received_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_gross_weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_tare_weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_net_weight_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    has_discrepancy: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    discrepancy_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    purchase_order = relationship("YarnPurchaseOrder", back_populates="receipts")
    supplier = relationship("Supplier")
    received_by = relationship("User")
    lines = relationship("YarnGoodsReceiptLine", back_populates="receipt", cascade="all, delete-orphan")


class YarnGoodsReceiptLine(Base, TimestampMixin):
    __tablename__ = "yarn_goods_receipt_lines"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    receipt_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_goods_receipts.id", ondelete="CASCADE"), nullable=False, index=True)
    specification_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="RESTRICT"), nullable=False, index=True)
    supplier_lot_number: Mapped[str] = mapped_column(String(100), nullable=False)
    internal_lot_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    ordered_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    gross_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    net_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    discrepancy_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    is_discrepant: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    storage_location: Mapped[str] = mapped_column(String(100), default="Warehouse A - Bay 1", nullable=False)
    intended_production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True)
    quality_status: Mapped[QualityStatus] = mapped_column(
        Enum(QualityStatus, name="yarn_quality_status"),
        default=QualityStatus.APPROVED,
        nullable=False,
    )

    # Relationships
    receipt = relationship("YarnGoodsReceipt", back_populates="lines")
    specification = relationship("YarnSpecification", back_populates="receipt_lines")
    intended_production_order = relationship("ProductionOrder")
    lot = relationship("YarnLot", back_populates="receipt_line", uselist=False)


# ─── 4. Yarn Lot Inventory ──────────────────────────────────────────────────────
class YarnLot(Base, TimestampMixin):
    __tablename__ = "yarn_lots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lot_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    specification_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="RESTRICT"), nullable=False, index=True)
    receipt_line_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("yarn_goods_receipt_lines.id", ondelete="SET NULL"), nullable=True)
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id", ondelete="RESTRICT"), nullable=False, index=True)
    
    physical_quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    reserved_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    available_quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    quarantined_quantity_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    quality_status: Mapped[QualityStatus] = mapped_column(
        Enum(QualityStatus, name="yarn_lot_quality_status"),
        default=QualityStatus.APPROVED,
        nullable=False,
        index=True
    )
    storage_location: Mapped[str] = mapped_column(String(100), default="Warehouse A - Bay 1", nullable=False)
    received_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    inspection_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    specification = relationship("YarnSpecification", back_populates="lots")
    receipt_line = relationship("YarnGoodsReceiptLine", back_populates="lot")
    supplier = relationship("Supplier")
    reservations = relationship("YarnReservation", back_populates="lot")
    ledger_entries = relationship("YarnStockLedgerEntry", back_populates="lot")


# ─── 5. Stock Reservations ──────────────────────────────────────────────────────
class YarnReservation(Base, TimestampMixin):
    __tablename__ = "yarn_reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    reservation_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    production_order_id: Mapped[int] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    specification_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="RESTRICT"), nullable=False, index=True)
    lot_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("yarn_lots.id", ondelete="SET NULL"), nullable=True, index=True)
    reserved_quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reserved_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    production_order = relationship("ProductionOrder")
    specification = relationship("YarnSpecification", back_populates="reservations")
    lot = relationship("YarnLot", back_populates="reservations")
    reserved_by = relationship("User")


# ─── 6. Immutable Stock Ledger ──────────────────────────────────────────────────
class YarnStockLedgerEntry(Base, TimestampMixin):
    __tablename__ = "yarn_stock_ledger_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entry_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    specification_id: Mapped[int] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="RESTRICT"), nullable=False, index=True)
    lot_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("yarn_lots.id", ondelete="SET NULL"), nullable=True, index=True)
    
    transaction_type: Mapped[StockTransactionType] = mapped_column(
        Enum(StockTransactionType, name="yarn_transaction_type"),
        nullable=False,
        index=True
    )
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    balance_after_kg: Mapped[float] = mapped_column(Float, nullable=False)
    
    reference_type: Mapped[str] = mapped_column(String(64), nullable=False)  # "receipt", "reservation", "production_order", "adjustment"
    reference_id: Mapped[str] = mapped_column(String(100), nullable=False)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    specification = relationship("YarnSpecification", back_populates="ledger_entries")
    lot = relationship("YarnLot", back_populates="ledger_entries")
    actor = relationship("User")


# ─── 7. Corrective Recommendations ──────────────────────────────────────────────
class YarnRecommendation(Base, TimestampMixin):
    __tablename__ = "yarn_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recommendation_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    target_production_order_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("production_orders.id", ondelete="SET NULL"), nullable=True)
    specification_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("yarn_specifications.id", ondelete="SET NULL"), nullable=True)
    
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    problem_statement: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_action: Mapped[str] = mapped_column(String(255), nullable=False)
    expected_benefit: Mapped[str] = mapped_column(Text, nullable=False)
    risks_tradeoffs: Mapped[str] = mapped_column(Text, nullable=False)
    shortage_resolved_kg: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    
    status: Mapped[RecommendationStatus] = mapped_column(
        Enum(RecommendationStatus, name="recommendation_status"),
        default=RecommendationStatus.PROPOSED,
        nullable=False,
    )
    priority: Mapped[str] = mapped_column(String(30), default="high", nullable=False)  # critical, high, medium, low
    evidence_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    approved_by_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    production_order = relationship("ProductionOrder")
    specification = relationship("YarnSpecification")
    approved_by = relationship("User")


# ─── 8. YarnIQ Audit Events ─────────────────────────────────────────────────────
class YarnAuditEvent(Base, TimestampMixin):
    __tablename__ = "yarn_audit_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    entity_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    actor = relationship("User")
