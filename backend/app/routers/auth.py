from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import hash_pin, verify_pin
from app.auth.jwt import create_access_token, hash_token
from app.auth.rate_limit import check_login_rate_limit, record_failed_attempt, clear_rate_limit
from app.auth.dependencies import get_current_user
from app.models.user import User, UserRole
from app.models.audit import LoginSession, RevokedToken, AuditLog
from app.models.attendance import Section
from app.models.content import Department
from app.schemas import RegisterRequest, LoginRequest, LoginResponse, ChangePinRequest, MessageResponse
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Auth"])


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "127.0.0.1")


def _user_to_dict(user: User, db: Session) -> dict:
    roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    role_list = [r.role for r in roles]
    dept = db.query(Department).filter(Department.id == user.department_id).first() if user.department_id else None
    section = db.query(Section).filter(Section.id == user.section_id).first() if user.section_id else None
    return {
        "id": user.id,
        "register_number": user.register_number,
        "display_name": user.display_name,
        "department_id": user.department_id,
        "branch": dept.code if dept else (section.branch if section else None),
        "section_id": user.section_id,
        "section_label": section.section_label if section else None,
        "academic_year": user.academic_year,
        "current_semester": user.current_semester,
        "baseline_attended": user.baseline_attended,
        "baseline_total": user.baseline_total,
        "baseline_date": user.baseline_date,
        "roles": role_list,
        "is_admin": any(r in ("attendance_admin", "content_editor", "campus_operator", "platform_admin") for r in role_list),
    }


@router.post("/register", response_model=LoginResponse)
def register(req: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    reg = req.register_number.strip().upper()

    # Check if user already exists
    existing = db.query(User).filter(User.register_number == reg).first()
    if existing:
        raise HTTPException(status_code=409, detail="Register number already exists. Please login.")

    # Find or create section
    section = None
    if req.branch and req.section:
        section = db.query(Section).filter(
            Section.branch == req.branch.upper(),
            Section.section_label == req.section.upper(),
        ).first()

    # Find department
    dept = None
    if req.branch:
        dept = db.query(Department).filter(Department.code == req.branch.upper()).first()

    # Create user
    user = User(
        register_number=reg,
        pin_hash=hash_pin(req.pin),
        display_name=req.display_name,
        department_id=dept.id if dept else None,
        section_id=section.id if section else None,
        academic_year=req.academic_year or 1,
        current_semester=req.semester or ((req.academic_year or 1) * 2 - 1),
        baseline_attended=req.baseline_attended or 0,
        baseline_total=req.baseline_total or 0,
        baseline_date=req.baseline_date if (req.baseline_total or 0) > 0 else None,
        consent_given_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    # Assign student role
    student_role = UserRole(user_id=user.id, role="student")
    db.add(student_role)

    # Bootstrap: first user or matching initial admin gets platform_admin
    user_count = db.query(User).count()
    if user_count <= 1 or reg == settings.initial_admin_register.upper():
        for role_name in ("platform_admin", "attendance_admin", "content_editor"):
            db.add(UserRole(user_id=user.id, role=role_name))

    db.commit()
    db.refresh(user)

    # Create token
    token = create_access_token({"sub": user.id})

    # Record login session
    session = LoginSession(
        user_id=user.id,
        platform=(req.platform or "web").lower(),
        token_hash=hash_token(token),
    )
    db.add(session)
    db.commit()

    return LoginResponse(token=token, user=_user_to_dict(user, db))


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, request: Request, db: Session = Depends(get_db)):
    reg = req.register_number.strip().upper()
    client_ip = _get_client_ip(request)

    check_login_rate_limit(reg, client_ip)

    user = db.query(User).filter(User.register_number == reg).first()
    if not user or not verify_pin(req.pin, user.pin_hash):
        record_failed_attempt(reg, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid register number or PIN.",
        )

    clear_rate_limit(reg)

    token = create_access_token({"sub": user.id})

    # Record login session
    session = LoginSession(
        user_id=user.id,
        platform=(req.platform or "web").lower(),
        token_hash=hash_token(token),
    )
    db.add(session)
    db.commit()

    return LoginResponse(token=token, user=_user_to_dict(user, db))


@router.post("/logout", response_model=MessageResponse)
def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Revoke the current token
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if token:
        t_hash = hash_token(token)
        revoked = RevokedToken(token_hash=t_hash)
        db.add(revoked)
        # Remove login session
        db.query(LoginSession).filter(LoginSession.token_hash == t_hash).delete()
        db.commit()

    return MessageResponse(message="Logged out successfully.")


@router.get("/me")
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _user_to_dict(user, db)


@router.post("/change-pin", response_model=MessageResponse)
def change_pin(
    req: ChangePinRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_pin(req.current_pin, user.pin_hash):
        raise HTTPException(status_code=400, detail="Current PIN is incorrect.")

    user.pin_hash = hash_pin(req.new_pin)
    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="CHANGE_PIN",
        details="User changed their own PIN.",
    ))
    db.commit()

    return MessageResponse(message="PIN changed successfully.")


@router.post("/baseline")
def update_baseline(
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update baseline attendance and optionally section."""
    if "baseline_attended" in payload:
        user.baseline_attended = int(payload["baseline_attended"])
    if "baseline_total" in payload:
        user.baseline_total = int(payload["baseline_total"])
    if "baseline_date" in payload:
        user.baseline_date = payload["baseline_date"]
    if "section_id" in payload and payload["section_id"]:
        user.section_id = int(payload["section_id"])

    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="UPDATE_BASELINE",
        details=f"Updated baseline: {user.baseline_attended}/{user.baseline_total}, section: {user.section_id}",
    ))
    db.commit()
    return {"message": "Baseline updated successfully", "user": _user_to_dict(user, db)}


@router.post("/delete-account")
def delete_account(
    payload: dict,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """DPDP Act 2023 - Student Right to Erasure."""
    pin = payload.get("pin", "")
    if not verify_pin(pin, user.pin_hash):
        raise HTTPException(status_code=400, detail="Verification PIN incorrect.")

    reg = user.register_number
    db.add(AuditLog(
        user_id=user.id,
        register_number=reg,
        action="DELETE_ACCOUNT",
        details="Student requested permanent account deletion under DPDP Act 2023.",
    ))
    db.delete(user)
    db.commit()
    return {"message": f"Account {reg} and associated records successfully erased."}
