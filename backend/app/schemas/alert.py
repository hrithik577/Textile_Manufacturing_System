from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, ConfigDict, Field
from app.models.alert import (
    AlertCategory,
    AlertSeverity,
    AlertStatus,
    ApprovalStatus,
    ExecutionStatus,
)


class AlertRead(BaseModel):
    id: int
    category: AlertCategory
    severity: AlertSeverity
    title: str
    description: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    status: AlertStatus
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertPatch(BaseModel):
    status: Optional[AlertStatus] = None
    notes: Optional[str] = None


class RecoveryPlanCreate(BaseModel):
    alert_id: int
    title: str
    description: str
    affected_entity_type: str
    affected_entity_id: str
    proposed_actions: List[Dict[str, Any]]
    expected_outcome: str
    estimated_delay_reduction_hours: Optional[float] = 0.0
    estimated_cost_impact: Optional[float] = 0.0
    risk_assessment: str = "low"


class RecoveryPlanRead(BaseModel):
    id: int
    alert_id: int
    title: str
    description: str
    affected_entity_type: str
    affected_entity_id: str
    proposed_actions: List[Dict[str, Any]]
    expected_outcome: str
    estimated_delay_reduction_hours: Optional[float] = 0.0
    estimated_cost_impact: Optional[float] = 0.0
    risk_assessment: str
    approval_status: ApprovalStatus
    approved_by_id: Optional[int] = None
    approved_at: Optional[datetime] = None
    execution_status: ExecutionStatus
    execution_notes: Optional[str] = None
    alert: Optional[AlertRead] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RecoveryPlanApproveRequest(BaseModel):
    approved: bool = True
    rejection_reason: Optional[str] = None


class RecoveryPlanExecuteRequest(BaseModel):
    execution_parameters: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
