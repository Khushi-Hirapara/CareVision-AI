from typing import Literal

from pydantic import BaseModel, Field

PredictionLabel = Literal["Normal", "Pneumonia"]


class PredictResponse(BaseModel):
    prediction: PredictionLabel
    confidence: float = Field(..., ge=0.0, le=100.0, description="Model confidence (0–100).")
    recommendation: str
    image_path: str
    heatmap_path: str
