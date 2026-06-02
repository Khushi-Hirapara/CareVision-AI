"""User persistence and authentication."""

from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import UserCreate

DEMO_USER_EMAIL = "demo@carevision.local"
DEMO_USER_NAME = "Demo User"


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not verify_password(password, user.hashed_password):
        return None
    return user


def get_or_create_default_user(db: Session) -> User:
    """Return the shared demo user for local DB initialization scripts."""
    user = get_user_by_email(db, DEMO_USER_EMAIL)
    if user is not None:
        return user

    user = User(
        name=DEMO_USER_NAME,
        email=DEMO_USER_EMAIL,
        hashed_password=get_password_hash("demo-password-not-for-production"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
