"""OpenID Connect clients for Google and Microsoft."""

from authlib.integrations.starlette_client import OAuth

from app.core.config import settings

oauth = OAuth()

if settings.google_client_id and settings.google_client_secret:
    oauth.register(
        name="google",
        client_id=settings.google_client_id,
        client_secret=settings.google_client_secret,
        server_metadata_url=(
            "https://accounts.google.com/.well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
    )

if settings.microsoft_client_id and settings.microsoft_client_secret:
    tenant = settings.microsoft_tenant.strip() or "common"
    oauth.register(
        name="microsoft",
        client_id=settings.microsoft_client_id,
        client_secret=settings.microsoft_client_secret,
        server_metadata_url=(
            f"https://login.microsoftonline.com/{tenant}/v2.0/"
            ".well-known/openid-configuration"
        ),
        client_kwargs={"scope": "openid email profile"},
    )


def get_oauth_client(provider: str):
    if provider not in {"google", "microsoft"}:
        return None
    return oauth.create_client(provider)
