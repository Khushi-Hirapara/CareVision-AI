import logging
from urllib.parse import urlencode

from authlib.integrations.base_client.errors import OAuthError
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings, settings
from app.core.deps import get_current_user
from app.core.oauth import get_oauth_client
from app.core.security import create_access_token
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    ForgotPasswordRequest,
    LoginRequest,
    LogoutRequest,
    MessageResponse,
    RefreshTokenRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    SsoExchangeRequest,
    SsoProvidersResponse,
    Token,
    VerifyEmailRequest,
)
from app.schemas.user import UserResponse
from app.services.auth_tokens import (
    build_reset_password_url,
    build_verify_email_url,
    issue_email_verification_token,
    issue_password_reset_token,
    issue_refresh_token,
    logout_with_refresh_token,
    reset_password_with_token,
    rotate_refresh_token,
    verify_email_with_token,
)
from app.services.email import send_password_reset_email, send_verification_email
from app.services.sso import (
    consume_sso_exchange_code,
    get_or_create_sso_user,
    issue_sso_exchange_code,
)
from app.services.user import authenticate_user, create_doctor_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def _token_response(db: Session, user: User) -> Token:
    access_token = create_access_token(subject=user.id)
    refresh_token = issue_refresh_token(db, user)
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


def _send_verification_for_user(db: Session, user: User) -> None:
    raw = issue_email_verification_token(db, user)
    send_verification_email(
        settings,
        to_email=user.email,
        name=user.name,
        verify_url=build_verify_email_url(settings, raw),
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Register a new doctor account (public signup never creates patients)."""
    if get_user_by_email(db, body.email) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = create_doctor_user(
        db,
        name=body.name,
        email=str(body.email),
        password=body.password,
    )
    _send_verification_for_user(db, user)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Authenticate with email and password; returns access and refresh tokens."""
    user = authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _token_response(db, user)


@router.get("/me", response_model=UserResponse)
def read_current_user(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the authenticated user's profile."""
    return UserResponse.model_validate(current_user)


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(
    body: VerifyEmailRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Confirm a user's email address using the token from their inbox."""
    try:
        verify_email_with_token(db, body.token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return MessageResponse(message="Email verified successfully.")


@router.post("/resend-verification", response_model=MessageResponse)
def resend_verification(
    body: ResendVerificationRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Resend the email verification link if the account is still unverified."""
    # Always return the same message to avoid email enumeration.
    generic = MessageResponse(
        message="If an account exists for that email, a verification link has been sent.",
    )
    user = get_user_by_email(db, str(body.email))
    if user is None or user.email_verified_at is not None:
        return generic

    _send_verification_for_user(db, user)
    return generic


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    body: ForgotPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Send a password reset link when the email matches an account."""
    generic = MessageResponse(
        message="If an account exists for that email, a reset link has been sent.",
    )
    user = get_user_by_email(db, str(body.email))
    if user is None:
        return generic

    raw = issue_password_reset_token(db, user)
    send_password_reset_email(
        settings,
        to_email=user.email,
        name=user.name,
        reset_url=build_reset_password_url(settings, raw),
    )
    return generic


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    body: ResetPasswordRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Set a new password using a valid reset token."""
    try:
        reset_password_with_token(db, raw_token=body.token, new_password=body.password)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    return MessageResponse(message="Password has been reset. You can sign in now.")


@router.post("/refresh", response_model=Token)
def refresh_tokens(
    body: RefreshTokenRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Exchange a valid refresh token for a new access/refresh pair."""
    try:
        user, new_refresh = rotate_refresh_token(db, body.refresh_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    access_token = create_access_token(subject=user.id)
    return Token(
        access_token=access_token,
        token_type="bearer",
        refresh_token=new_refresh,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    body: LogoutRequest,
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Revoke the provided refresh token (access tokens expire naturally)."""
    logout_with_refresh_token(db, body.refresh_token)
    return MessageResponse(message="Logged out.")


def _safe_next_path(value: str | None) -> str | None:
    """Return a same-origin relative path, or None when absent/invalid."""
    if value and value.startswith("/") and not value.startswith("//"):
        return value
    return None


def _sso_frontend_redirect(**params: str) -> RedirectResponse:
    cleaned = {key: value for key, value in params.items() if value}
    query = urlencode(cleaned)
    url = f"{settings.frontend_url.rstrip('/')}/auth/callback"
    if query:
        url = f"{url}?{query}"
    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)


def _extract_sso_identity(provider: str, userinfo: dict) -> tuple[str, str, str]:
    """Validate provider claims and return subject, email, display name."""
    subject = str(userinfo.get("sub") or "").strip()
    email = str(userinfo.get("email") or "").strip()
    preferred = str(userinfo.get("preferred_username") or "").strip()
    name = str(userinfo.get("name") or "").strip()

    if not subject:
        raise ValueError("The identity provider did not return a user subject.")

    if provider == "google":
        if userinfo.get("email_verified") is not True:
            raise ValueError("Google did not provide a verified email address.")
        if not email:
            raise ValueError("Google did not provide an email address.")
    elif provider == "microsoft":
        # Prefer the email claim; fall back to preferred_username when it is an email.
        if not email and preferred and "@" in preferred:
            email = preferred
        if not email:
            raise ValueError("Microsoft did not provide an email address.")
        # When Microsoft returns email_verified=false, reject the sign-in.
        if userinfo.get("email_verified") is False:
            raise ValueError("Microsoft did not provide a verified email address.")
    else:
        raise ValueError("Unsupported SSO provider.")

    display_name = name or email.split("@", 1)[0]
    return subject, email, display_name


@router.get("/sso/providers", response_model=SsoProvidersResponse)
def list_sso_providers() -> SsoProvidersResponse:
    """Public flags for which SSO providers are configured."""
    current = get_settings()
    return SsoProvidersResponse(
        google=current.google_sso_configured,
        microsoft=current.microsoft_sso_configured,
    )


@router.get("/sso/{provider}/login")
async def sso_login(
    provider: str,
    request: Request,
    next_path: str | None = Query(default=None, alias="next"),
) -> RedirectResponse:
    """Redirect the browser to Google or Microsoft for authentication."""
    client = get_oauth_client(provider)
    if client is None:
        if provider not in {"google", "microsoft"}:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unsupported SSO provider.",
            )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{provider.title()} SSO is not configured.",
        )

    safe_next = _safe_next_path(next_path)
    if safe_next:
        request.session["sso_next"] = safe_next
    else:
        request.session.pop("sso_next", None)

    redirect_uri = get_settings().sso_redirect_uri(provider)
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/sso/{provider}/callback")
async def sso_callback(
    provider: str,
    request: Request,
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """Validate the provider callback and issue a one-time frontend exchange code."""
    client = get_oauth_client(provider)
    if client is None:
        return _sso_frontend_redirect(error="Unsupported or unconfigured SSO provider.")

    try:
        token = await client.authorize_access_token(request)
        userinfo = token.get("userinfo")
        if not userinfo:
            userinfo = await client.userinfo(token=token)
        if not isinstance(userinfo, dict):
            raise ValueError("The identity provider returned an invalid profile.")

        subject, email, name = _extract_sso_identity(provider, userinfo)
        user = get_or_create_sso_user(
            db,
            provider=provider,
            subject=subject,
            email=email,
            name=name,
        )
        code = issue_sso_exchange_code(db, user)
    except (OAuthError, ValueError, KeyError) as exc:
        db.rollback()
        return _sso_frontend_redirect(error=str(exc) or "SSO sign-in failed.")
    except Exception:
        db.rollback()
        logger.exception("Unexpected %s SSO callback failure", provider)
        return _sso_frontend_redirect(error="SSO sign-in failed. Please try again.")

    next_path = _safe_next_path(request.session.pop("sso_next", None))
    if next_path:
        return _sso_frontend_redirect(code=code, next=next_path)
    return _sso_frontend_redirect(code=code)


@router.post("/sso/exchange", response_model=Token)
def exchange_sso_code(
    body: SsoExchangeRequest,
    db: Session = Depends(get_db),
) -> Token:
    """Exchange a short-lived, single-use SSO code for app session tokens."""
    try:
        user = consume_sso_exchange_code(db, body.code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
        ) from exc
    return _token_response(db, user)
