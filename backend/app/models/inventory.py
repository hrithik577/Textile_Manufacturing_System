import enum
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Float, Date, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class MaterialType(str, enum.Enum):
    YARN = "yarn"
    DYE_CHEMICAL = "dye_chemical"
    GREIGE_FABRIC = "greige_fabric"
    FINISHED_FABRIC = "finished_fabric"
    PACKAGING = "packaging"


class MovementType(str, enum.Enum):
    RECEIPT = "receipt"
    RESERVATION = "reservation"
    CONSUMPTION = "consumption"
    RELEASE = "release"
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"


class Material(Base, TimestampMixin):
    __tablename__ = "materials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    material_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    material_type: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, name="material_type"),
        default=MaterialType.YARN,
        nullable=False,
        index=True
    )
    unit: Mapped[str] = mapped_column(String(32), default="kg", nullable=False) # kg, m, litres, units
    reorder_threshold: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    current_stock: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    safety_stock: Mapped[float] = mapped_column(Float, default=50.0, nullable=False)
    standard_cost_per_unit: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    lots = relationship("MaterialLot", back_populates="material", cascade="all, delete-orphan")
    movements = relationship("InventoryMovement", back_populates="material")


class MaterialLot(Base, TimestampMixin):
    __tablename__ = "material_lots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    lot_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("materials.id", ondelete="RESTRICT"), nullable=False, index=True)
    supplier_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    
    received_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    available_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    reserved_quantity: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    
    received_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    expiry_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    unit_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    storage_location: Mapped[str] = mapped_column(String(64), default="Warehouse A", nullable=False)

    # Relationships
    material = relationship("Material", back_populates="lots")
    supplier = relationship("Supplier", back_populates="material_lots")
    movements = relationship("InventoryMovement", back_populates="lot")


class InventoryMovement(Base, TimestampMixin):
    __tablename__ = "inventory_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    material_id: Mapped[int] = mapped_column(Integer, ForeignKey("materials.id", ondelete="RESTRICT"), nullable=False, index=True)
    lot_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("material_lots.id", ondelete="SET NULL"), nullable=True, index=True)
    
    movement_type: Mapped[MovementType] = mapped_column(
        Enum(MovementType, name="movement_type"),
        nullable=False,
        index=True
    )
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    
    source_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    destination_location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    reference_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True) # sales_order, production_order, adjustment, receipt
    reference_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    
    actor_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    movement_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    material = relationship("Material", back_populates="movements")
    lot = relationship("MaterialLot", back_populates="movements")
    actor = relationship("User")
