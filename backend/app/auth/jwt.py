"""JWT token creation and verification — adapted from APY auth.py."""

import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError

from app.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(seconds=settings.jwt_expire_seconds)
    )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Decode and validate a JWT access token. Raises JWTError on failure."""
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def hash_token(token: str) -> str:
    """SHA-256 hash of a token for secure storage and lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
