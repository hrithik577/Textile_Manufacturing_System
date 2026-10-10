from datetime import date, time, datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Boolean, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin


class Shift(Base, TimestampMixin):
    __tablename__ = "shifts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    shift_name: Mapped[str] = mapped_column(String(64), unique=True, nullable=False) # Morning (06:00-14:00), Evening (14:00-22:00), Night (22:00-06:00)
    start_time: Mapped[str] = mapped_column(String(10), nullable=False) # e.g. "06:00"
    end_time: Mapped[str] = mapped_column(String(10), nullable=False) # e.g. "14:00"
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    workers = relationship("Worker", back_populates="shift")
    attendance_records = relationship("AttendanceRecord", back_populates="shift")


class Worker(Base, TimestampMixin):
    __tablename__ = "workers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_code: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), default="operator", nullable=False) # operator, technician, supervisor, inspector, helper
    department: Mapped[str] = mapped_column(String(64), default="weaving", nullable=False)
    shift_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    shift = relationship("Shift", back_populates="workers")
    attendance_records = relationship("AttendanceRecord", back_populates="worker", cascade="all, delete-orphan")


class AttendanceRecord(Base, TimestampMixin):
    __tablename__ = "attendance_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    worker_id: Mapped[int] = mapped_column(Integer, ForeignKey("workers.id", ondelete="CASCADE"), nullable=False, index=True)
    shift_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("shifts.id", ondelete="SET NULL"), nullable=True)
    
    date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="present", nullable=False) # present, absent, late, on_leave

    # Relationships
    worker = relationship("Worker", back_populates="attendance_records")
    shift = relationship("Shift", back_populates="attendance_records")
