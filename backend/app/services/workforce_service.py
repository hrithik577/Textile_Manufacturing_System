from datetime import date, datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundException, ConflictException
from app.models.workforce import Worker, Shift, AttendanceRecord
from app.schemas.workforce import WorkerCreate, AttendanceCreate


def get_workers(
    db: Session,
    department: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Worker], int]:
    query = db.query(Worker)
    if department:
        query = query.filter(Worker.department == department)
    if is_active is not None:
        query = query.filter(Worker.is_active == is_active)
        
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return items, total


def create_worker(db: Session, worker_in: WorkerCreate) -> Worker:
    existing = db.query(Worker).filter(Worker.employee_code == worker_in.employee_code).first()
    if existing:
        raise ConflictException(f"Worker with employee code '{worker_in.employee_code}' already exists.")
        
    worker = Worker(**worker_in.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return worker


def get_attendance(
    db: Session,
    target_date: Optional[date] = None,
    worker_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[AttendanceRecord], int]:
    query = db.query(AttendanceRecord)
    if target_date:
        query = query.filter(AttendanceRecord.date == target_date)
    if worker_id:
        query = query.filter(AttendanceRecord.worker_id == worker_id)
        
    total = query.count()
    items = query.order_by(AttendanceRecord.date.desc()).offset(skip).limit(limit).all()
    return items, total


def record_attendance(db: Session, att_in: AttendanceCreate) -> AttendanceRecord:
    worker = db.query(Worker).filter(Worker.id == att_in.worker_id).first()
    if not worker:
        raise NotFoundException("Worker", att_in.worker_id)
        
    existing = (
        db.query(AttendanceRecord)
        .filter(
            AttendanceRecord.worker_id == att_in.worker_id,
            AttendanceRecord.date == att_in.date,
        )
        .first()
    )
    if existing:
        if att_in.check_out:
            existing.check_out = att_in.check_out
        if att_in.status:
            existing.status = att_in.status
        db.commit()
        db.refresh(existing)
        return existing

    record = AttendanceRecord(
        worker_id=att_in.worker_id,
        shift_id=att_in.shift_id or worker.shift_id,
        date=att_in.date,
        check_in=att_in.check_in or datetime.now(timezone.utc),
        check_out=att_in.check_out,
        status=att_in.status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
