from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.user import UserLogin, Token, UserRead, UserCreate
from app.services.auth_service import authenticate_user, create_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token, summary="User login & JWT token generation")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT access token with role claims."""
    return authenticate_user(db, login_data)


@router.get("/me", response_model=UserRead, summary="Get current logged-in user profile")
def get_me(current_user: User = Depends(get_current_active_user)):
    """Retrieve details and role permissions of the currently authenticated user."""
    return current_user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, summary="Register user account")
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account (Admin / Setup)."""
    return create_user(db, user_in)


@router.post("/logout", summary="Logout user")
def logout(current_user: User = Depends(get_current_active_user)):
    """Client-side token invalidation confirmation."""
    return {"message": f"User {current_user.email} successfully logged out."}
