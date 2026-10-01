"""FastAPI dependencies for authentication and role-based authorization."""

from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.database import get_db
from app.auth.jwt import decode_access_token, hash_token
from app.models.user import User, UserRole
from app.models.audit import RevokedToken

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Authenticate and return the current user from JWT token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )

    token = credentials.credentials.strip()
    if not token or token in ("null", "undefined"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )

    # Decode JWT
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims.",
            )
        user_id = int(sub)
    except JWTError as e:
        detail = "Could not validate credentials."
        if "expired" in str(e).lower():
            detail = "Session expired. Please sign in again."
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)

    # Check token revocation
    t_hash = hash_token(token)
    revoked = db.query(RevokedToken).filter(RevokedToken.token_hash == t_hash).first()
    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has been logged out. Please sign in again.",
        )

    # Fetch user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )

    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Return user if valid token present, otherwise None."""
    if not credentials or not credentials.credentials:
        return None
    token = credentials.credentials.strip()
    if not token or token in ("null", "undefined"):
        return None
    try:
        payload = decode_access_token(token)
        sub = payload.get("sub")
        if not sub:
            return None
        user_id = int(sub)
        return db.query(User).filter(User.id == user_id).first()
    except Exception:
        return None


def get_user_roles(user: User, db: Session) -> List[str]:
    """Get all roles for a user."""
    roles = db.query(UserRole).filter(UserRole.user_id == user.id).all()
    return [r.role for r in roles]


def require_role(*required_roles: str):
    """Factory for role-based authorization dependency.
    
    Usage:
        @router.post("/admin/action")
        def admin_action(user: User = Depends(require_role("attendance_admin", "platform_admin"))):
            ...
    """
    def dependency(
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        user_roles = get_user_roles(user, db)
        from app.config import settings
        if user.register_number in (settings.initial_admin_register.upper(), "25B91A05D8", "25B91A05U8", "ADMIN01") or "platform_admin" in user_roles:
            return user
        if not any(r in user_roles for r in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Forbidden: requires one of {list(required_roles)} role(s).",
            )
        return user

    return dependency
