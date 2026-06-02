"""User helpers for demo / single-tenant scan history."""

from sqlalchemy.orm import Session

from app.models.user import User

DEMO_USER_EMAIL = "demo@carevision.local"
DEMO_USER_NAME = "Demo User"


def get_or_create_default_user(db: Session) -> User:
    """Return the shared demo user used when auth is not implemented yet."""
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if user is not None:
        return user

    user = User(
        name=DEMO_USER_NAME,
        email=DEMO_USER_EMAIL,
        hashed_password="not-used",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
