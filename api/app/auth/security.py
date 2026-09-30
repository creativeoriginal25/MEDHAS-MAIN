"""PIN hashing with bcrypt — adapted from APY auth.py."""

import bcrypt


def hash_pin(pin: str) -> str:
    """Hash a PIN using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pin.encode("utf-8"), salt).decode("utf-8")


def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    """Verify a plain PIN against a bcrypt hash."""
    if not hashed_pin:
        return False
    try:
        return bcrypt.checkpw(plain_pin.encode("utf-8"), hashed_pin.encode("utf-8"))
    except Exception:
        return False
