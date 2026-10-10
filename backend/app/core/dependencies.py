import secrets
from typing import List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import (
    UnauthenticatedException,
    UnauthorizedAccessException,
    NotFoundException,
)
from app.db.session import get_db
from app.models.user import User, UserRole

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate JWT token and return the current user. Strictly enforces auth across all environments."""
    if not credentials or not credentials.credentials:
        raise UnauthenticatedException("Bearer token required")
    
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise UnauthenticatedException("Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthenticatedException("Token payload missing user identifier")
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise UnauthenticatedException("User no longer exists")
    
    if not user.is_active:
        raise UnauthorizedAccessException("User account is disabled")
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    return current_user


def require_roles(allowed_roles: List[UserRole]):
    """Role-based authorization dependency factory."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role == UserRole.OWNER:
            return current_user # Owner has full access across all modules
        if current_user.role not in allowed_roles:
            raise UnauthorizedAccessException(
                f"Role '{current_user.role.value}' does not have permission to perform this action. Required: {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


def verify_buyer_order_access(current_user: User, order_customer_id: int):
    """Enforce strict multi-tenant buyer isolation."""
    if current_user.role == UserRole.BUYER:
        if not current_user.customer_id or current_user.customer_id != order_customer_id:
            raise UnauthorizedAccessException("You are not authorized to view orders belonging to another buyer.")


def verify_simulator_secret(
    x_simulator_secret: Optional[str] = Header(None, alias="X-Simulator-Secret"),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> bool:
    """
    Verify simulator access via constant-time shared secret comparison or authorized operator Bearer token.
    Fails closed if secret is unconfigured or mismatched. Never bypasses auth via DEBUG mode.
    """
    # 1. Verify shared secret via constant-time comparison
    configured_secret = getattr(settings, "SIMULATOR_SHARED_SECRET", None)
    if x_simulator_secret:
        if not configured_secret or len(configured_secret) < 16:
            raise UnauthenticatedException("Simulator service is unconfigured or disabled")
        if secrets.compare_digest(x_simulator_secret, configured_secret):
            return True
        raise UnauthenticatedException("Invalid simulator secret")
    
    # 2. Or verify valid authenticated internal operator token
    if credentials and credentials.credentials:
        payload = decode_token(credentials.credentials)
        if payload and payload.get("sub"):
            user = db.query(User).filter(User.id == int(payload["sub"])).first()
            if user and user.is_active and user.role in [UserRole.OWNER, UserRole.MANAGER, UserRole.PRODUCTION]:
                return True
            raise UnauthorizedAccessException("Token does not have simulator ingest permissions")

    raise UnauthenticatedException("Valid X-Simulator-Secret header or authorized Bearer token is required")
