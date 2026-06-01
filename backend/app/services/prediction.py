import hashlib
import shutil
from dataclasses import dataclass
from pathlib import Path

from app.core.config import Settings
from app.schemas.predict import PredictionLabel
from app.services.upload import to_storage_path

_RECOMMENDATIONS: dict[PredictionLabel, str] = {
    "Normal": (
        "No strong radiographic indicators of pneumonia were detected on this screening. "
        "Continue routine clinical care unless symptoms suggest otherwise. "
        "This AI output is decision-support only—not a definitive diagnosis."
    ),
    "Pneumonia": (
        "Findings may be consistent with pneumonia. Correlate with clinical symptoms, "
        "vital signs, and laboratory results. Consider follow-up imaging or specialist "
        "consultation if clinically indicated. This output is decision-support only—not "
        "a definitive diagnosis."
    ),
}


@dataclass(frozen=True)
class PredictionResult:
    prediction: PredictionLabel
    confidence: float
    recommendation: str
    image_path: str
    heatmap_path: str


def _dummy_label_and_confidence(image_path: Path) -> tuple[PredictionLabel, float]:
    """Deterministic placeholder inference until the trained model is wired in."""
    digest = hashlib.sha256(image_path.name.encode()).hexdigest()
    bucket = int(digest[:8], 16) % 100
    prediction: PredictionLabel = "Pneumonia" if bucket >= 45 else "Normal"
    if prediction == "Pneumonia":
        confidence = 62.0 + (bucket % 35)
    else:
        confidence = 68.0 + (bucket % 30)
    return prediction, min(confidence, 99.0)


def _write_dummy_heatmap(source_image: Path, settings: Settings) -> Path:
    """Copy the source image as a stand-in heatmap until Grad-CAM is implemented."""
    heatmap_dir = settings.upload_path / "heatmaps"
    heatmap_dir.mkdir(parents=True, exist_ok=True)
    heatmap_path = heatmap_dir / f"{source_image.stem}_heatmap{source_image.suffix}"
    shutil.copy2(source_image, heatmap_path)
    return heatmap_path


def run_prediction(image_path: Path, settings: Settings) -> PredictionResult:
    prediction, confidence = _dummy_label_and_confidence(image_path)
    recommendation = _RECOMMENDATIONS[prediction]

    heatmap_file = (
        _write_dummy_heatmap(image_path, settings)
        if settings.enable_grad_cam
        else image_path
    )

    return PredictionResult(
        prediction=prediction,
        confidence=round(confidence, 1),
        recommendation=recommendation,
        image_path=to_storage_path(image_path),
        heatmap_path=to_storage_path(heatmap_file),
    )
