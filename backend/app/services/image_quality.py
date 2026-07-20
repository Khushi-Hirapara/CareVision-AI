"""Pre-inference image quality checks for chest X-ray uploads."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

from app.core.config import Settings

# Tunable thresholds (0–255 grayscale scale unless noted).
_MIN_DIMENSION_DEFAULT = 224
_MEAN_DARK_THRESHOLD = 35.0
_MEAN_BRIGHT_THRESHOLD = 245.0
_LAPLACIAN_VAR_MIN = 75.0
_LANDSCAPE_RATIO = 1.15  # width / height
_COLOR_CHANNEL_DIFF_MAX = 14.0
_MIN_ASPECT_RATIO = 0.38  # min(w,h)/max(w,h); filters ultra-wide/tall non-X-rays
_ANALYSIS_MAX_EDGE = 512


@dataclass(frozen=True)
class QualityIssue:
    code: str
    message: str


@dataclass(frozen=True)
class ImageQualityReport:
    passed: bool
    issues: tuple[QualityIssue, ...]

    def summary(self) -> str:
        if self.passed:
            return "Image quality check passed."
        lines = [issue.message for issue in self.issues]
        return "Image quality check failed:\n" + "\n".join(f"• {line}" for line in lines)


def _load_arrays(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with Image.open(path) as img:
        rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
        gray = np.asarray(img.convert("L"), dtype=np.float32)
    return rgb, gray


def _resize_gray_for_analysis(gray: np.ndarray) -> np.ndarray:
    height, width = gray.shape
    longest = max(height, width)
    if longest <= _ANALYSIS_MAX_EDGE:
        return gray
    scale = _ANALYSIS_MAX_EDGE / float(longest)
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    resized = Image.fromarray(gray.astype(np.uint8)).resize(new_size, Image.Resampling.BILINEAR)
    return np.asarray(resized, dtype=np.float32)


def _laplacian_variance(gray: np.ndarray) -> float:
    if gray.shape[0] < 3 or gray.shape[1] < 3:
        return 0.0
    center = gray[1:-1, 1:-1]
    lap = (
        -4.0 * center
        + gray[1:-1, :-2]
        + gray[1:-1, 2:]
        + gray[:-2, 1:-1]
        + gray[2:, 1:-1]
    )
    return float(lap.var())


def _mean_channel_color_diff(rgb: np.ndarray) -> float:
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    return float(np.mean(np.abs(r - g) + np.abs(g - b) + np.abs(r - b)) / 3.0)


def validate_image_quality(
    image_path: Path,
    settings: Settings | None = None,
) -> ImageQualityReport:
    """
    Validate uploaded study quality before ML inference.

    Checks: resolution, exposure, blur, orientation, and non-chest heuristics.
    """
    min_dim = getattr(settings, "min_image_dimension", None) if settings else None
    min_dimension = int(min_dim or _MIN_DIMENSION_DEFAULT)

    try:
        rgb, gray = _load_arrays(image_path)
    except OSError as exc:
        return ImageQualityReport(
            passed=False,
            issues=(
                QualityIssue(
                    code="unreadable",
                    message=f"Could not read image file: {exc}",
                ),
            ),
        )

    height, width = gray.shape
    issues: list[QualityIssue] = []

    if width < min_dimension or height < min_dimension:
        issues.append(
            QualityIssue(
                code="low_resolution",
                message=(
                    f"Low resolution ({width}×{height}). "
                    f"Minimum {min_dimension}px on each side is required."
                ),
            )
        )

    mean_brightness = float(gray.mean())
    if mean_brightness < _MEAN_DARK_THRESHOLD:
        issues.append(
            QualityIssue(
                code="too_dark",
                message="Image too dark. Use a brighter chest X-ray or adjust window/level.",
            )
        )
    elif mean_brightness > _MEAN_BRIGHT_THRESHOLD:
        issues.append(
            QualityIssue(
                code="too_bright",
                message="Image overexposed or too bright for reliable screening.",
            )
        )

    gray_small = _resize_gray_for_analysis(gray)
    if _laplacian_variance(gray_small) < _LAPLACIAN_VAR_MIN:
        issues.append(
            QualityIssue(
                code="blurred",
                message="Image appears blurred. Upload a sharper chest radiograph.",
            )
        )

    if width > height * _LANDSCAPE_RATIO:
        issues.append(
            QualityIssue(
                code="wrong_orientation",
                message=(
                    "Wrong orientation suspected (landscape). "
                    "Chest X-rays are usually portrait (taller than wide)."
                ),
            )
        )

    aspect = min(width, height) / max(width, height)
    color_diff = _mean_channel_color_diff(rgb)
    if aspect < _MIN_ASPECT_RATIO:
        issues.append(
            QualityIssue(
                code="unlikely_aspect",
                message="Unusual image proportions for a chest X-ray study.",
            )
        )

    if color_diff > _COLOR_CHANNEL_DIFF_MAX:
        issues.append(
            QualityIssue(
                code="non_chest",
                message=(
                    "Non chest X-ray detected. Upload a grayscale chest radiograph, "
                    "not a color photograph."
                ),
            )
        )
    elif color_diff > _COLOR_CHANNEL_DIFF_MAX * 0.65 and aspect < 0.55:
        issues.append(
            QualityIssue(
                code="non_chest",
                message=(
                    "Study does not look like a standard chest X-ray. "
                    "Check file type and orientation."
                ),
            )
        )

    dynamic_range = float(gray.max() - gray.min())
    if dynamic_range < 20:
        issues.append(
            QualityIssue(
                code="low_contrast",
                message="Very low contrast. Image may be blank or unusable for screening.",
            )
        )

    return ImageQualityReport(passed=len(issues) == 0, issues=tuple(issues))
