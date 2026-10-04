import os
import shutil
import tempfile
import logging
from pathlib import Path
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger("database")

IS_VERCEL = bool(os.environ.get("VERCEL"))


def _ensure_tmp_db(tmp_db: str):
    """Copy bundled app.db to temp storage if not already there or if invalid."""
    os.makedirs(os.path.dirname(tmp_db), exist_ok=True)

    if os.path.exists(tmp_db) and os.path.getsize(tmp_db) > 10000:
        return

    candidates = [
        os.path.join(os.path.dirname(__file__), "..", "app.db"),
        os.path.join(os.path.dirname(__file__), "..", "..", "backend", "app.db"),
        os.path.join(os.path.dirname(__file__), "..", "..", "api", "app.db"),
        "/var/task/backend/app.db",
        "/var/task/api/app.db",
        "/var/task/app.db",
        os.path.join(os.getcwd(), "backend", "app.db"),
        os.path.join(os.getcwd(), "api", "app.db"),
        os.path.join(os.getcwd(), "app.db"),
    ]
    for candidate in candidates:
        candidate = os.path.normpath(candidate)
        if os.path.exists(candidate) and os.path.getsize(candidate) > 10000:
            try:
                shutil.copyfile(candidate, tmp_db)
                logger.info(f"Copied app.db from {candidate} to {tmp_db} ({os.path.getsize(tmp_db)} bytes)")
                return
            except Exception as e:
                logger.warning(f"Could not copy app.db from {candidate}: {e}")

    # Recursive search in /var/task if running on AWS Lambda / Vercel
    if os.path.exists("/var/task"):
        for root, _, files in os.walk("/var/task"):
            if "app.db" in files:
                p = os.path.join(root, "app.db")
                if os.path.getsize(p) > 10000:
                    try:
                        shutil.copyfile(p, tmp_db)
                        logger.info(f"Copied app.db from tree search {p} to {tmp_db}")
                        return
                    except Exception:
                        pass

    logger.warning("No valid bundled app.db found on disk, will initialize fresh tables.")


from sqlalchemy.dialects.sqlite.pysqlite import SQLiteDialect_pysqlite
from sqlalchemy.dialects import registry


class LibSQLDialect(SQLiteDialect_pysqlite):
    """Custom SQLite dialect adapter for LibSQL/Turso driver without create_function calls."""
    supports_statement_cache = True

    def on_connect_url(self, url):
        return None

    def on_connect(self):
        return None


registry.impls["sqlite.libsql_turso"] = lambda: LibSQLDialect



def create_database_engine():
    """Build the active database engine."""
    turso_url = (
        os.environ.get("TURSO_DATABASE_URL")
        or settings.turso_database_url
        or ""
    ).strip().strip("'\"")
    turso_token = (
        os.environ.get("TURSO_AUTH_TOKEN")
        or settings.turso_auth_token
        or ""
    ).strip().strip("'\"")

    if IS_VERCEL and turso_url:
        try:
            import libsql

            clean_url = turso_url
            if clean_url.startswith("https://"):
                clean_url = "libsql://" + clean_url[len("https://"):]
            elif not clean_url.startswith("libsql://") and not clean_url.startswith("http"):
                clean_url = "libsql://" + clean_url

            logger.info(f"Vercel serverless: initializing persistent Turso Cloud connection ({clean_url})")
            return create_engine(
                "sqlite+libsql_turso://",
                creator=lambda: libsql.connect(clean_url, auth_token=turso_token),
                echo=False,
            )
        except Exception as e:
            logger.error(f"Failed to initialize Turso engine: {e}", exc_info=True)

    # Local development SQLite
    url = settings.database_url
    if url.startswith("sqlite:///") and ":memory:" not in url:
        db_path_str = url.replace("sqlite:///", "", 1)
        if not os.path.isabs(db_path_str):
            backend_dir = Path(__file__).resolve().parent.parent
            resolved_db = (backend_dir / db_path_str.lstrip(".\\/")).resolve()
            url = f"sqlite:///{resolved_db.as_posix()}"
    logger.info(f"Using local SQLite: {url}")
    return create_engine(url, connect_args={"check_same_thread": False}, echo=False)


engine = create_database_engine()


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if hasattr(dbapi_connection, "cursor"):
        if type(dbapi_connection).__module__ == "sqlite3":
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


def ensure_database_ready():
    """Self-healing setup: ensures tables exist and seed data is populated if empty."""
    try:
        create_all_tables()
        db = SessionLocal()
        from app.models.user import User
        count = db.query(User).count()
        db.close()
        if count == 0:
            logger.warning("Database has 0 users, auto-running seed...")
            from app.seed import seed_database
            seed_database()
        else:
            logger.info(f"Database ready with {count} registered users.")
    except Exception as e:
        logger.error(f"Error ensuring database ready: {e}", exc_info=True)
