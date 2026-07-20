"""Build prediction API responses from saved scans."""

from app.models.scan import Scan
from app.schemas.predict import PredictResponse
from app.services.prediction import PredictionResult


def build_predict_response(scan: Scan, result: PredictionResult) -> PredictResponse:
    return PredictResponse(
        scan_id=scan.id,
        prediction=result.prediction,
        confidence=result.confidence,
        severity=result.severity,
        observed_regions=result.observed_regions,
        ai_findings=result.ai_findings,
        follow_up_recommendation=result.follow_up_recommendation,
        recommendation=result.recommendation,
        image_path=result.image_path,
        heatmap_path=result.heatmap_path,
        original_path=result.original_path,
        dicom_metadata=result.dicom_metadata,
        model_version=scan.model_version or "",
    )
