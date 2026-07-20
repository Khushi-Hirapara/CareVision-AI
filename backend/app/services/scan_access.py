"""Role-scoped scan access for doctors and patients."""

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.scan import Scan
from app.models.user import User
from app.services.patient import get_patient_by_user_id


def get_scan_for_doctor_managed_patient(
    db: Session,
    scan_id: int,
    doctor_id: int,
) -> Scan | None:
    """Scan linked to a patient profile owned by the doctor."""
    return (
        db.query(Scan)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(
            Scan.id == scan_id,
            Patient.doctor_id == doctor_id,
            Scan.patient_id.isnot(None),
        )
        .first()
    )


def list_scans_for_doctor_managed_patients(
    db: Session,
    *,
    doctor_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Scan]:
    return (
        db.query(Scan)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.doctor_id == doctor_id)
        .order_by(desc(Scan.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_scans_for_doctor_managed_patients(db: Session, doctor_id: int) -> int:
    return (
        db.query(func.count())
        .select_from(Scan)
        .join(Patient, Scan.patient_id == Patient.id)
        .filter(Patient.doctor_id == doctor_id)
        .scalar()
        or 0
    )


def get_scan_for_patient_profile(
    db: Session,
    scan_id: int,
    patient_id: int,
) -> Scan | None:
    return (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.patient_id == patient_id)
        .first()
    )


def get_scan_for_patient_user(
    db: Session,
    scan_id: int,
    user_id: int,
) -> Scan | None:
    """Resolve the patient's profile and return the scan if it belongs to them."""
    patient = get_patient_by_user_id(db, user_id)
    if patient is None:
        return None
    return get_scan_for_patient_profile(db, scan_id, patient.id)
