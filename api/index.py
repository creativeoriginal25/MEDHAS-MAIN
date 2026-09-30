"""
Vercel Python Serverless Runtime Entrypoint for MEDHAS Unified Platform.
Connects FastAPI ASGI application with Mangum.
"""

import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for p in [CURRENT_DIR, ROOT_DIR, BACKEND_DIR]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

# Set environment marker for serverless
os.environ.setdefault("VERCEL", "1")

from app.main import app
from app.database import ensure_database_ready

# Ensure database is ready with tables and student accounts immediately on lambda init
try:
    ensure_database_ready()
except Exception as e:
    import logging
    logging.getLogger("api").error(f"Error ensuring database ready on lambda start: {e}")

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except Exception:
    handler = app
