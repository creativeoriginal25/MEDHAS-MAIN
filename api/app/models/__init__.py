"""Import all models so SQLAlchemy registers them."""

from app.models.user import User, UserRole  # noqa: F401
from app.models.attendance import Section, TimetableBlock, DailyLog  # noqa: F401
from app.models.content import Department, Subject, Curriculum, SubjectUnit, LearningResource, SavedResource  # noqa: F401
from app.models.prompt import PromptTemplate, CareerPath, RoadmapItem  # noqa: F401
from app.models.campus import CampusService, ServiceCatalogItem  # noqa: F401
from app.models.audit import AuditLog, PinResetLog, LoginSession, RevokedToken, NotificationPreference  # noqa: F401
