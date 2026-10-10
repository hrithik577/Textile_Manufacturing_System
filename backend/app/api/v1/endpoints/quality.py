from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.quality import QualityInspection, InspectionResult
from app.schemas.quality import (
    QualityInspectionRead,
    QualityInspectionCreate,
)
from app.services.quality_service import record_quality_inspection

router = APIRouter(prefix="/quality", tags=["Quality Control"])


@router.get("/inspections", response_model=List[QualityInspectionRead], summary="List quality inspections")
def list_inspections(
    roll_id: Optional[int] = Query(None),
    result: Optional[InspectionResult] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    query = db.query(QualityInspection)
    if roll_id:
        query = query.filter(QualityInspection.roll_id == roll_id)
    if result:
        query = query.filter(QualityInspection.result == result)
        
    items = query.order_by(QualityInspection.inspection_date.desc()).offset(skip).limit(limit).all()
    return [QualityInspectionRead.model_validate(ins) for ins in items]


@router.post("/inspections", response_model=QualityInspectionRead, status_code=status.HTTP_201_CREATED, summary="Record roll quality inspection")
def add_inspection(
    inspection_in: QualityInspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.OWNER, UserRole.MANAGER, UserRole.QUALITY])),
):
    """Logs inspection defects, updates roll status (pass/hold/rework/reject) and 4-point grade."""
    inspection = record_quality_inspection(db, inspection_in, current_user)
    return QualityInspectionRead.model_validate(inspection)
