import os
import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("database")

IS_VERCEL = bool(os.environ.get("VERCEL"))


def get_database_url() -> tuple[str, dict]:
    """Determine the active database URL.

    On Vercel: always use /tmp/app.db (SQLite), bundled app.db is copied there.
    Locally with Turso creds: use sqlite+libsql dialect.
    Locally without creds: use settings.database_url.
    """

    if IS_VERCEL:
        # On Vercel serverless: use /tmp SQLite (ephemeral but works for reads)
        tmp_db = "/tmp/app.db"
        _ensure_tmp_db(tmp_db)
        url = f"sqlite:///{tmp_db}"
        logger.info(f"Vercel serverless: using SQLite at {tmp_db}")
        return url, {"check_same_thread": False}

    # Local dev: try Turso libsql if creds are present
    if settings.turso_database_url and settings.turso_auth_token and len(settings.turso_auth_token) > 15:
        try:
            import libsql_experimental  # noqa: F401 - check if available
            turso_raw = settings.turso_database_url.strip()
            if turso_raw.startswith("libsql://"):
                host = turso_raw[len("libsql://"):]
            elif turso_raw.startswith("https://"):
                host = turso_raw[len("https://"):]
            else:
                host = turso_raw
            host = host.split("/")[0]
            url = f"sqlite+libsql://{host}?authToken={settings.turso_auth_token}&secure=true"
            logger.info(f"Connecting to Turso Cloud LibSQL: {host}")
            return url, {}
        except ImportError:
            logger.warning("libsql_experimental not available, falling back to local SQLite")

    # Local SQLite fallback
    url = settings.database_url
    logger.info(f"Using local SQLite: {url}")
    return url, {"check_same_thread": False}


def _ensure_tmp_db(tmp_db: str):
    """Copy bundled app.db to /tmp if not already there."""
    if not os.path.exists(tmp_db):
        try:
            import shutil
            # Look for app.db relative to this file (backend/app/database.py -> backend/app.db)
            candidates = [
                os.path.join(os.path.dirname(__file__), "..", "app.db"),
                os.path.join(os.path.dirname(__file__), "..", "..", "backend", "app.db"),
                "/var/task/backend/app.db",
            ]
            for candidate in candidates:
                candidate = os.path.normpath(candidate)
                if os.path.exists(candidate):
                    shutil.copyfile(candidate, tmp_db)
                    logger.info(f"Copied app.db from {candidate} to {tmp_db}")
                    return
            logger.warning("No bundled app.db found, starting with empty database")
        except Exception as e:
            logger.warning(f"Could not copy app.db: {e}")


active_url, connect_args = get_database_url()

engine = create_engine(
    active_url,
    connect_args=connect_args,
    echo=False,
)


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
