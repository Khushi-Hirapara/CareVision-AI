"""Orchestrates TensorFlow inference, Grad-CAM, and recommendation text for /predict."""

import logging
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.http_errors import error_detail
from app.schemas.predict import PredictionLabel
from app.services.grad_cam import try_generate_grad_cam_heatmap
from app.services.ml_inference import run_model_inference
from app.services.ai_findings import build_ai_findings
from app.services.follow_up_recommendation import build_follow_up_recommendation
from app.services.recommendations import build_recommendation
from app.services.severity import SeverityLabel, compute_severity
from app.services.upload import to_storage_path
logger = logging.getLogger(__name__)

_MODEL_LABEL_TO_API: dict[str, PredictionLabel] = {
    "NORMAL": "Normal",
    "PNEUMONIA": "Pneumonia",
}


@dataclass(frozen=True)
class PredictionResult:
    prediction: PredictionLabel
    confidence: float
    severity: SeverityLabel
    ai_findings: str
    follow_up_recommendation: str
    recommendation: str
    image_path: str
    heatmap_path: str | None


def run_prediction(image_path: Path, settings: Settings) -> PredictionResult:
    try:
        inference = run_model_inference(image_path, settings)
    except FileNotFoundError as exc:
        logger.exception("Model weights not found for %s", settings.resolved_model_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_detail(settings, exc, context="Model weights not found"),
        ) from exc
    except Exception as exc:
        logger.exception("Model inference failed for %s", image_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Model inference failed"),
        ) from exc

    logger.info(
        "Prediction pipeline: raw_sigmoid_output=%.6f pneumonia_probability=%.6f "
        "normal_probability=%.6f threshold=%.2f final_prediction=%s confidence=%.2f%%",
        inference.raw_output,
        inference.pneumonia_probability,
        inference.normal_probability,
        settings.prediction_threshold,
        inference.prediction,
        inference.confidence,
    )

    prediction = _MODEL_LABEL_TO_API.get(inference.prediction)
    if prediction is None:
        msg = f"Unexpected model label: {inference.prediction}"
        logger.error(msg)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=msg,
        )

    recommendation = build_recommendation(prediction)
    severity = compute_severity(prediction, inference.confidence)
    ai_findings = build_ai_findings(prediction, severity)
    follow_up_recommendation = build_follow_up_recommendation(prediction, severity)
    heatmap_file = try_generate_grad_cam_heatmap(
        image_path, inference.prediction, settings
    )

    return PredictionResult(
        prediction=prediction,
        confidence=inference.confidence,
        severity=severity,
        ai_findings=ai_findings,
        follow_up_recommendation=follow_up_recommendation,
        recommendation=recommendation,
        image_path=to_storage_path(image_path),
        heatmap_path=to_storage_path(heatmap_file) if heatmap_file else None,
    )
