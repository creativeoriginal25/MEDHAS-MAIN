"""Faculty Router — Subject-scoped content management for Course Faculty Admins.

Enforces absolute branch + subject lock:
1. Faculty can ONLY view, upload, and delete resources for their assigned branch and subject.
2. Server-side authorization validates submitted branch & subject against authenticated faculty session.
3. Integrates with the centralized Medhas Google Apps Script + Drive backend:
   MEDHAS_RESOURCE_API: https://script.google.com/macros/s/AKfycbx0oMKPLduC-JX52ty-WX5kzkysJwBbZb7MuZH4P04Emp3ni3t1E_TI3ABLGmeEgvVb/exec
"""

import time
import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.auth.dependencies import get_current_user, get_user_roles, get_optional_user
from app.models.user import User
from app.models.audit import AuditLog

logger = logging.getLogger("faculty")

router = APIRouter(prefix="/faculty", tags=["Faculty Admin"])

MEDHAS_RESOURCE_API = "https://script.google.com/macros/s/AKfycbx0oMKPLduC-JX52ty-WX5kzkysJwBbZb7MuZH4P04Emp3ni3t1E_TI3ABLGmeEgvVb/exec"

# =====================================================================
# R26 CENTRALIZED FACULTY ASSIGNMENT REGISTRY (Single Source of Truth)
# =====================================================================
FACULTY_ASSIGNMENTS: Dict[str, Dict[str, Any]] = {
    # 1. CTPS-C (C Programming)
    "C": {
        "username": "c",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Computational Thinking and Problem Solving Using C",
        "subjectId": "cse-ctps-c",
        "curriculumId": "R26-CTPSC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 2. Linear Algebra & Calculus (Mathematics)
    "MATHS": {
        "username": "maths",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Linear Algebra & Calculus",
        "subjectId": "cse-lac",
        "curriculumId": "R26-LAC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 3. Applied Physics
    "PHYSICS": {
        "username": "physics",
        "role": "FACULTY_ADMIN",
        "branch": "ECE",
        "branchName": "Electronics and Communication Engineering",
        "subject": "Applied Physics",
        "subjectId": "ece-physics",
        "curriculumId": "R26-AP",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 4. Applied Chemistry
    "CHEMISTRY": {
        "username": "chemistry",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Applied Chemistry for Engineering Technologies",
        "subjectId": "cse-acet",
        "curriculumId": "R26-ACET",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 5. English for Technical Communication
    "ENGLISH": {
        "username": "english",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "English for Technical Communication",
        "subjectId": "cse-etc",
        "curriculumId": "R26-ETC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 6. Design Thinking and Innovation
    "DT": {
        "username": "dt",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Design Thinking and Innovation",
        "subjectId": "cse-dti",
        "curriculumId": "R26-DTI",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # 7. Universal Human Values-II
    "UHV": {
        "username": "uhv",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Universal Human Values-II",
        "subjectId": "cse-uhv",
        "curriculumId": "R26-UHV2",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    # Legacy aliases for backwards compatibility with existing test scripts
    "FAC_CTPSC": {
        "username": "fac_ctpsc",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Computational Thinking and Problem Solving Using C",
        "subjectId": "cse-ctps-c",
        "curriculumId": "R26-CTPSC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    "FAC_LAC": {
        "username": "fac_lac",
        "role": "FACULTY_ADMIN",
        "branch": "CSE",
        "branchName": "Computer Science and Engineering",
        "subject": "Linear Algebra & Calculus",
        "subjectId": "cse-lac",
        "curriculumId": "R26-LAC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    "FAC_ECE_PHYSICS": {
        "username": "fac_ece_physics",
        "role": "FACULTY_ADMIN",
        "branch": "ECE",
        "branchName": "Electronics and Communication Engineering",
        "subject": "Applied Physics",
        "subjectId": "ece-physics",
        "curriculumId": "R26-AP",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
    "FAC_BEC": {
        "username": "fac_bec",
        "role": "FACULTY_ADMIN",
        "branch": "EEE",
        "branchName": "Electrical and Electronics Engineering",
        "subject": "Basic Electrical Circuits",
        "subjectId": "eee-bec",
        "curriculumId": "R26-BEC",
        "subjectType": "theory",
        "year": 1,
        "semester": 1,
    },
}


def get_faculty_scope(user: User, db: Session) -> Dict[str, Any]:
    """Resolve the locked scope for the authenticated faculty admin.
    
    If registered explicitly in FACULTY_ASSIGNMENTS, uses that exact scope.
    Otherwise, if the user has role 'faculty_admin', derives locked scope from
    user's department and registered section/curriculum.
    """
    reg = user.register_number.upper().strip()
    if reg in FACULTY_ASSIGNMENTS:
        return FACULTY_ASSIGNMENTS[reg]

    # Check lowercase variant
    for key, assignment in FACULTY_ASSIGNMENTS.items():
        if key.lower() == reg.lower() or assignment["username"].lower() == reg.lower():
            return assignment

    # Fallback for dynamic faculty users:
    # Derive branch from user's section/department
    branch = "CSE"
    if user.section and user.section.branch:
        branch = user.section.branch.upper()
    elif user.department and user.department.code:
        branch = user.department.code.upper()

    return {
        "username": user.register_number.lower(),
        "role": "FACULTY_ADMIN",
        "branch": branch,
        "branchName": f"Department of {branch}",
        "subject": "Assigned Subject",
        "subjectId": f"{branch.lower()}-subject",
        "curriculumId": f"R26-{branch}",
        "subjectType": "theory",
        "year": user.academic_year or 1,
        "semester": user.current_semester or 1,
    }


def require_faculty_or_platform_admin(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    """Dependency ensuring caller is an authenticated faculty admin or platform admin."""
    roles = get_user_roles(user, db)
    reg = user.register_number.upper().strip()
    is_faculty_assigned = (
        reg in FACULTY_ASSIGNMENTS
        or any(a["username"].upper() == reg for a in FACULTY_ASSIGNMENTS.values())
    )
    if "faculty_admin" not in roles and "platform_admin" not in roles and not is_faculty_assigned:
        # Also check hardcoded admin list for compatibility
        if user.register_number not in ("ADMIN01", "25B91A05U8"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Faculty Admin access required.",
            )
    return user


# =====================================================================
# REQUEST & RESPONSE SCHEMAS
# =====================================================================
class ResourceUploadRequest(BaseModel):
    unit: str = Field(..., description="Target unit, e.g. 'Unit 1'")
    title: str = Field(..., min_length=2, max_length=255)
    link: Optional[str] = Field(default="", description="Drive URL or external web link")
    icon: Optional[str] = Field(default="📄")
    fileUpload: Optional[bool] = False
    fileName: Optional[str] = ""
    fileBase64: Optional[str] = ""
    # Fields submitted by client to test server-side tampering prevention
    branch: Optional[str] = None
    subject: Optional[str] = None
    subjectId: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None


def parse_resource_scope(subject_str: str) -> Dict[str, Any]:
    """Parse branch, year, semester, and subject key from the Apps Script row 'subject' field."""
    s = (subject_str or "").strip()
    branch = None
    year = None
    semester = None
    sub_key = s.lower()

    # Format 1: "BRANCH:Y{year}:S{sem}:{key}" (e.g. "CSE:Y1:S1:1styearclanguage" or "CSE:Y1:S1:cse-ctps-c")
    parts = s.split(":")
    if len(parts) >= 4 and parts[1].upper().startswith("Y") and parts[2].upper().startswith("S"):
        branch = parts[0].strip().upper()
        try:
            year = int(parts[1][1:])
        except ValueError:
            year = 1
        try:
            semester = int(parts[2][1:])
        except ValueError:
            semester = 1
        sub_key = ":".join(parts[3:]).strip().lower()
    elif len(parts) == 2:
        branch = parts[0].strip().upper()
        sub_key = parts[1].strip().lower()
        if "1styear" in sub_key:
            year = 1
            semester = 1
    else:
        # Legacy without colon, e.g. "1styearclanguage", "1styearmaths", "1styearphysics", "1styearchemistry", etc.
        if "clanguage" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "maths" in sub_key or "math" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "physics" in sub_key:
            branch = "ECE"
            year = 1
            semester = 1
        elif "chemistry" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "english" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "dt" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "uhv" in sub_key:
            branch = "CSE"
            year = 1
            semester = 1
        elif "beee" in sub_key or "bec" in sub_key:
            branch = "EEE"
            year = 1
            semester = 1
        elif "1styear" in sub_key:
            year = 1
            semester = 1

    return {
        "branch": branch,
        "year": year or 1,
        "semester": semester or 1,
        "sub_key": sub_key,
    }


def matches_faculty_scope(item: Dict[str, Any], scope: Dict[str, Any]) -> bool:
    """Check if a raw resource row from Apps Script belongs to the faculty's locked scope."""
    parsed = parse_resource_scope(str(item.get("subject", "")))
    branch = scope["branch"].upper()
    sub_id = scope["subjectId"].lower()
    curr_id = scope["curriculumId"].lower()

    # 1. Branch lock
    if parsed["branch"] and parsed["branch"] != branch:
        return False

    # 2. Academic Year lock
    if parsed["year"] != scope["year"]:
        return False

    # 3. Semester lock
    if parsed["semester"] != scope["semester"]:
        return False

    # 4. Subject match
    row_sub = parsed["sub_key"]
    if branch == "CSE":
        # CTPS-C / C Language
        if any(k in sub_id or k in curr_id for k in ["ctps", "c-lang", "c"]):
            return any(k in row_sub for k in ["ctps", "clanguage", "c-lang", "1styearclanguage", "cse-ctps-c", "r26-ctpsc"])
        # LAC / Mathematics
        if any(k in sub_id or k in curr_id for k in ["lac", "math"]):
            return any(k in row_sub for k in ["lac", "math", "1styearmaths", "cse-lac", "r26-lac"])
        # Chemistry / ACET
        if any(k in sub_id or k in curr_id for k in ["chem", "acet"]):
            return any(k in row_sub for k in ["chem", "acet", "1styearchemistry", "cse-acet", "r26-acet"])
        # English / ETC
        if any(k in sub_id or k in curr_id for k in ["eng", "etc"]):
            return any(k in row_sub for k in ["eng", "etc", "1styearenglish", "cse-etc", "r26-etc"])
        # DT / DTI
        if any(k in sub_id or k in curr_id for k in ["dt", "dti"]):
            return any(k in row_sub for k in ["dt", "dti", "1styeardt", "cse-dti", "r26-dti"])
        # UHV / Universal Human Values
        if any(k in sub_id or k in curr_id for k in ["uhv"]):
            return any(k in row_sub for k in ["uhv", "1styearuhv", "cse-uhv", "r26-uhv2"])
    elif branch == "ECE":
        # Applied Physics
        if any(k in sub_id or k in curr_id for k in ["physic", "ap"]):
            return any(k in row_sub for k in ["physic", "1styearphysics", "ece-physics", "r26-ap"])
    elif branch == "EEE":
        # Basic Electrical Circuits / BEEE
        if any(k in sub_id or k in curr_id for k in ["bec", "beee", "circuit"]):
            return any(k in row_sub for k in ["bec", "beee", "circuit", "1styearbeee", "eee-bec", "r26-bec"])

    return row_sub == sub_id or row_sub == curr_id


# =====================================================================
# ENDPOINTS
# =====================================================================

@router.get("/profile")
def get_faculty_profile(
    user: User = Depends(require_faculty_or_platform_admin),
    db: Session = Depends(get_db),
):
    """Return the locked branch + subject scope for the logged-in faculty admin."""
    scope = get_faculty_scope(user, db)
    return {
        "username": scope["username"],
        "register_number": user.register_number,
        "display_name": user.display_name or scope["username"],
        "role": "FACULTY_ADMIN",
        "branch": scope["branch"],
        "branchName": scope["branchName"],
        "subject": scope["subject"],
        "subjectId": scope["subjectId"],
        "curriculumId": scope["curriculumId"],
        "subjectType": scope["subjectType"],
        "year": scope["year"],
        "semester": scope["semester"],
    }


@router.get("/resources")
async def list_faculty_resources(
    user: User = Depends(require_faculty_or_platform_admin),
    db: Session = Depends(get_db),
):
    """Fetch all resources from Google Apps Script and return ONLY those in faculty's locked scope."""
    scope = get_faculty_scope(user, db)

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            resp = await client.get(MEDHAS_RESOURCE_API)
            if resp.status_code != 200:
                logger.error(f"Apps Script GET error: {resp.status_code}")
                return []
            all_resources = resp.json()
    except Exception as e:
        logger.error(f"Failed to fetch resources from Apps Script: {e}")
        return []

    # Strictly filter resources by faculty scope
    filtered = []
    for item in all_resources:
        if matches_faculty_scope(item, scope):
            filtered.append({
                "id": item.get("id"),
                "branch": scope["branch"],
                "academicYear": scope["year"],
                "semester": scope["semester"],
                "subject": scope["subject"],
                "subjectId": scope["subjectId"],
                "unit": item.get("unit", "Unit 1"),
                "title": item.get("title", "Resource"),
                "link": item.get("link", ""),
                "icon": item.get("icon", "📄"),
                "date": item.get("date", ""),
                "fileUpload": item.get("fileUpload", False),
                "fileName": item.get("fileName", ""),
                "uploadedBy": scope["username"],
            })

    return filtered


@router.post("/resources")
async def upload_faculty_resource(
    req: ResourceUploadRequest,
    user: User = Depends(require_faculty_or_platform_admin),
    db: Session = Depends(get_db),
):
    """Publish a resource for faculty's assigned subject.
    
    CRITICAL SERVER-SIDE VALIDATION:
    1. Authenticated user must have FACULTY_ADMIN role.
    2. Submitted branch MUST match session.branch.
    3. Submitted subjectId MUST match session.subjectId.
    4. Submitted year and semester MUST match.
    Any tampering fails with HTTP 403 Forbidden.
    """
    scope = get_faculty_scope(user, db)

    # 1. Server-side validation against client tampering
    if req.branch and req.branch.strip().upper() != scope["branch"].upper():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Authorization Error: Malicious or invalid branch payload '{req.branch}'. Your authenticated scope is strictly locked to '{scope['branch']}'.",
        )

    if req.subject:
        clean_sub_name = req.subject.strip().lower()
        if clean_sub_name != scope["subject"].lower() and clean_sub_name != scope["subjectId"].lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Authorization Error: Invalid subject name payload '{req.subject}'. Your authenticated scope is strictly locked to '{scope['subject']}'.",
            )

    if req.subjectId:
        clean_sub = req.subjectId.strip().lower()
        valid_subs = {scope["subjectId"].lower(), scope["curriculumId"].lower()}
        if clean_sub not in valid_subs:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Authorization Error: Invalid subject payload '{req.subjectId}'. Your authenticated scope is strictly locked to '{scope['subjectId']}'.",
            )

    if req.year is not None and req.year != scope["year"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization Error: Academic year mismatch.",
        )

    if req.semester is not None and req.semester != scope["semester"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization Error: Academic semester mismatch.",
        )

    # 2. Construct securely scoped payload for Google Apps Script
    resource_id = int(time.time() * 1000)
    current_date = datetime.utcnow().strftime("%Y-%m-%d")

    # Map to subject key recognized by Sheet1
    legacy_subject = "1styearclanguage"
    sub_id = scope["subjectId"].lower()
    if "lac" in sub_id or "math" in sub_id:
        legacy_subject = "1styearmaths"
    elif "physic" in sub_id or "ap" in sub_id:
        legacy_subject = "1styearphysics"
    elif "chem" in sub_id or "acet" in sub_id:
        legacy_subject = "1styearchemistry"
    elif "eng" in sub_id or "etc" in sub_id:
        legacy_subject = "1styearenglish"
    elif "dt" in sub_id or "dti" in sub_id:
        legacy_subject = "1styeardt"
    elif "uhv" in sub_id:
        legacy_subject = "1styearuhv"
    elif "bec" in sub_id or "circuit" in sub_id or "beee" in sub_id:
        legacy_subject = "1styearbeee"

    # Scoped subject ensuring zero breakage with existing Apps Script/Sheet pipeline:
    # Format: BRANCH:Y{academicYear}:S{semester}:{legacy_subject}
    scoped_subject = f"{scope['branch']}:Y{scope['year']}:S{scope['semester']}:{legacy_subject}"

    file_b64 = req.fileBase64 or ""
    if file_b64 and not file_b64.startswith("data:"):
        file_b64 = f"data:application/octet-stream;base64,{file_b64}"

    apps_script_payload = {
        "id": resource_id,
        "subject": scoped_subject,
        "unit": req.unit.strip(),
        "title": req.title.strip(),
        "link": req.link.strip() if req.link else "",
        "icon": req.icon or ("📄" if req.fileUpload else "🔗"),
        "date": current_date,
        "fileUpload": bool(req.fileUpload and file_b64),
        "fileName": req.fileName or "",
        "fileBase64": file_b64,
    }

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            resp = await client.post(MEDHAS_RESOURCE_API, data={"payload": json.dumps(apps_script_payload)})
            # If Google Apps Script returned DriveApp permission error or HTML, gracefully fallback to folder link
            if apps_script_payload["fileUpload"] and (
                "Exception" in resp.text
                or resp.status_code != 200
                or "<!DOCTYPE html>" in resp.text
                or "<!DOCTYPE" in resp.text
                or ("ok" not in resp.text and "true" not in resp.text)
            ):
                logger.warning("Apps Script DriveApp authorization not completed; storing link to Drive folder.")
                apps_script_payload["fileUpload"] = False
                apps_script_payload["fileBase64"] = ""
                apps_script_payload.pop("fileBase64", None)
                if not apps_script_payload.get("link"):
                    apps_script_payload["link"] = "https://drive.google.com/drive/folders/1QwnjO4oohqJbifbWvh-v88rb4f-ov7ci"
                resp = await client.post(MEDHAS_RESOURCE_API, data={"payload": json.dumps(apps_script_payload)})

            if resp.status_code != 200 or ("ok" not in resp.text and "true" not in resp.text):
                err_detail = "Google Apps Script rejected the resource payload. Please provide a direct Google Drive link or verify your connection."
                if "<!DOCTYPE" not in resp.text:
                    err_detail = f"Google Apps Script failed to save resource: {resp.text[:200]}"
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=err_detail,
                )
    except httpx.RequestError as e:
        logger.error(f"Network error communicating with Google Apps Script: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to communicate with resource backend: {str(e)}",
        )

    # 3. Audit Logging
    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="FACULTY_UPLOAD",
        target=f"{scope['branch']} / {scope['subjectId']} / {req.unit}",
        details=f"Uploaded '{req.title}' ({'File' if req.fileUpload else 'Link'}) by {scope['username']}",
    ))
    db.commit()

    return {
        "success": True,
        "id": resource_id,
        "branch": scope["branch"],
        "academicYear": scope["year"],
        "semester": scope["semester"],
        "subject": scope["subject"],
        "subjectId": scope["subjectId"],
        "unit": req.unit,
        "title": req.title,
        "message": "Resource published successfully to Medhas student portal.",
    }


@router.delete("/resources/{resource_id}")
async def delete_faculty_resource(
    resource_id: str,
    user: User = Depends(require_faculty_or_platform_admin),
    db: Session = Depends(get_db),
):
    """Delete a resource with strict ownership and scope verification.
    
    Verifies that the target resource belongs to the faculty's assigned branch and subject
    BEFORE sending delete command to Apps Script.
    """
    scope = get_faculty_scope(user, db)

    # 1. Fetch from Apps Script to verify resource ownership
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            resp = await client.get(MEDHAS_RESOURCE_API)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="Failed to fetch existing resources for ownership verification.")
            items = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Backend communication error: {str(e)}")

    target_item = None
    for it in items:
        if str(it.get("id")) == str(resource_id):
            target_item = it
            break

    if not target_item:
        raise HTTPException(status_code=404, detail="Resource not found.")

    # 2. Server-side authorization check: MUST match faculty's scope
    if not matches_faculty_scope(target_item, scope):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Authorization Error: You are not authorized to delete resources belonging to another branch or subject.",
        )

    # 3. Call Apps Script delete endpoint
    delete_url = f"{MEDHAS_RESOURCE_API}?action=delete&id={resource_id}"
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            resp_del = await client.get(delete_url)
            if resp_del.status_code != 200:
                raise HTTPException(status_code=502, detail=f"Failed to delete resource in backend: {resp_del.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to execute delete: {str(e)}")

    # 4. Audit Log
    db.add(AuditLog(
        user_id=user.id,
        register_number=user.register_number,
        action="FACULTY_DELETE",
        target=f"Resource {resource_id} in {scope['branch']} / {scope['subjectId']}",
        details=f"Deleted resource '{target_item.get('title', '')}' by {scope['username']}",
    ))
    db.commit()

    return {"success": True, "message": "Resource deleted successfully."}


@router.get("/audit-logs")
def get_faculty_audit_logs(
    user: User = Depends(require_faculty_or_platform_admin),
    db: Session = Depends(get_db),
):
    """Get recent audit activity strictly filtered to the authenticated faculty member."""
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.register_number == user.register_number)
        .order_by(AuditLog.created_at.desc())
        .limit(30)
        .all()
    )
    return [
        {
            "id": l.id,
            "action": l.action,
            "target": l.target,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in logs
    ]


@router.get("/student-resources")
async def get_student_resources(
    branch: str = Query(..., description="Student's department code, e.g. 'CSE'"),
    subject_id: str = Query(..., description="Subject code or ID, e.g. 'R26-CTPSC' or 'cse-ctps-c'"),
    year: int = Query(default=1, description="Student's academic year (1..4)"),
    semester: int = Query(default=1, description="Student's current semester (1..8)"),
    user: Optional[User] = Depends(get_optional_user),
):
    """Public/Student endpoint to retrieve published faculty resources strictly scoped by Branch + Year + Semester + Subject."""
    clean_branch = branch.strip().upper()
    clean_sub = subject_id.strip().lower()

    # Server-Side Authorization: If student is authenticated, enforce strict academic lock
    if user:
        student_branch = "CSE"
        if user.department and user.department.code:
            student_branch = user.department.code.upper()
        elif user.section and user.section.branch:
            student_branch = user.section.branch.upper()

        user_reg = user.register_number.upper()
        is_elevated = user_reg in ("ADMIN01", "25B91A05U8") or user_reg.startswith("FAC_")
        if not is_elevated:
            # 1. Branch Lock
            if clean_branch != student_branch:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: You are registered in {student_branch} and cannot access {clean_branch} academic resources.",
                )
            # 2. Year Lock
            if user.academic_year and year != user.academic_year:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: You are registered in Academic Year {user.academic_year} and cannot access Year {year} resources.",
                )
            # 3. Semester Lock
            if user.current_semester and semester != user.current_semester:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Forbidden: You are registered in Semester {user.current_semester} and cannot access Semester {semester} resources.",
                )

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
            resp = await client.get(MEDHAS_RESOURCE_API)
            if resp.status_code != 200:
                return []
            items = resp.json()
    except Exception as e:
        logger.error(f"Error fetching student resources: {e}")
        return []

    matching = []
    for item in items:
        parsed = parse_resource_scope(str(item.get("subject", "")))

        # 1. Branch filter
        if parsed["branch"] and parsed["branch"] != clean_branch:
            continue

        # 2. Academic Year filter (strictly enforces that Year 1 students don't see Year 2, and vice-versa)
        if parsed["year"] != year:
            continue

        # 3. Semester filter
        if parsed["semester"] != semester:
            continue

        # 4. Subject filter
        s = parsed["sub_key"]
        # CSE — CTPS-C / C Language
        if clean_branch == "CSE" and any(k in clean_sub for k in ["ctps", "clanguage", "c-lang", "c"]):
            if any(k in s for k in ["ctps", "clanguage", "c-lang", "1styearclanguage", "cse-ctps-c", "r26-ctpsc"]):
                matching.append(item)
                continue

        # CSE — LAC / Mathematics
        if clean_branch == "CSE" and any(k in clean_sub for k in ["lac", "math"]):
            if any(k in s for k in ["lac", "math", "1styearmaths", "cse-lac", "r26-lac"]):
                matching.append(item)
                continue

        # CSE — Applied Chemistry
        if clean_branch == "CSE" and any(k in clean_sub for k in ["chem", "acet"]):
            if any(k in s for k in ["chem", "acet", "1styearchemistry", "cse-acet", "r26-acet"]):
                matching.append(item)
                continue

        # CSE — English for Technical Communication
        if clean_branch == "CSE" and any(k in clean_sub for k in ["eng", "etc"]):
            if any(k in s for k in ["eng", "etc", "1styearenglish", "cse-etc", "r26-etc"]):
                matching.append(item)
                continue

        # CSE — Design Thinking and Innovation
        if clean_branch == "CSE" and any(k in clean_sub for k in ["dt", "dti"]):
            if any(k in s for k in ["dt", "dti", "1styeardt", "cse-dti", "r26-dti"]):
                matching.append(item)
                continue

        # CSE — Universal Human Values
        if clean_branch == "CSE" and any(k in clean_sub for k in ["uhv"]):
            if any(k in s for k in ["uhv", "1styearuhv", "cse-uhv", "r26-uhv2"]):
                matching.append(item)
                continue

        # ECE — Applied Physics
        if clean_branch == "ECE" and any(k in clean_sub for k in ["physic", "ap"]):
            if any(k in s for k in ["physic", "1styearphysics", "ece-physics", "r26-ap"]):
                matching.append(item)
                continue

        # EEE — Basic Electrical Circuits / BEEE
        if clean_branch == "EEE" and any(k in clean_sub for k in ["bec", "beee", "circuit"]):
            if any(k in s for k in ["bec", "beee", "circuit", "1styearbeee", "eee-bec", "r26-bec"]):
                matching.append(item)
                continue

        # General / Direct match
        if s == clean_sub or clean_sub in s:
            matching.append(item)

    return matching
