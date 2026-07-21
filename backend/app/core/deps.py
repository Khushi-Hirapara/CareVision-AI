"""FastAPI dependencies for authentication and role-based access."""

from collections.abc import Callable

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.roles import DOCTOR, PATIENT
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User
from app.services.user import get_user_by_id

def _extract_bearer_token(authorization: str | None) -> str:
    """Validate the Authorization header and return the raw token."""
    missing_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not authorization:
        raise missing_exception

    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1].strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return parts[1].strip()


async def get_current_user(
    authorization: str = Header(
        ...,
        alias="Authorization",
        description="Bearer access token. Enter `Bearer <access_token>`.",
    ),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_bearer_token(authorization)

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    subject = payload.get("sub")
    if subject is None:
        raise credentials_exception

    try:
        user_id = int(subject)
    except (TypeError, ValueError) as exc:
        raise credentials_exception from exc

    user = get_user_by_id(db, user_id)
    if user is None:
        raise credentials_exception

    return user


def require_role(required_role: str) -> Callable[..., User]:
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This action requires the {required_role} role.",
            )
        return current_user

    return role_checker


async def require_doctor(
    current_user: User = Depends(require_role(DOCTOR)),
) -> User:
    return current_user


async def require_patient(
    current_user: User = Depends(require_role(PATIENT)),
) -> User:
    return current_user
