"""
Vercel Python Serverless Runtime Entrypoint for MEDHAS Unified Platform.
Exports standard ASGI `app` instance for Vercel's native Python runtime.
"""

import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")

for p in [CURRENT_DIR, BACKEND_DIR, ROOT_DIR, "/var/task", "/var/task/api", "/var/task/backend"]:
    if os.path.exists(p) and p not in sys.path:
        sys.path.insert(0, p)

os.environ.setdefault("VERCEL", "1")

from app.main import app
from app.database import ensure_database_ready

try:
    ensure_database_ready()
except Exception as e:
    import logging
    logging.getLogger("api").warning(f"Database readiness notice: {e}")
