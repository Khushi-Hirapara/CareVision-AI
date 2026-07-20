from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import require_doctor, require_patient
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import DoctorDashboardStats, PatientDashboardStats
from app.schemas.scan import ScanResponse
from app.services.dashboard import get_doctor_dashboard_stats, get_patient_dashboard_stats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/doctor-stats", response_model=DoctorDashboardStats)
def doctor_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> DoctorDashboardStats:
    """Aggregate statistics for patients managed by the authenticated doctor."""
    raw = get_doctor_dashboard_stats(db, current_user.id)
    return DoctorDashboardStats(
        total_patients=raw["total_patients"],
        total_scans=raw["total_scans"],
        normal_scans=raw["normal_scans"],
        pneumonia_scans=raw["pneumonia_scans"],
        average_confidence=raw["average_confidence"],
        recent_scans=[ScanResponse.model_validate(scan) for scan in raw["recent_scans"]],
    )


@router.get("/patient-stats", response_model=PatientDashboardStats)
def patient_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> PatientDashboardStats:
    """Aggregate statistics for the authenticated patient's linked profile."""
    raw = get_patient_dashboard_stats(db, current_user.id)
    return PatientDashboardStats(**raw)
