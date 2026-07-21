"""Google and Microsoft OpenID Connect account linking."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.roles import DOCTOR
from app.core.security import get_password_hash
from app.models.auth_token import PURPOSE_SSO_EXCHANGE
from app.models.user import User
from app.services.auth_tokens import (
    create_auth_token,
    get_valid_auth_token,
    mark_token_used,
)

SUPPORTED_SSO_PROVIDERS = {"google", "microsoft"}


def _subject_column(provider: str):
    if provider == "google":
        return User.google_subject
    if provider == "microsoft":
        return User.microsoft_subject
    raise ValueError("Unsupported SSO provider.")


def get_or_create_sso_user(
    db: Session,
    *,
    provider: str,
    subject: str,
    email: str,
    name: str,
) -> User:
    """Find an SSO identity, link a matching account, or create a doctor account."""
    if provider not in SUPPORTED_SSO_PROVIDERS:
        raise ValueError("Unsupported SSO provider.")

    normalized_email = email.strip().lower()
    normalized_subject = subject.strip()
    if not normalized_email or not normalized_subject:
        raise ValueError("The identity provider did not return the required account details.")

    subject_column = _subject_column(provider)
    user = db.query(User).filter(subject_column == normalized_subject).first()
    if user is not None:
        return user

    user = (
        db.query(User)
        .filter(func.lower(User.email) == normalized_email)
        .first()
    )
    if user is None:
        user = User(
            name=name.strip() or normalized_email.split("@", 1)[0],
            email=normalized_email,
            hashed_password=get_password_hash(secrets.token_urlsafe(48)),
            role=DOCTOR,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)

    existing_subject = getattr(user, f"{provider}_subject")
    if existing_subject and existing_subject != normalized_subject:
        raise ValueError(
            f"This email is already linked to a different {provider.title()} account.",
        )

    setattr(user, f"{provider}_subject", normalized_subject)
    if user.email_verified_at is None:
        user.email_verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user


def issue_sso_exchange_code(db: Session, user: User) -> str:
    raw, _ = create_auth_token(
        db,
        user_id=user.id,
        purpose=PURPOSE_SSO_EXCHANGE,
        expires_delta=timedelta(minutes=2),
    )
    return raw


def consume_sso_exchange_code(db: Session, raw_code: str) -> User:
    row = get_valid_auth_token(
        db,
        raw_token=raw_code,
        purpose=PURPOSE_SSO_EXCHANGE,
    )
    if row is None:
        raise ValueError("Invalid or expired SSO exchange code.")

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise ValueError("Invalid or expired SSO exchange code.")

    mark_token_used(db, row)
    return user
