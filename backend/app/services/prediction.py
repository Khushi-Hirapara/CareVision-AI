"""Orchestrates TensorFlow inference, Grad-CAM, and recommendation text for /predict."""

import logging
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException, status

from app.core.config import Settings
from app.core.http_errors import error_detail
from app.schemas.predict import PredictionLabel
from app.services.dicom import prepare_image_for_inference
from app.services.grad_cam import try_generate_grad_cam_heatmap
from app.services.ml_inference import run_model_inference
from app.services.ai_findings import build_ai_findings
from app.services.follow_up_recommendation import build_follow_up_recommendation
from app.services.image_quality import validate_image_quality
from app.services.observed_regions import build_observed_regions
from app.services.prediction_labels import to_api_label
from app.services.recommendations import build_recommendation
from app.services.severity import SeverityLabel, compute_severity
from app.services.upload import to_storage_path
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PredictionResult:
    prediction: PredictionLabel
    confidence: float
    severity: SeverityLabel
    observed_regions: str
    ai_findings: str
    follow_up_recommendation: str
    recommendation: str
    image_path: str
    heatmap_path: str | None
    original_path: str | None = None
    dicom_metadata: dict | None = None


def run_prediction(image_path: Path, settings: Settings) -> PredictionResult:
    inference_path, original_dicom, dicom_metadata = prepare_image_for_inference(image_path)

    if settings.enable_image_quality_check:
        quality = validate_image_quality(inference_path, settings)
        if not quality.passed:
            logger.warning(
                "Image quality check failed for %s: %s",
                inference_path,
                [issue.code for issue in quality.issues],
            )
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=quality.summary(),
            )

    try:
        inference = run_model_inference(inference_path, settings)
    except FileNotFoundError as exc:
        logger.exception("Model weights not found for %s", settings.resolved_model_path)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_detail(settings, exc, context="Model weights not found"),
        ) from exc
    except Exception as exc:
        logger.exception("Model inference failed for %s", inference_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Model inference failed"),
        ) from exc

    logger.info(
        "Prediction pipeline: probs=%s final_prediction=%s confidence=%.2f%%",
        inference.class_probabilities,
        inference.prediction,
        inference.confidence,
    )

    prediction = to_api_label(inference.prediction)
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
    grad_cam = try_generate_grad_cam_heatmap(
        inference_path, inference.prediction, settings
    )
    region_hint = grad_cam.region_hint if grad_cam else None
    observed_regions = build_observed_regions(prediction, severity, region_hint)

    return PredictionResult(
        prediction=prediction,
        confidence=inference.confidence,
        severity=severity,
        observed_regions=observed_regions,
        ai_findings=ai_findings,
        follow_up_recommendation=follow_up_recommendation,
        recommendation=recommendation,
        image_path=to_storage_path(inference_path),
        heatmap_path=to_storage_path(grad_cam.path) if grad_cam else None,
        original_path=to_storage_path(original_dicom) if original_dicom else None,
        dicom_metadata=dicom_metadata,
    )
