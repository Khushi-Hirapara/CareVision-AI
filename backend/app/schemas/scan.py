from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserResponse


class ScanBase(BaseModel):
    patient_name: str = Field(..., min_length=1, max_length=255)
    image_path: str = Field(..., max_length=512)
    heatmap_path: str | None = Field(default=None, max_length=512)
    prediction: str = Field(..., max_length=64)
    confidence: float = Field(..., ge=0.0, le=1.0)
    recommendation: str | None = None


class ScanCreate(BaseModel):
    user_id: int
    patient_name: str = Field(..., min_length=1, max_length=255)
    image_path: str = Field(..., max_length=512)
    heatmap_path: str | None = Field(default=None, max_length=512)
    prediction: str = Field(..., max_length=64)
    confidence: float = Field(..., ge=0.0, le=1.0)
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
    created_at: datetime


class ScanWithUser(ScanResponse):
    user: UserResponse
