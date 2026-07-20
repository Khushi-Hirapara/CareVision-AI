from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.scan import ScanResponse


class DoctorDashboardStats(BaseModel):
    total_patients: int = Field(..., ge=0)
    total_scans: int = Field(..., ge=0)
    normal_scans: int = Field(..., ge=0)
    pneumonia_scans: int = Field(..., ge=0)
    average_confidence: float | None = Field(
        default=None,
        description="Mean model confidence (0–1) across patient scans.",
    )
    recent_scans: list[ScanResponse] = Field(default_factory=list)


class PatientDashboardStats(BaseModel):
    total_scans: int = Field(..., ge=0)
    normal_scans: int = Field(..., ge=0)
    pneumonia_scans: int = Field(..., ge=0)
    average_confidence: float | None = Field(
        default=None,
        description="Mean model confidence (0–1) across your scans.",
    )
    last_scan_result: str | None = None
    last_scan_date: datetime | None = None
