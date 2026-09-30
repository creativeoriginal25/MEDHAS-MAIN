"""User and role models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    register_number = Column(String(20), unique=True, nullable=False, index=True)
    pin_hash = Column(Text, nullable=False)
    display_name = Column(String(100))
    department_id = Column(Integer, ForeignKey("departments.id"))
    section_id = Column(Integer, ForeignKey("sections.id"))
    academic_year = Column(Integer, default=1)
    current_semester = Column(Integer, default=1)
    baseline_attended = Column(Integer, default=0)
    baseline_total = Column(Integer, default=0)
    baseline_date = Column(String(10))  # YYYY-MM-DD
    consent_given_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan", foreign_keys="UserRole.user_id")
    department = relationship("Department", backref="users")
    section = relationship("Section", backref="users")
    daily_logs = relationship("DailyLog", back_populates="user", cascade="all, delete-orphan")
    saved_resources = relationship("SavedResource", back_populates="user", cascade="all, delete-orphan")


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role", name="uq_user_role"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(30), nullable=False)  # student, attendance_admin, content_editor, campus_operator, platform_admin
    granted_by = Column(Integer, ForeignKey("users.id"))
    granted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="roles", foreign_keys=[user_id])
    granter = relationship("User", foreign_keys=[granted_by])
