"""Campus service models."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CampusService(Base):
    __tablename__ = "campus_services"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(String(30))  # info, facility, cafeteria, link
    icon = Column(String(10))
    external_url = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    catalog_items = relationship("ServiceCatalogItem", back_populates="service", cascade="all, delete-orphan")


class ServiceCatalogItem(Base):
    __tablename__ = "service_catalog_items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(Integer, ForeignKey("campus_services.id"), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text)
    price = Column(Float)
    category = Column(String(30))
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    service = relationship("CampusService", back_populates="catalog_items")
