"""Prompts and career router — AI study tools, career paths, roadmaps from MEDHAS."""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.prompt import PromptTemplate, CareerPath, RoadmapItem
from app.models.content import Department

router = APIRouter(prefix="/grow", tags=["Growth"])


@router.get("/prompts")
def list_prompts(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """List AI prompt templates, optionally filtered by category."""
    query = db.query(PromptTemplate).filter(PromptTemplate.is_active == True)
    if category:
        query = query.filter(PromptTemplate.category == category)
    templates = query.order_by(PromptTemplate.category, PromptTemplate.task_id).all()

    # Group by category
    grouped = {}
    for t in templates:
        if t.category not in grouped:
            grouped[t.category] = []
        grouped[t.category].append({
            "id": t.id,
            "task_id": t.task_id,
            "name": t.name,
            "description": t.description,
            "personalize_fields": t.personalize_fields,
            "icon": t.icon,
        })
    return grouped


@router.get("/prompts/{template_id}")
def get_prompt(template_id: int, db: Session = Depends(get_db)):
    """Get a single prompt template with full details."""
    t = db.query(PromptTemplate).filter(PromptTemplate.id == template_id).first()
    if not t:
        return {"error": "Template not found"}
    return {
        "id": t.id,
        "category": t.category,
        "task_id": t.task_id,
        "name": t.name,
        "description": t.description,
        "personalize_fields": t.personalize_fields,
        "prompt_template": t.prompt_template,
        "icon": t.icon,
    }


@router.get("/career-paths")
def list_career_paths(
    department: Optional[str] = None,
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """List career paths, optionally filtered by department."""
    query = db.query(CareerPath)
    dept_code = department
    if not dept_code and user and user.department_id:
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        if dept:
            dept_code = dept.code

    if dept_code:
        dept = db.query(Department).filter(Department.code == dept_code.upper()).first()
        if dept:
            query = query.filter(CareerPath.department_id == dept.id)

    paths = query.order_by(CareerPath.display_order).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "skills": p.skills,
            "display_order": p.display_order,
        }
        for p in paths
    ]


@router.get("/roadmap")
def get_roadmap(
    department: Optional[str] = None,
    year: int = Query(default=1),
    semester: int = Query(default=1),
    user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    """Get roadmap items for a department/year/semester."""
    dept_code = department
    if not dept_code and user and user.department_id:
        dept = db.query(Department).filter(Department.id == user.department_id).first()
        if dept:
            dept_code = dept.code

    query = db.query(RoadmapItem).filter(
        RoadmapItem.academic_year == year,
        RoadmapItem.semester == semester,
    )
    if dept_code:
        dept = db.query(Department).filter(Department.code == dept_code.upper()).first()
        if dept:
            query = query.filter(RoadmapItem.department_id == dept.id)

    items = query.order_by(RoadmapItem.display_order).all()
    return [
        {
            "id": i.id,
            "milestone_type": i.milestone_type,
            "title": i.title,
            "description": i.description,
            "display_order": i.display_order,
        }
        for i in items
    ]
