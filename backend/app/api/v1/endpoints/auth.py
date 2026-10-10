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
    Register a new user account with strict role-based access control:
    - Initial Bootstrap: If 0 users exist in the system, allow first-time admin bootstrap.
    - Public Registration: Unauthenticated users may ONLY self-register as BUYER (customer portal).
    - Internal Roles: Assigning privileged roles (OWNER, MANAGER, PRODUCTION, QUALITY, INVENTORY, DISPATCH, FINANCE)
      strictly requires an active authenticated OWNER or MANAGER session.
    - Privilege Escalation Guard: MANAGERs cannot create OWNER accounts.
    """
    total_users = db.query(User).count()
    
    # 1. Allow initial system bootstrap if no users exist
    if total_users == 0:
        return create_user(db, user_in)

    # 2. If unauthenticated, only BUYER self-registration is permitted
    if not credentials or not credentials.credentials:
        if user_in.role != UserRole.BUYER:
            raise UnauthorizedAccessException(
                f"Unauthorized role assignment. Internal roles ({user_in.role.value}) can only be created by an authenticated Owner or Manager."
            )
        return create_user(db, user_in)

    # 3. Authenticated registration: Validate token and caller privileges
    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise UnauthenticatedException("Invalid or expired session credentials.")
    
    caller = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not caller or not caller.is_active:
        raise UnauthorizedAccessException("Inactive or non-existent caller account.")

    # Only OWNER and MANAGER can create internal roles
    if caller.role not in (UserRole.OWNER, UserRole.MANAGER):
        if user_in.role != UserRole.BUYER:
            raise UnauthorizedAccessException(
                "Administrative privileges (Owner or Manager) required to register internal staff accounts."
            )

    # Privilege escalation guard: Managers cannot create Owners
    if caller.role == UserRole.MANAGER and user_in.role == UserRole.OWNER:
        raise UnauthorizedAccessException("Plant Managers cannot create accounts with Owner privileges.")

    return create_user(db, user_in)


@router.post("/logout", summary="Logout user")
def logout(current_user: User = Depends(get_current_active_user)):
    """Client-side token invalidation confirmation."""
    return {"message": f"User {current_user.email} successfully logged out."}
