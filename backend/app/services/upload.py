import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status

from app.core.config import PROJECT_ROOT, Settings

ALLOWED_CONTENT_TYPES = frozenset(
    {"image/jpeg", "image/jpg", "image/png", "image/pjpeg", "image/x-png"}
)


def _extension_for(filename: str | None, content_type: str | None) -> str:
    if filename and "." in filename:
        ext = Path(filename).suffix.lower()
        if ext in {".jpg", ".jpeg", ".png"}:
            return ext
    if content_type in {"image/jpeg", "image/jpg", "image/pjpeg"}:
        return ".jpg"
    if content_type in {"image/png", "image/x-png"}:
        return ".png"
    return ""


def to_storage_path(path: Path) -> str:
    try:
        return path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


async def save_xray_upload(file: UploadFile, settings: Settings) -> Path:
    """Validate and persist an uploaded chest X-ray under the configured upload directory."""
    if not file.filename and not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided.",
        )

    ext = _extension_for(file.filename, file.content_type)
    allowed_normalized: set[str] = set()
    for item in settings.allowed_extensions_list:
        normalized = item if item.startswith(".") else f".{item.lower()}"
        allowed_normalized.add(normalized)
        if normalized in {".jpg", ".jpeg"}:
            allowed_normalized.update({".jpg", ".jpeg"})

    if ext not in allowed_normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions_list)}.",
        )

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid content type. Upload a PNG or JPEG chest X-ray.",
        )

    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    upload_dir = settings.upload_path
    upload_dir.mkdir(parents=True, exist_ok=True)

    stored_name = f"{uuid.uuid4().hex}{ext}"
    destination = upload_dir / stored_name

    size = 0
    try:
        with destination.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > max_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum size of {settings.max_upload_size_mb} MB.",
                    )
                out.write(chunk)
    except HTTPException:
        destination.unlink(missing_ok=True)
        raise
    except OSError as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded image.",
        ) from exc
    finally:
        await file.close()

    if size == 0:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    return destination
