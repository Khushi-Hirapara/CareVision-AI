from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.predict import SeverityLabel
from app.schemas.user import UserResponse


class ScanBase(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=255)
    image_path: str = Field(..., max_length=512)
    heatmap_path: str | None = Field(default=None, max_length=512)
    prediction: str = Field(..., max_length=64)
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: SeverityLabel = Field(
        default="None",
        description="AI severity score: None for Normal; Mild/Moderate/Severe for Pneumonia.",
    )
    ai_findings: str = Field(
        ...,
        description="Short clinical-style AI findings summary for this screening result.",
    )
    follow_up_recommendation: str = Field(
        ...,
        description="AI follow-up guidance based on prediction and severity.",
    )
    recommendation: str | None = None
    model_version: str | None = Field(
        default=None,
        description="AI model version used for this scan.",
    )


class ScanCreate(BaseModel):
    user_id: int
    patient_name: str = Field(..., min_length=1, max_length=255)
    image_path: str = Field(..., max_length=512)
    heatmap_path: str | None = Field(default=None, max_length=512)
    prediction: str = Field(..., max_length=64)
    confidence: float = Field(..., ge=0.0, le=1.0)
    severity: SeverityLabel = Field(
        default="None",
        description="AI severity score: None for Normal; Mild/Moderate/Severe for Pneumonia.",
    )
    ai_findings: str = Field(
        ...,
        description="Short clinical-style AI findings summary for this screening result.",
    )
    follow_up_recommendation: str = Field(
        ...,
        description="AI follow-up guidance based on prediction and severity.",
    )
    recommendation: str | None = None


class ScanUpdate(BaseModel):
    patient_name: str | None = Field(default=None, min_length=1, max_length=255)
    heatmap_path: str | None = Field(default=None, max_length=512)
    prediction: str | None = Field(default=None, max_length=64)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    recommendation: str | None = None


class ScanResponse(ScanBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    patient_id: int | None = None
    created_at: datetime


class ScanListResponse(BaseModel):
    items: list[ScanResponse]
    total: int


class ScanWithUser(ScanResponse):
    user: UserResponse
