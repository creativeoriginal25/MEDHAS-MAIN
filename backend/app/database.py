import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("database")

def get_database_url() -> tuple[str, dict]:
    """Determine the active database URL (Turso cloud or local SQLite)."""
    if settings.turso_database_url and settings.turso_auth_token and len(settings.turso_auth_token) > 15:
        turso_raw = settings.turso_database_url.strip()
        if turso_raw.startswith("libsql://"):
            host = turso_raw[len("libsql://"):]
        elif turso_raw.startswith("https://"):
            host = turso_raw[len("https://"):]
        elif turso_raw.startswith("http://"):
            host = turso_raw[len("http://"):]
        else:
            host = turso_raw

        host = host.split("/")[0] # remove path
        url = f"sqlite+libsql://{host}?authToken={settings.turso_auth_token}&secure=true"
        logger.info(f"Connecting to Turso Cloud LibSQL database: {host}")
        return url, {}

    # Local SQLite fallback
    url = settings.database_url
    if os.environ.get("VERCEL") and "sqlite" in url:
        tmp_db = "/tmp/app.db"
        if not os.path.exists(tmp_db):
            try:
                import shutil
                local_app_db = os.path.join(os.path.dirname(__file__), "..", "app.db")
                if os.path.exists(local_app_db):
                    shutil.copyfile(local_app_db, tmp_db)
            except Exception as e:
                logger.warning(f"Notice during serverless DB init: {e}")
        url = f"sqlite:///{tmp_db}"

    return url, {"check_same_thread": False} if "sqlite" in url else {}

active_url, connect_args = get_database_url()

engine = create_engine(
    active_url,
    connect_args=connect_args,
    echo=False,
)

# Enable WAL mode and foreign keys for standard local SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in active_url and "libsql" not in active_url:
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL;")
            cursor.execute("PRAGMA foreign_keys=ON;")
            cursor.close()
        except Exception:
            pass


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency that yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_all_tables():
    """Create all tables — used for initial setup and testing."""
    Base.metadata.create_all(bind=engine)
