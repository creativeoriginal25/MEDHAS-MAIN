"""Pydantic schemas for auth endpoints."""
from typing import Optional
from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    register_number: str = Field(..., min_length=5, max_length=20)
    pin: str = Field(..., min_length=4, max_length=20)
    display_name: Optional[str] = None
    branch: Optional[str] = None
    section: Optional[str] = None
    academic_year: Optional[int] = Field(default=1, ge=1, le=4)
    semester: Optional[int] = Field(default=None, ge=1, le=8)
    baseline_attended: Optional[int] = 0
    baseline_total: Optional[int] = 0
    baseline_date: Optional[str] = None
    platform: Optional[str] = "web"


class LoginRequest(BaseModel):
    register_number: str = Field(..., min_length=1, max_length=30)
    pin: str = Field(..., min_length=4, max_length=30)
    platform: Optional[str] = "web"


class LoginResponse(BaseModel):
    token: str
    user: dict


class ChangePinRequest(BaseModel):
    current_pin: str = Field(..., min_length=4)
    new_pin: str = Field(..., min_length=4, max_length=20)


class MessageResponse(BaseModel):
    message: str
