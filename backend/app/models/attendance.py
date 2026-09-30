"""Attendance domain models — adapted from APY."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (UniqueConstraint("branch", "section_label", name="uq_section"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    branch = Column(String(10), nullable=False)
    section_label = Column(String(5), nullable=False)
    effective_from = Column(String(10), nullable=False)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", backref="sections")
    blocks = relationship("TimetableBlock", back_populates="section", cascade="all, delete-orphan")


class TimetableBlock(Base):
    __tablename__ = "timetable_blocks"
    __table_args__ = (
        UniqueConstraint("section_id", "weekday", "order_index", name="uq_block"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False)  # 0=Sun..6=Sat
    order_index = Column(Integer, nullable=False)
    subject = Column(String(50), nullable=False)
    periods = Column(Integer, nullable=False)  # Labs=4, Lectures=2

    section = relationship("Section", back_populates="blocks")
    daily_logs = relationship("DailyLog", back_populates="block")


class DailyLog(Base):
    __tablename__ = "daily_logs"
    __table_args__ = (
        UniqueConstraint("user_id", "log_date", "block_id", name="uq_daily_log"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(String(10), nullable=False)  # YYYY-MM-DD
    block_id = Column(Integer, ForeignKey("timetable_blocks.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(10), nullable=False)  # present, absent, holiday
    notes = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="daily_logs")
    block = relationship("TimetableBlock", back_populates="daily_logs")
