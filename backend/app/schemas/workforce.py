from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ShiftRead(BaseModel):
    id: int
    shift_name: str
    start_time: str
    end_time: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class WorkerBase(BaseModel):
    employee_code: str
    name: str
    role: str = "operator"
    department: str = "weaving"
    shift_id: Optional[int] = None
    is_active: bool = True


class WorkerCreate(WorkerBase):
    pass


class WorkerRead(WorkerBase):
    id: int
    shift: Optional[ShiftRead] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttendanceCreate(BaseModel):
    worker_id: int
    shift_id: Optional[int] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str = "present" # present, absent, late, on_leave


class AttendanceRecordRead(BaseModel):
    id: int
    worker_id: int
    shift_id: Optional[int] = None
    date: date
    check_in: Optional[datetime] = None
    check_out: Optional[datetime] = None
    status: str
    worker: Optional[WorkerRead] = None
    shift: Optional[ShiftRead] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
