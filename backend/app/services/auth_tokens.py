"""Auth token issuance, verification, and session helpers."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import Settings, settings
from app.core.security import get_password_hash
from app.models.auth_token import (
    PURPOSE_EMAIL_VERIFICATION,
    PURPOSE_PASSWORD_RESET,
    PURPOSE_REFRESH,
    AuthToken,
)
from app.models.user import User


def hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def create_auth_token(
    db: Session,
    *,
    user_id: int,
    purpose: str,
    expires_delta: timedelta,
    revoke_existing: bool = True,
) -> tuple[str, AuthToken]:
    """Create a one-time or refresh token. Returns (raw_token, row)."""
    now = _utcnow()
    if revoke_existing:
        existing = (
            db.query(AuthToken)
            .filter(
                AuthToken.user_id == user_id,
                AuthToken.purpose == purpose,
                AuthToken.used_at.is_(None),
                AuthToken.revoked_at.is_(None),
            )
            .all()
        )
        for row in existing:
            row.revoked_at = now

    raw = secrets.token_urlsafe(32)
    row = AuthToken(
        user_id=user_id,
        token_hash=hash_token(raw),
        purpose=purpose,
        expires_at=now + expires_delta,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return raw, row


def get_valid_auth_token(
    db: Session,
    *,
    raw_token: str,
    purpose: str,
) -> AuthToken | None:
    row = (
        db.query(AuthToken)
        .filter(
            AuthToken.token_hash == hash_token(raw_token.strip()),
            AuthToken.purpose == purpose,
        )
        .first()
    )
    if row is None:
        return None
    if row.used_at is not None or row.revoked_at is not None:
        return None
    if row.expires_at <= _utcnow():
        return None
    return row


def mark_token_used(db: Session, row: AuthToken) -> None:
    row.used_at = _utcnow()
    db.add(row)
    db.commit()


def revoke_token(db: Session, row: AuthToken) -> None:
    row.revoked_at = _utcnow()
    db.add(row)
    db.commit()


def revoke_user_refresh_tokens(db: Session, user_id: int) -> None:
    now = _utcnow()
    rows = (
        db.query(AuthToken)
        .filter(
            AuthToken.user_id == user_id,
            AuthToken.purpose == PURPOSE_REFRESH,
            AuthToken.used_at.is_(None),
            AuthToken.revoked_at.is_(None),
        )
        .all()
    )
    for row in rows:
        row.revoked_at = now
    if rows:
        db.commit()


def issue_email_verification_token(db: Session, user: User) -> str:
    raw, _ = create_auth_token(
        db,
        user_id=user.id,
        purpose=PURPOSE_EMAIL_VERIFICATION,
        expires_delta=timedelta(hours=settings.email_verification_expire_hours),
    )
    return raw


def issue_password_reset_token(db: Session, user: User) -> str:
    raw, _ = create_auth_token(
        db,
        user_id=user.id,
        purpose=PURPOSE_PASSWORD_RESET,
        expires_delta=timedelta(hours=settings.password_reset_expire_hours),
    )
    return raw


def issue_refresh_token(db: Session, user: User) -> str:
    raw, _ = create_auth_token(
        db,
        user_id=user.id,
        purpose=PURPOSE_REFRESH,
        expires_delta=timedelta(days=settings.refresh_token_expire_days),
        revoke_existing=False,
    )
    return raw


def verify_email_with_token(db: Session, raw_token: str) -> User:
    row = get_valid_auth_token(
        db,
        raw_token=raw_token,
        purpose=PURPOSE_EMAIL_VERIFICATION,
    )
    if row is None:
        raise ValueError("Invalid or expired verification token.")

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise ValueError("Invalid or expired verification token.")

    user.email_verified_at = _utcnow()
    mark_token_used(db, row)
    db.refresh(user)
    return user


def reset_password_with_token(db: Session, *, raw_token: str, new_password: str) -> User:
    row = get_valid_auth_token(
        db,
        raw_token=raw_token,
        purpose=PURPOSE_PASSWORD_RESET,
    )
    if row is None:
        raise ValueError("Invalid or expired reset token.")

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise ValueError("Invalid or expired reset token.")

    user.hashed_password = get_password_hash(new_password)
    mark_token_used(db, row)
    revoke_user_refresh_tokens(db, user.id)
    db.refresh(user)
    return user


def rotate_refresh_token(db: Session, raw_refresh_token: str) -> tuple[User, str]:
    row = get_valid_auth_token(
        db,
        raw_token=raw_refresh_token,
        purpose=PURPOSE_REFRESH,
    )
    if row is None:
        raise ValueError("Invalid or expired refresh token.")

    user = db.query(User).filter(User.id == row.user_id).first()
    if user is None:
        raise ValueError("Invalid or expired refresh token.")

    revoke_token(db, row)
    new_refresh = issue_refresh_token(db, user)
    return user, new_refresh


def logout_with_refresh_token(db: Session, raw_refresh_token: str | None) -> None:
    if not raw_refresh_token:
        return
    row = get_valid_auth_token(
        db,
        raw_token=raw_refresh_token,
        purpose=PURPOSE_REFRESH,
    )
    if row is not None:
        revoke_token(db, row)


def build_verify_email_url(app_settings: Settings, token: str) -> str:
    base = app_settings.frontend_url.rstrip("/")
    return f"{base}/verify-email?token={token}"


def build_reset_password_url(app_settings: Settings, token: str) -> str:
    base = app_settings.frontend_url.rstrip("/")
    return f"{base}/reset-password?token={token}"
