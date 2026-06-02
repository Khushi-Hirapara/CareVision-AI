from typing import Literal

from pydantic import BaseModel, Field

PredictionLabel = Literal["Normal", "Pneumonia"]


class PredictResponse(BaseModel):
    scan_id: int = Field(..., description="Saved scan record id for history and reports.")
    prediction: PredictionLabel
    confidence: float = Field(..., ge=0.0, le=100.0, description="Model confidence (0–100).")
    recommendation: str
    image_path: str
    heatmap_path: str | None = Field(
        default=None,
        description="Grad-CAM overlay path, or null if disabled or generation failed.",
    )
