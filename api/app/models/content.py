"""Content domain models — departments, subjects, curriculum, resources from InCloudHub."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # CSE, ECE, etc.
    name = Column(Text, nullable=False)
    icon = Column(String(10))
    category = Column(String(50))
    core_topics = Column(Text)  # JSON array
    career_domains = Column(Text)  # JSON array
    created_at = Column(DateTime, default=datetime.utcnow)


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)  # BS101, ES102
    title = Column(Text, nullable=False)
    description = Column(Text)
    icon = Column(String(10))
    created_at = Column(DateTime, default=datetime.utcnow)

    units = relationship("SubjectUnit", back_populates="subject", cascade="all, delete-orphan")
    resources = relationship("LearningResource", back_populates="subject")


class Curriculum(Base):
    __tablename__ = "curricula"
    __table_args__ = (
        UniqueConstraint("department_id", "academic_year", "semester", "subject_id", name="uq_curriculum"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    academic_year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    is_elective = Column(Boolean, default=False)

    department = relationship("Department", backref="curricula")
    subject = relationship("Subject", backref="curricula")


class SubjectUnit(Base):
    __tablename__ = "subject_units"
    __table_args__ = (UniqueConstraint("subject_id", "unit_number", name="uq_subject_unit"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    unit_number = Column(Integer, nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)

    subject = relationship("Subject", back_populates="units")
    resources = relationship("LearningResource", back_populates="unit")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    subject_id = Column(Integer, ForeignKey("subjects.id"), index=True)
    unit_id = Column(Integer, ForeignKey("subject_units.id"))
    resource_type = Column(String(20), default="notes")  # notes, video, pdf, link
    external_url = Column(Text)
    visibility = Column(String(20), default="published")  # draft, published, archived
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subject = relationship("Subject", back_populates="resources")
    unit = relationship("SubjectUnit", back_populates="resources")


class SavedResource(Base):
    __tablename__ = "saved_resources"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uq_saved_resource"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("learning_resources.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved_resources")
    resource = relationship("LearningResource", backref="saved_by")
