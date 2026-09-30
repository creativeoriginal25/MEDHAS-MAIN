"""Campus router — college info, services, cafeteria catalog."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campus import CampusService, ServiceCatalogItem

router = APIRouter(prefix="/campus", tags=["Campus"])


@router.get("/services")
def list_services(db: Session = Depends(get_db)):
    """List active campus services."""
    services = db.query(CampusService).filter(CampusService.is_active == True).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "category": s.category,
            "icon": s.icon,
            "external_url": s.external_url,
        }
        for s in services
    ]


@router.get("/services/{service_id}/catalog")
def get_service_catalog(service_id: int, db: Session = Depends(get_db)):
    """Get catalog items for a campus service."""
    items = db.query(ServiceCatalogItem).filter(
        ServiceCatalogItem.service_id == service_id,
        ServiceCatalogItem.is_available == True,
    ).all()
    return [
        {
            "id": i.id,
            "name": i.name,
            "description": i.description,
            "price": i.price,
            "category": i.category,
        }
        for i in items
    ]
