from typing import Optional
from fastapi import APIRouter, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.core.security import decode_token
from app.core.exceptions import UnauthorizedAccessException, UnauthenticatedException
from app.models.user import User, UserRole
from app.schemas.user import UserLogin, Token, UserRead, UserCreate
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/auth", tags=["Authentication"])
auth_scheme = HTTPBearer(auto_error=False)


@router.post("/login", response_model=Token, summary="User login & JWT token generation")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token with role claims."""
    return authenticate_user(db, login_data)


@router.get("/me", response_model=UserRead, summary="Get current logged-in user profile")
def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve details and role permissions of the currently authenticated user."""
    return current_user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register user account")
def register_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(auth_scheme),
):
    """
    Register a new user account.
    - If 0 users exist in the system, allow first-time initial bootstrap.
    - Otherwise, strictly requires an authenticated Owner or Manager.
    - Managers cannot create Owner accounts.
    """
    total_users = db.query(User).count()
    if total_users > 0:
        if not credentials or not credentials.credentials:
            raise UnauthenticatedException("Authentication required to create user accounts.")
        payload = decode_token(credentials.credentials)
        if not payload or not payload.get("sub"):
            raise UnauthenticatedException("Invalid or expired session credentials.")
        caller = db.query(User).filter(User.id == int(payload["sub"])).first()
        if not caller or not caller.is_active:
            raise UnauthorizedAccessException("Inactive or non-existent caller account.")
        if caller.role not in (UserRole.OWNER, UserRole.MANAGER):
            raise UnauthorizedAccessException("Administrative privileges required to register users.")
        if caller.role == UserRole.MANAGER and user_in.role == UserRole.OWNER:
            raise UnauthorizedAccessException("Managers cannot grant Owner privileges.")

    return create_user(db, user_in)


@router.post("/logout", summary="Logout user")
def logout(current_user: User = Depends(get_current_active_user)):
    """Client-side token invalidation confirmation."""
    return {"message": f"User {current_user.email} successfully logged out."}
