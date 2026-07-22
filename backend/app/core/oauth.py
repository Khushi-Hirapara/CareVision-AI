"""OpenID Connect clients for Google and Microsoft.

Clients are registered lazily from current settings so updating
GOOGLE_*/MICROSOFT_* in `.env` and restarting (or calling after
settings reload) enables SSO without an import-order race.
"""

from __future__ import annotations

import logging
from threading import Lock

from authlib.integrations.starlette_client import OAuth

from app.core.config import get_settings

logger = logging.getLogger(__name__)

oauth = OAuth()
_registered: set[str] = set()
_lock = Lock()


def _register_google() -> None:
    settings = get_settings()
    if not settings.google_sso_configured:
        return
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url=(
            "https://accounts.google.com/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
        overwrite=True,
    )
    _registered.add("google")
    logger.info("Registered Google OIDC client")


def _register_microsoft() -> None:
    settings = get_settings()
    if not settings.microsoft_sso_configured:
        return
    tenant = (settings.microsoft_tenant or "common").strip() or "common"
    oauth.register(
        name="microsoft",
        client_id=settings.microsoft_client_id,
        client_secret=settings.microsoft_client_secret,
        server_metadata_url=(
            f"https://login.microsoftonline.com/{tenant}/v2.0/"
            ".well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
        overwrite=True,
    )
    _registered.add("microsoft")
    logger.info("Registered Microsoft OIDC client")


def ensure_oauth_clients() -> None:
    """Register any configured providers that are not yet active."""
    settings = get_settings()
    with _lock:
        if settings.google_sso_configured and "google" not in _registered:
            _register_google()
        if settings.microsoft_sso_configured and "microsoft" not in _registered:
            _register_microsoft()


def get_oauth_client(provider: str):
    if provider not in {"google", "microsoft"}:
        return None

    settings = get_settings()
    if provider == "google" and not settings.google_sso_configured:
        return None
    if provider == "microsoft" and not settings.microsoft_sso_configured:
        return None

    ensure_oauth_clients()
    return oauth.create_client(provider)
