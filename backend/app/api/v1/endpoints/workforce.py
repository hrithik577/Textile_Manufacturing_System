from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.workforce import Shift
from app.schemas.workforce import (
    WorkerRead,
    WorkerCreate,
    AttendanceRecordRead,
    AttendanceCreate,
    ShiftRead,
)
from app.services.workforce_service import (
    get_workers,
    create_worker,
    get_attendance,
    record_attendance,
)

router = APIRouter(prefix="/workforce", tags=["Workforce & Attendance"])


@router.get("/workers", response_model=List[WorkerRead], summary="List workers")
def list_workers(
    department: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_workers(db, department=department, is_active=is_active, skip=skip, limit=limit)
    return [WorkerRead.model_validate(w) for w in items]


@router.post("/workers", response_model=WorkerRead, status_code=status.HTTP_201_CREATED, summary="Create worker record")
def add_worker(
    worker_in: WorkerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER])),
):
    worker = create_worker(db, worker_in)
    return WorkerRead.model_validate(worker)


@router.get("/shifts", response_model=List[ShiftRead], summary="List work shifts")
def list_shifts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shifts = db.query(Shift).all()
    return [ShiftRead.model_validate(s) for s in shifts]


@router.get("/attendance", response_model=List[AttendanceRecordRead], summary="List worker attendance records")
def list_attendance(
    target_date: Optional[date] = Query(None),
    worker_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    items, _ = get_attendance(db, target_date=target_date, worker_id=worker_id, skip=skip, limit=limit)
    return [AttendanceRecordRead.model_validate(a) for a in items]


@router.post("/attendance", response_model=AttendanceRecordRead, status_code=status.HTTP_201_CREATED, summary="Log worker shift attendance")
def log_attendance(
    attendance_in: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION])),
):
    record = record_attendance(db, attendance_in)
    return AttendanceRecordRead.model_validate(record)
