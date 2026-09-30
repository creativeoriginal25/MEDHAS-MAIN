"""Content router — subjects, units, resources, search."""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database import get_db
from app.auth.dependencies import get_current_user, require_role
from app.models.user import User
from app.models.content import Department, Subject, Curriculum, SubjectUnit, LearningResource, SavedResource

router = APIRouter(prefix="/content", tags=["Content"])


@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    """List all engineering departments."""
    depts = db.query(Department).order_by(Department.code).all()
    return [
        {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "icon": d.icon,
            "category": d.category,
        }
        for d in depts
    ]


@router.get("/subjects")
def list_subjects(
    department: Optional[str] = None,
    year: int = Query(default=1),
    semester: int = Query(default=1),
    db: Session = Depends(get_db),
):
    """List subjects, optionally filtered by department/year/semester via curriculum."""
    if department:
        dept = db.query(Department).filter(Department.code == department.upper()).first()
        if not dept:
            return []
        curricula = db.query(Curriculum).filter(
            Curriculum.department_id == dept.id,
            Curriculum.academic_year == year,
            Curriculum.semester == semester,
        ).all()
        subject_ids = [c.subject_id for c in curricula]
        if not subject_ids:
            return []
        subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).order_by(Subject.title).all()
    else:
        subjects = db.query(Subject).order_by(Subject.title).all()

    return [
        {
            "id": s.id,
            "code": s.code,
            "title": s.title,
            "description": s.description,
            "icon": s.icon,
        }
        for s in subjects
    ]


@router.get("/subjects/my")
def get_my_subjects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get subjects for the current user's department/year/semester."""
    if not user.department_id:
        return []

    dept = db.query(Department).filter(Department.id == user.department_id).first()
    if not dept:
        return []

    curricula = db.query(Curriculum).filter(
        Curriculum.department_id == dept.id,
        Curriculum.academic_year == user.academic_year or 1,
        Curriculum.semester == user.current_semester or 1,
    ).all()
    subject_ids = [c.subject_id for c in curricula]
    if not subject_ids:
        return []

    subjects = db.query(Subject).filter(Subject.id.in_(subject_ids)).order_by(Subject.title).all()
    return [
        {
            "id": s.id,
            "code": s.code,
            "title": s.title,
            "description": s.description,
            "icon": s.icon,
        }
        for s in subjects
    ]


@router.get("/subjects/{subject_id}/units")
def get_subject_units(subject_id: int, db: Session = Depends(get_db)):
    """Get units for a subject."""
    units = db.query(SubjectUnit).filter(
        SubjectUnit.subject_id == subject_id
    ).order_by(SubjectUnit.unit_number).all()
    return [
        {
            "id": u.id,
            "unit_number": u.unit_number,
            "title": u.title,
            "description": u.description,
        }
        for u in units
    ]


@router.get("/resources")
def list_resources(
    subject_id: Optional[int] = None,
    unit_id: Optional[int] = None,
    resource_type: Optional[str] = None,
    q: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List learning resources with optional filters."""
    query = db.query(LearningResource).filter(LearningResource.visibility == "published")

    if subject_id:
        query = query.filter(LearningResource.subject_id == subject_id)
    if unit_id:
        query = query.filter(LearningResource.unit_id == unit_id)
    if resource_type:
        query = query.filter(LearningResource.resource_type == resource_type)
    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                LearningResource.title.ilike(search),
                LearningResource.description.ilike(search),
            )
        )

    resources = query.order_by(LearningResource.created_at.desc()).limit(50).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "subject_id": r.subject_id,
            "unit_id": r.unit_id,
            "resource_type": r.resource_type,
            "external_url": r.external_url,
        }
        for r in resources
    ]


@router.get("/search")
def search_content(
    q: str = Query(..., min_length=2),
    db: Session = Depends(get_db),
):
    """Global search across subjects, resources, and departments."""
    search = f"%{q}%"

    subjects = db.query(Subject).filter(
        or_(Subject.title.ilike(search), Subject.description.ilike(search), Subject.code.ilike(search))
    ).limit(10).all()

    resources = db.query(LearningResource).filter(
        LearningResource.visibility == "published",
        or_(LearningResource.title.ilike(search), LearningResource.description.ilike(search)),
    ).limit(10).all()

    return {
        "subjects": [{"id": s.id, "code": s.code, "title": s.title, "icon": s.icon} for s in subjects],
        "resources": [
            {"id": r.id, "title": r.title, "resource_type": r.resource_type, "subject_id": r.subject_id}
            for r in resources
        ],
    }


@router.post("/resources/{resource_id}/save")
def save_resource(
    resource_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bookmark a learning resource."""
    existing = db.query(SavedResource).filter(
        SavedResource.user_id == user.id, SavedResource.resource_id == resource_id
    ).first()
    if existing:
        return {"saved": True, "message": "Already saved."}

    saved = SavedResource(user_id=user.id, resource_id=resource_id)
    db.add(saved)
    db.commit()
    return {"saved": True, "message": "Resource saved."}


@router.delete("/resources/{resource_id}/save")
def unsave_resource(
    resource_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a bookmark."""
    db.query(SavedResource).filter(
        SavedResource.user_id == user.id, SavedResource.resource_id == resource_id
    ).delete()
    db.commit()
    return {"saved": False, "message": "Bookmark removed."}


@router.get("/saved")
def get_saved_resources(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all saved/bookmarked resources for the current user."""
    saved = db.query(SavedResource).filter(SavedResource.user_id == user.id).all()
    resource_ids = [s.resource_id for s in saved]
    if not resource_ids:
        return []

    resources = db.query(LearningResource).filter(LearningResource.id.in_(resource_ids)).all()
    return [
        {
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "resource_type": r.resource_type,
            "external_url": r.external_url,
            "subject_id": r.subject_id,
        }
        for r in resources
    ]
