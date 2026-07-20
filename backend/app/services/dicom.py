"""DICOM ingest: metadata extraction and PNG conversion for ML / UI."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import HTTPException, status
from PIL import Image

logger = logging.getLogger(__name__)

DICOM_EXTENSIONS = frozenset({".dcm", ".dicom"})
DICOM_CONTENT_TYPES = frozenset(
    {
        "application/dicom",
        "application/dicom+json",
        "application/octet-stream",
    }
)


@dataclass(frozen=True)
class DicomConversionResult:
    """PNG ready for inference plus preserved original path and study metadata."""

    png_path: Path
    original_path: Path
    metadata: dict[str, Any]


def is_dicom_path(path: Path) -> bool:
    return path.suffix.lower() in DICOM_EXTENSIONS


def is_dicom_upload(filename: str | None, content_type: str | None) -> bool:
    ext = Path(filename or "").suffix.lower()
    if ext in DICOM_EXTENSIONS:
        return True
    if content_type and content_type.lower() in {"application/dicom", "application/dicom+json"}:
        return True
    return False


def _tag_value(ds: Any, keyword: str) -> str | int | float | None:
    if not hasattr(ds, keyword):
        return None
    value = getattr(ds, keyword)
    if value is None:
        return None
    # PersonName and multi-value elements
    text = str(value).strip()
    if not text or text.lower() == "none":
        return None
    return text


def extract_dicom_metadata(ds: Any) -> dict[str, Any]:
    """Pull common clinical DICOM tags for hospital-compatible study records."""
    rows = _tag_value(ds, "Rows")
    cols = _tag_value(ds, "Columns")
    try:
        rows_i = int(rows) if rows is not None else None
    except (TypeError, ValueError):
        rows_i = None
    try:
        cols_i = int(cols) if cols is not None else None
    except (TypeError, ValueError):
        cols_i = None

    return {
        "patient_name": _tag_value(ds, "PatientName"),
        "patient_id": _tag_value(ds, "PatientID"),
        "patient_sex": _tag_value(ds, "PatientSex"),
        "patient_age": _tag_value(ds, "PatientAge"),
        "study_date": _tag_value(ds, "StudyDate"),
        "study_time": _tag_value(ds, "StudyTime"),
        "study_description": _tag_value(ds, "StudyDescription"),
        "series_description": _tag_value(ds, "SeriesDescription"),
        "modality": _tag_value(ds, "Modality"),
        "body_part_examined": _tag_value(ds, "BodyPartExamined"),
        "institution_name": _tag_value(ds, "InstitutionName"),
        "manufacturer": _tag_value(ds, "Manufacturer"),
        "rows": rows_i,
        "columns": cols_i,
        "photometric_interpretation": _tag_value(ds, "PhotometricInterpretation"),
        "transfer_syntax_uid": str(getattr(getattr(ds, "file_meta", None), "TransferSyntaxUID", "") or "")
        or None,
    }


def _apply_rescale(pixels: np.ndarray, ds: Any) -> np.ndarray:
    slope = float(getattr(ds, "RescaleSlope", 1.0) or 1.0)
    intercept = float(getattr(ds, "RescaleIntercept", 0.0) or 0.0)
    return pixels.astype(np.float32) * slope + intercept


def _apply_window(pixels: np.ndarray, ds: Any) -> np.ndarray:
    center = getattr(ds, "WindowCenter", None)
    width = getattr(ds, "WindowWidth", None)
    if center is None or width is None:
        # Robust fallback for chest X-rays without VOI LUT.
        lo, hi = np.percentile(pixels, (1.0, 99.0))
        if hi <= lo:
            lo, hi = float(pixels.min()), float(pixels.max())
        if hi <= lo:
            return np.zeros_like(pixels, dtype=np.float32)
        return np.clip((pixels - lo) / (hi - lo), 0.0, 1.0)

    if hasattr(center, "__iter__") and not isinstance(center, (str, bytes)):
        center = float(center[0])
    else:
        center = float(center)
    if hasattr(width, "__iter__") and not isinstance(width, (str, bytes)):
        width = float(width[0])
    else:
        width = float(width)

    if width <= 0:
        return np.zeros_like(pixels, dtype=np.float32)

    lo = center - width / 2.0
    hi = center + width / 2.0
    return np.clip((pixels - lo) / (hi - lo), 0.0, 1.0)


def _pixels_to_rgb_uint8(ds: Any) -> np.ndarray:
    pixels = np.asarray(ds.pixel_array)
    if pixels.ndim == 3:
        # Multi-frame: use first frame.
        pixels = pixels[0]
    if pixels.ndim != 2:
        raise ValueError(f"Unsupported DICOM pixel shape: {pixels.shape}")

    pixels = _apply_rescale(pixels, ds)
    photometric = str(getattr(ds, "PhotometricInterpretation", "MONOCHROME2")).upper()
    normalized = _apply_window(pixels, ds)
    if photometric == "MONOCHROME1":
        normalized = 1.0 - normalized

    gray = (normalized * 255.0).astype(np.uint8)
    return np.stack([gray, gray, gray], axis=-1)


def convert_dicom_to_png(dicom_path: Path, output_png: Path | None = None) -> DicomConversionResult:
    """
    Read a DICOM file, preserve the original, and write an 8-bit RGB PNG for inference/UI.
    """
    try:
        import pydicom
        from pydicom.errors import InvalidDicomError
    except ImportError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DICOM support is not installed on the server (pydicom missing).",
        ) from exc

    try:
        ds = pydicom.dcmread(str(dicom_path), force=True)
    except InvalidDicomError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid DICOM file. Please upload a valid .dcm chest X-ray study.",
        ) from exc
    except Exception as exc:
        logger.exception("Failed to read DICOM file %s", dicom_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read DICOM file. The file may be corrupted or unsupported.",
        ) from exc

    if not hasattr(ds, "PixelData") and not hasattr(ds, "FloatPixelData"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="DICOM file has no pixel data (not an image study).",
        )

    try:
        rgb = _pixels_to_rgb_uint8(ds)
    except Exception as exc:
        logger.exception("Failed to decode DICOM pixels for %s", dicom_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Could not decode DICOM pixel data. Compressed transfer syntaxes may "
                "require additional codecs, or the study may be unsupported."
            ),
        ) from exc

    png_path = output_png or dicom_path.with_suffix(".png")
    png_path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgb, mode="RGB").save(png_path, format="PNG", optimize=True)

    metadata = extract_dicom_metadata(ds)
    metadata["source_format"] = "DICOM"
    metadata["converted_png"] = png_path.name

    logger.info(
        "Converted DICOM %s -> %s (modality=%s, size=%sx%s)",
        dicom_path.name,
        png_path.name,
        metadata.get("modality"),
        metadata.get("rows"),
        metadata.get("columns"),
    )

    return DicomConversionResult(
        png_path=png_path,
        original_path=dicom_path,
        metadata=metadata,
    )


def prepare_image_for_inference(image_path: Path) -> tuple[Path, Path | None, dict[str, Any] | None]:
    """
    Return (inference_path, original_dicom_path_or_none, metadata_or_none).

    Non-DICOM uploads pass through unchanged.
    """
    if not is_dicom_path(image_path):
        return image_path, None, None

    converted = convert_dicom_to_png(image_path)
    return converted.png_path, converted.original_path, converted.metadata
