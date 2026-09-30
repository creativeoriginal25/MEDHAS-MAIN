"""Admin router — role-based admin operations with audit logging."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user, require_role
from app.auth.security import hash_pin
from app.auth.rate_limit import check_admin_reset_rate_limit
from app.models.user import User, UserRole
from app.models.audit import AuditLog, PinResetLog
from app.models.attendance import Section, TimetableBlock
from pydantic import BaseModel, Field

router = APIRouter(prefix="/admin", tags=["Admin"])


class PinResetRequest(BaseModel):
    target_register_number: str
    new_pin: str = Field(..., min_length=4, max_length=20)


class RoleAssignRequest(BaseModel):
    register_number: str
    role: str


class SectionCreateRequest(BaseModel):
    branch: str
    section_label: str
    effective_from: str


class BlockCreateRequest(BaseModel):
    section_id: int
    weekday: int
    order_index: int
    subject: str
    periods: int


# --- Attendance Admin ---

@router.post("/reset-pin")
def reset_pin(
    req: PinResetRequest,
    request: Request,
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """Reset a student's PIN (attendance_admin or platform_admin)."""
    client_ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or "127.0.0.1"
    check_admin_reset_rate_limit(user.register_number, client_ip)

    target = db.query(User).filter(User.register_number == req.target_register_number.upper()).first()
    if not target:
        raise HTTPException(status_code=404, detail="Student not found.")

    target.pin_hash = hash_pin(req.new_pin)

    # Audit log
    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="ADMIN_PIN_RESET",
        target=req.target_register_number.upper(),
        ip_address=client_ip,
    ))
    db.add(PinResetLog(
        target_register_number=req.target_register_number.upper(),
        reset_by_register_number=user.register_number,
    ))
    db.commit()
    return {"message": f"PIN reset for {req.target_register_number.upper()}."}


@router.get("/students")
def list_students(
    branch: Optional[str] = None,
    q: Optional[str] = None,
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """List students for admin management."""
    query = db.query(User)
    if branch:
        sections = db.query(Section.id).filter(Section.branch == branch.upper()).all()
        section_ids = [s.id for s in sections]
        query = query.filter(User.section_id.in_(section_ids))
    if q:
        search = f"%{q}%"
        query = query.filter(User.register_number.ilike(search))

    students = query.order_by(User.register_number).limit(100).all()
    return [
        {
            "id": s.id,
            "register_number": s.register_number,
            "display_name": s.display_name,
            "section_id": s.section_id,
        }
        for s in students
    ]


# --- Section/Timetable Admin ---

@router.get("/sections")
def list_sections(
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """List all sections."""
    sections = db.query(Section).order_by(Section.branch, Section.section_label).all()
    return [
        {"id": s.id, "branch": s.branch, "section_label": s.section_label, "effective_from": s.effective_from}
        for s in sections
    ]


@router.post("/sections")
def create_section(
    req: SectionCreateRequest,
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """Create a new section."""
    existing = db.query(Section).filter(
        Section.branch == req.branch.upper(), Section.section_label == req.section_label.upper()
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Section already exists.")

    section = Section(branch=req.branch.upper(), section_label=req.section_label.upper(), effective_from=req.effective_from)
    db.add(section)
    db.add(AuditLog(
        user_id=user.id, register_number=user.register_number,
        action="CREATE_SECTION", target=f"{req.branch} {req.section_label}",
    ))
    db.commit()
    db.refresh(section)
    return {"id": section.id, "branch": section.branch, "section_label": section.section_label}


@router.post("/timetable/blocks")
def create_block(
    req: BlockCreateRequest,
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """Add a timetable block."""
    block = TimetableBlock(
        section_id=req.section_id, weekday=req.weekday,
        order_index=req.order_index, subject=req.subject, periods=req.periods,
    )
    db.add(block)
    db.add(AuditLog(
        user_id=user.id, register_number=user.register_number,
        action="CREATE_TIMETABLE_BLOCK", target=f"Section {req.section_id}, {req.subject}",
    ))
    db.commit()
    db.refresh(block)
    return {"id": block.id, "subject": block.subject, "periods": block.periods}


# --- Platform Admin ---

@router.post("/roles/assign")
def assign_role(
    req: RoleAssignRequest,
    user: User = Depends(require_role("platform_admin")),
    db: Session = Depends(get_db),
):
    """Assign a role to a user (platform_admin only)."""
    valid_roles = {"student", "attendance_admin", "content_editor", "campus_operator", "platform_admin"}
    if req.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {valid_roles}")

    target = db.query(User).filter(User.register_number == req.register_number.upper()).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    existing = db.query(UserRole).filter(UserRole.user_id == target.id, UserRole.role == req.role).first()
    if existing:
        return {"message": f"User already has role '{req.role}'."}

    db.add(UserRole(user_id=target.id, role=req.role, granted_by=user.id))
    db.add(AuditLog(
        user_id=user.id, register_number=user.register_number,
        action="ASSIGN_ROLE", target=req.register_number.upper(),
        details=f"Assigned role: {req.role}",
    ))
    db.commit()
    return {"message": f"Role '{req.role}' assigned to {req.register_number.upper()}."}


@router.delete("/roles/revoke")
def revoke_role(
    req: RoleAssignRequest,
    user: User = Depends(require_role("platform_admin")),
    db: Session = Depends(get_db),
):
    """Revoke a role from a user."""
    target = db.query(User).filter(User.register_number == req.register_number.upper()).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")

    deleted = db.query(UserRole).filter(UserRole.user_id == target.id, UserRole.role == req.role).delete()
    db.add(AuditLog(
        user_id=user.id, register_number=user.register_number,
        action="REVOKE_ROLE", target=req.register_number.upper(),
        details=f"Revoked role: {req.role}",
    ))
    db.commit()
    return {"message": f"Role '{req.role}' revoked." if deleted else "Role was not assigned."}


@router.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    user: User = Depends(require_role("attendance_admin", "platform_admin")),
    db: Session = Depends(get_db),
):
    """Get audit logs."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "register_number": l.register_number,
            "action": l.action,
            "target": l.target,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]
