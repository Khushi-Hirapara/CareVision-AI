"""HTTP error detail helpers for API responses."""

from app.core.config import Settings


def error_detail(settings: Settings, exc: BaseException, *, context: str | None = None) -> str:
    """Build exception detail for HTTPException (exact message when debug is on)."""
    message = f"{type(exc).__name__}: {exc}" if settings.debug else str(exc)
    if context:
        return f"{context}: {message}"
    return message
