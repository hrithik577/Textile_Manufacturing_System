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
    """Validate JWT token and return the current user."""
    if not credentials or not credentials.credentials:
        if settings.ENVIRONMENT == "development":
            owner = db.query(User).filter(User.role == UserRole.OWNER).first()
            if owner:
                return owner
        raise UnauthenticatedException("Bearer token required")
    
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        if settings.ENVIRONMENT == "development":
            owner = db.query(User).filter(User.role == UserRole.OWNER).first()
            if owner:
                return owner
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
    """Verify simulator access via either shared secret header or valid JWT token."""
    if x_simulator_secret and x_simulator_secret == settings.SIMULATOR_SHARED_SECRET:
        return True
    
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload:
            return True
            
    # For local hackathon convenience if debug is active, accept requests with warning
    if settings.DEBUG:
        return True

    raise UnauthenticatedException("Valid X-Simulator-Secret header or Bearer token is required")
