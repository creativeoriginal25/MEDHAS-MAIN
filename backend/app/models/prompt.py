"""Growth domain models — prompt templates, career paths, roadmaps from MEDHAS."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"
    __table_args__ = (UniqueConstraint("category", "task_id", name="uq_prompt_template"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(30), nullable=False, index=True)  # study, code, research, write, present, career_profile, career_content, career_networking
    task_id = Column(String(30), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    personalize_fields = Column(Text)  # JSON array of {id, label, placeholder}
    prompt_template = Column(Text)  # Template with {{branch}}, {{subject}}, etc.
    icon = Column(String(10))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CareerPath(Base):
    __tablename__ = "career_paths"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    skills = Column(Text)  # JSON array
    resources = Column(Text)  # JSON array of links
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", backref="career_paths")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"), index=True)
    academic_year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    milestone_type = Column(String(20), nullable=False)  # academic, project, career, skill
    title = Column(Text, nullable=False)
    description = Column(Text)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", backref="roadmap_items")
