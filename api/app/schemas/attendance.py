"""Attendance Pydantic schemas."""
from typing import List, Optional
from pydantic import BaseModel, Field


class MarkAttendanceItem(BaseModel):
    block_id: int
    status: str = Field(..., pattern="^(present|absent|holiday|unmarked)$")
    notes: Optional[str] = None


class MarkAttendanceRequest(BaseModel):
    log_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    entries: List[MarkAttendanceItem]


class AttendanceSaveResponse(BaseModel):
    success: bool
    updated_count: int
    summary: Optional[dict] = None


class BunkStats(BaseModel):
    percentage: float
    is_below_threshold: bool
    safe_to_miss: int
    must_attend_next: int


class SubjectAttendance(BaseModel):
    subject: str
    attended: int
    total: int
    stats: BunkStats


class DashboardResponse(BaseModel):
    overall: BunkStats
    subjects: List[SubjectAttendance]
    total_attended: int
    total_periods: int
