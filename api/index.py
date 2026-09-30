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

try:
    from mangum import Mangum
    handler = Mangum(app, lifespan="off")
except Exception:
    handler = app
