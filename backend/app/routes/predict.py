import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.deps import get_current_user
from app.core.http_errors import error_detail
from app.database import get_db
from app.models.user import User
from app.schemas.predict import PredictResponse
from app.services.prediction import run_prediction
from app.services.scan import create_scan_from_prediction
from app.services.upload import save_xray_upload

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict_xray(
    file: UploadFile = File(..., description="Chest X-ray image (PNG or JPEG)."),
    patient_name: str | None = Form(
        default=None,
        description="Optional patient label stored with the scan.",
    ),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PredictResponse:
    """Upload a chest X-ray, run TensorFlow inference, save scan, and return results."""
    try:
        image_path = await save_xray_upload(file, settings)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to save uploaded X-ray")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Upload save failed"),
        ) from exc

    try:
        result = run_prediction(image_path, settings)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Prediction failed"),
        ) from exc

    try:
        scan = create_scan_from_prediction(
            db,
            user_id=current_user.id,
            patient_name=patient_name or "",
            result=result,
        )
    except SQLAlchemyError as exc:
        logger.exception("Prediction succeeded but scan could not be saved")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_detail(
                settings,
                exc,
                context="Prediction succeeded but scan could not be saved",
            ),
        ) from exc

    return PredictResponse(
        scan_id=scan.id,
        prediction=result.prediction,
        confidence=result.confidence,
        recommendation=result.recommendation,
        image_path=result.image_path,
        heatmap_path=result.heatmap_path,
    )
