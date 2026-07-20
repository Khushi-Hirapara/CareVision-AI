from typing import Literal

from pydantic import BaseModel, Field

PredictionLabel = Literal["Normal", "Pneumonia"]
SeverityLabel = Literal["None", "Mild", "Moderate", "Severe"]


class PredictResponse(BaseModel):
    scan_id: int = Field(..., description="Saved scan record id for history and reports.")
    prediction: PredictionLabel
    confidence: float = Field(..., ge=0.0, le=100.0, description="Model confidence (0–100).")
    severity: SeverityLabel = Field(
        ...,
        description="AI severity score: None for Normal; Mild/Moderate/Severe for Pneumonia.",
    )
    observed_regions: str = Field(
        ...,
        description=(
            "Affected area block: lung side, lobe, and approximate infected region %."
        ),
    )
    ai_findings: str = Field(
        ...,
        description="Short clinical-style AI findings summary for this screening result.",
    )
    follow_up_recommendation: str = Field(
        ...,
        description="AI follow-up guidance based on prediction and severity.",
    )
    recommendation: str
    image_path: str
    heatmap_path: str | None = Field(
        default=None,
        description="Grad-CAM overlay path, or null if disabled or generation failed.",
    )
    original_path: str | None = Field(
        default=None,
        description="Original uploaded DICOM path when source was DICOM; otherwise null.",
    )
    dicom_metadata: dict | None = Field(
        default=None,
        description="Key DICOM tags preserved from the source study, when applicable.",
    )
    model_version: str = Field(
        ...,
        description="AI model version used for this prediction.",
    )
