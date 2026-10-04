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


def get_database_url() -> tuple[str, dict]:
    """Determine the active database URL."""
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

    if IS_VERCEL:
        if turso_url:
            try:
                import sqlalchemy_libsql  # noqa: F401 - ensure dialect registered
                clean_url = turso_url
                if clean_url.startswith("libsql://"):
                    clean_url = clean_url[len("libsql://") :]
                elif clean_url.startswith("https://"):
                    clean_url = clean_url[len("https://") :]
                clean_url = clean_url.rstrip("/")

                query_params = ["secure=true"]
                if turso_token:
                    query_params.append(f"authToken={turso_token}")

                url = f"sqlite+libsql://{clean_url}/?{'&'.join(query_params)}"
                logger.info(f"Vercel serverless: using persistent Turso Cloud database at {clean_url}")
                return url, {"check_same_thread": False}
            except Exception as e:
                logger.warning(f"Turso dialect initialization error, falling back to /tmp/app.db: {e}")

        tmp_dir = tempfile.gettempdir()
        os.makedirs(tmp_dir, exist_ok=True)
        tmp_db = os.path.join(tmp_dir, "app.db")
        _ensure_tmp_db(tmp_db)
        url = f"sqlite:///{Path(tmp_db).as_posix()}"
        logger.info(f"Vercel serverless: using fallback SQLite at {tmp_db}")
        return url, {"check_same_thread": False}

    url = settings.database_url
    if url.startswith("sqlite:///") and ":memory:" not in url:
        db_path_str = url.replace("sqlite:///", "", 1)
        if not os.path.isabs(db_path_str):
            backend_dir = Path(__file__).resolve().parent.parent
            resolved_db = (backend_dir / db_path_str.lstrip(".\\/")).resolve()
            url = f"sqlite:///{resolved_db.as_posix()}"
    logger.info(f"Using local SQLite: {url}")
    return url, {"check_same_thread": False}


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
