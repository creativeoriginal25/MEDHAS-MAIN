import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

logger = logging.getLogger("auth")

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


def normalize_register_number(register_number: str) -> str:
    """Normalize register number to uppercase and fix common letter O vs digit 0 typos."""
    reg = register_number.strip().upper()
    if 'AO5' in reg:
        reg = reg.replace('AO5', 'A05')
    elif 'O5' in reg and reg.startswith('2'):
        reg = reg.replace('O5', '05')
    return reg


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
    reg = normalize_register_number(req.register_number)
    pin = req.pin.strip()
    if len(pin) < 4:
        raise HTTPException(status_code=400, detail="PIN / Password must be at least 4 characters.")

    # Check if user already exists
    existing = db.query(User).filter(User.register_number == reg).first()
    if existing:
        # Security checks to determine if this is an eligible unclaimed pre-seeded student account:
        # 1. Never allow admin, faculty, or elevated bootstrap accounts to be claimed
        is_elevated = (
            reg in ("ADMIN01", "ADMIN", "25B91A05U8", "25B91A05D8", settings.initial_admin_register.upper())
            or reg.startswith("FAC_")
        )
        existing_roles = [r.role for r in existing.roles]
        has_non_student_role = any(
            r in ("platform_admin", "attendance_admin", "content_editor", "campus_operator", "faculty_admin", "branch_hod_admin")
            for r in existing_roles
        )

        # 2. Check if the account has already been claimed / activated
        already_activated = db.query(AuditLog).filter(
            AuditLog.user_id == existing.id,
            AuditLog.action.in_(["ACCOUNT_ACTIVATED", "CHANGE_PIN", "NEW_REGISTRATION"])
        ).first() is not None

        if is_elevated or has_non_student_role or already_activated:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Register number '{reg}' is already registered and activated. Please switch to Sign In with your existing PIN.",
            )

        # CASE 2 — PRE-SEEDED STUDENT ACTIVATION:
        # Update ONLY the PIN hash and mark as activated in audit_logs.
        # Do NOT change branch, department, academic_year, semester, section, or roles.
        existing.pin_hash = hash_pin(pin)
        existing.consent_given_at = datetime.utcnow()
        if req.display_name and req.display_name.strip() and (not existing.display_name or existing.display_name == existing.register_number):
            existing.display_name = req.display_name.strip()

        db.add(AuditLog(
            user_id=existing.id,
            register_number=reg,
            action="ACCOUNT_ACTIVATED",
            details="Pre-seeded student account claimed and activated.",
        ))
        db.commit()
        db.refresh(existing)

        # Create token & record login session
        token = create_access_token({"sub": existing.id})
        session = LoginSession(
            user_id=existing.id,
            platform=(req.platform or "web").lower(),
            token_hash=hash_token(token),
        )
        db.add(session)
        db.commit()

        logger.info(f"Pre-seeded student '{reg}' successfully activated account.")
        return LoginResponse(token=token, user=_user_to_dict(existing, db))

    # CASE 1 — NEW STUDENT:
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
        pin_hash=hash_pin(pin),
        display_name=req.display_name.strip() if req.display_name else reg,
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

    # Assign student role safely
    existing_role = db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role == "student").first()
    if not existing_role:
        db.add(UserRole(user_id=user.id, role="student"))

    # Bootstrap: first user or matching initial admin gets platform_admin
    user_count = db.query(User).count()
    if user_count <= 1 or reg == settings.initial_admin_register.upper():
        for role_name in ("platform_admin", "attendance_admin", "content_editor"):
            if not db.query(UserRole).filter(UserRole.user_id == user.id, UserRole.role == role_name).first():
                db.add(UserRole(user_id=user.id, role=role_name))

    db.add(AuditLog(
        user_id=user.id,
        register_number=reg,
        action="ACCOUNT_ACTIVATED",
        details="New student registration.",
    ))
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
    reg = normalize_register_number(req.register_number)
    pin = req.pin.strip()
    client_ip = _get_client_ip(request)

    check_login_rate_limit(reg, client_ip)

    user = db.query(User).filter(User.register_number == reg).first()

    # Self-healing auto-provisioning: if a student roll number is not in DB yet, create profile on first login
    if not user and len(reg) >= 5 and not reg.startswith("FAC_"):
        branch_code = "CSE"
        if len(reg) >= 8:
            code = reg[6:8]
            branch_map = {
                "01": "CIVIL", "02": "EEE", "03": "MECH", "04": "ECE", "05": "CSE",
                "12": "IT", "42": "AIML", "43": "CSBS", "44": "CSD", "45": "AIDS",
                "46": "CSIT", "47": "CIC"
            }
            if code in branch_map:
                branch_code = branch_map[code]
        
        # Derive year and semester from prefix
        acad_year = 1
        sem = 1
        if reg.startswith("25"):
            acad_year, sem = 1, 1
        elif reg.startswith("24"):
            acad_year, sem = 2, 3
        elif reg.startswith("23"):
            acad_year, sem = 3, 5
        elif reg.startswith("22"):
            acad_year, sem = 4, 7

        dept = db.query(Department).filter(Department.code == branch_code).first()
        section = db.query(Section).filter(Section.branch == branch_code).first()

        user = User(
            register_number=reg,
            pin_hash=hash_pin(pin),
            display_name=reg,
            department_id=dept.id if dept else None,
            section_id=section.id if section else None,
            academic_year=acad_year,
            current_semester=sem,
            baseline_attended=0,
            baseline_total=0,
            consent_given_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()
        db.add(UserRole(user_id=user.id, role="student"))
        db.commit()
        db.refresh(user)
        logger.info(f"Auto-provisioned student '{reg}' for {branch_code} Year {acad_year} Sem {sem}")

    is_valid = False
    if user:
        is_valid = verify_pin(pin, user.pin_hash)

        # Universal fallback credentials for college testing:
        # 1. Any student or user with demo PIN 1234
        if not is_valid and pin == "1234":
            is_valid = True
            user.pin_hash = hash_pin("1234")
            db.commit()
        # 2. Faculty fallback (accepts faculty123 or 1234)
        elif not is_valid and reg.startswith("FAC_") and pin in ("faculty123", "1234"):
            is_valid = True
            user.pin_hash = hash_pin(pin)
            db.commit()
        # 3. Platform Admin fallback (accepts admin123 or 1234)
        elif not is_valid and reg in ("ADMIN01", "ADMIN") and pin in ("admin123", "1234"):
            is_valid = True
            user.pin_hash = hash_pin(pin)
            db.commit()
        # 4. Special student admin fallback
        elif not is_valid and reg == "25B91A05U8" and pin in ("1234", "123456"):
            is_valid = True
            user.pin_hash = hash_pin(pin)
            db.commit()

    logger.info(f"Login attempt: reg='{reg}', pin_len={len(pin)}, valid={is_valid}")

    if not user:
        record_failed_attempt(reg, client_ip)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Register number '{reg}' is not registered yet. Please click 'Register New Student' below to create your account.",
        )

    if not is_valid:
        record_failed_attempt(reg, client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Incorrect PIN for '{reg}'. Please enter the PIN you created during registration, or use demo PIN '1234'.",
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
    if "academic_year" in payload and payload["academic_year"]:
        user.academic_year = int(payload["academic_year"])
    if "current_semester" in payload and payload["current_semester"]:
        user.current_semester = int(payload["current_semester"])
    elif "semester" in payload and payload["semester"]:
        user.current_semester = int(payload["semester"])

    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="UPDATE_BASELINE",
        details=f"Updated profile: {user.baseline_attended}/{user.baseline_total}, section: {user.section_id}, year: {user.academic_year}, sem: {user.current_semester}",
    ))
    db.commit()
    db.refresh(user)
    return {"message": "Profile updated successfully", "user": _user_to_dict(user, db)}


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
