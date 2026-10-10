from typing import Optional
from sqlalchemy.orm import Session
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.exceptions import ConflictException, NotFoundException, UnauthenticatedException
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin, Token, UserRead


def authenticate_user(db: Session, login_data: UserLogin) -> Token:
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    if not user:
        raise UnauthenticatedException("Invalid email or password.")
    
    if not verify_password(login_data.password, user.password_hash):
        raise UnauthenticatedException("Invalid email or password.")
        
    if not user.is_active:
        raise UnauthenticatedException("User account is inactive. Please contact your administrator.")

    access_token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email,
        customer_id=user.customer_id,
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


def create_user(db: Session, user_in: UserCreate) -> User:
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise ConflictException(f"User with email '{user_in.email}' already exists.")
    
    hashed_password = get_password_hash(user_in.password)
    user = User(
        email=user_in.email.lower(),
        name=user_in.name,
        password_hash=hashed_password,
        role=user_in.role,
        is_active=user_in.is_active,
        customer_id=user_in.customer_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
