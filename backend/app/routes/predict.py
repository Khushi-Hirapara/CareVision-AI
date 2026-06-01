from fastapi import APIRouter, Depends, File, UploadFile

from app.core.config import Settings, get_settings
from app.schemas.predict import PredictResponse
from app.services.prediction import run_prediction
from app.services.upload import save_xray_upload

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
async def predict_xray(
    file: UploadFile = File(..., description="Chest X-ray image (PNG or JPEG)."),
    settings: Settings = Depends(get_settings),
) -> PredictResponse:
    """Upload a chest X-ray, run inference (dummy until model is trained), and return results."""
    image_path = await save_xray_upload(file, settings)
    result = run_prediction(image_path, settings)
    return PredictResponse(
        prediction=result.prediction,
        confidence=result.confidence,
        recommendation=result.recommendation,
        image_path=result.image_path,
        heatmap_path=result.heatmap_path,
    )
