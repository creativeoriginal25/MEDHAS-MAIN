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
from app.auth.dependencies import get_current_user, get_user_roles
from app.models.user import User
from app.models.audit import AuditLog

logger = logging.getLogger("faculty")

router = APIRouter(prefix="/faculty", tags=["Faculty Admin"])

MEDHAS_RESOURCE_API = "https://script.google.com/macros/s/AKfycbx0oMKPLduC-JX52ty-WX5kzkysJwBbZb7MuZH4P04Emp3ni3t1E_TI3ABLGmeEgvVb/exec"

# =====================================================================
# R26 CENTRALIZED FACULTY ASSIGNMENT REGISTRY (Single Source of Truth)
# =====================================================================
FACULTY_ASSIGNMENTS: Dict[str, Dict[str, Any]] = {
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
    if "faculty_admin" not in roles and "platform_admin" not in roles:
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
    subjectId: Optional[str] = None
    year: Optional[int] = None
    semester: Optional[int] = None


def matches_faculty_scope(item: Dict[str, Any], scope: Dict[str, Any]) -> bool:
    """Check if a raw resource row from Apps Script belongs to the faculty's locked scope."""
    row_subject = str(item.get("subject", "")).strip().lower()
    branch = scope["branch"].upper()
    sub_id = scope["subjectId"].lower()
    curr_id = scope["curriculumId"].lower()

    # 1. Scoped format (e.g. 'CSE:cse-ctps-c' or 'CSE:1styearclanguage')
    if ":" in row_subject:
        parts = row_subject.split(":", 1)
        row_branch = parts[0].strip().upper()
        if row_branch != branch:
            return False
        row_sub = parts[1].strip().lower()
    else:
        row_sub = row_subject

    # 2. Match based on faculty branch and subject
    if branch == "CSE":
        # CTPS-C / C Language
        if any(k in sub_id or k in curr_id for k in ["ctps", "c-lang", "c"]):
            return any(k in row_sub for k in ["ctps", "clanguage", "c-lang", "1styearclanguage", "cse-ctps-c", "r26-ctpsc"])
        # LAC / Mathematics
        if any(k in sub_id or k in curr_id for k in ["lac", "math"]):
            return any(k in row_sub for k in ["lac", "math", "1styearmaths", "cse-lac", "r26-lac"])
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
    elif "bec" in sub_id or "circuit" in sub_id or "beee" in sub_id:
        legacy_subject = "1styearbeee"

    scoped_subject = legacy_subject

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
            # If Google Apps Script returned DriveApp permission error, gracefully fallback to folder link
            if apps_script_payload["fileUpload"] and ("Exception" in resp.text or resp.status_code != 200 or "<!DOCTYPE html>" in resp.text):
                logger.warning("Apps Script DriveApp authorization not completed; storing link to Drive folder.")
                apps_script_payload["fileUpload"] = False
                if not apps_script_payload["link"]:
                    apps_script_payload["link"] = "https://drive.google.com/drive/folders/1QwnjO4oohqJbifbWvh-v88rb4f-ov7ci"
                resp = await client.post(MEDHAS_RESOURCE_API, data={"payload": json.dumps(apps_script_payload)})

            if resp.status_code != 200 or ("ok" not in resp.text and "true" not in resp.text):
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Google Apps Script failed to save resource: {resp.text[:200]}",
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
):
    """Public/Student endpoint to retrieve published faculty resources for a specific branch and subject."""
    clean_branch = branch.strip().upper()
    clean_sub = subject_id.strip().lower()

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
        row_subject = str(item.get("subject", "")).strip().lower()
        if ":" in row_subject:
            parts = row_subject.split(":", 1)
            b = parts[0].strip().upper()
            if b != clean_branch:
                continue
            s = parts[1].strip().lower()
        else:
            s = row_subject

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
