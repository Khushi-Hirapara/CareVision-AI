"""Scan history persistence and queries."""

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.models.scan import Scan
from app.services.prediction import PredictionResult


def create_scan_from_prediction(
    db: Session,
    *,
    user_id: int,
    patient_id: int | None,
    patient_name: str,
    result: PredictionResult,
    model_version: str,
) -> Scan:
    display_name = patient_name.strip() or "Unknown Patient"

    scan = Scan(
        user_id=user_id,
        patient_id=patient_id,
        patient_name=display_name,
        image_path=result.image_path,
        heatmap_path=result.heatmap_path,
        prediction=result.prediction,
        confidence=result.confidence / 100.0,
        severity=result.severity,
        ai_findings=result.ai_findings,
        follow_up_recommendation=result.follow_up_recommendation,
        recommendation=result.recommendation,
        model_version=model_version,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return scan


def count_scans_for_user(db: Session, user_id: int) -> int:
    return (
        db.query(func.count())
        .select_from(Scan)
        .filter(Scan.user_id == user_id)
        .scalar()
        or 0
    )


def count_scans_for_patient(db: Session, patient_id: int) -> int:
    return (
        db.query(func.count())
        .select_from(Scan)
        .filter(Scan.patient_id == patient_id)
        .scalar()
        or 0
    )


def list_scans(
    db: Session,
    *,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Scan]:
    return (
        db.query(Scan)
        .filter(Scan.user_id == user_id)
        .order_by(desc(Scan.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_scans_for_patient(
    db: Session,
    *,
    patient_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Scan]:
    return (
        db.query(Scan)
        .filter(Scan.patient_id == patient_id)
        .order_by(desc(Scan.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_scan_for_user(db: Session, scan_id: int, user_id: int) -> Scan | None:
    return (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.user_id == user_id)
        .first()
    )


def get_scan_for_patient(db: Session, scan_id: int, patient_id: int) -> Scan | None:
    return (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.patient_id == patient_id)
        .first()
    )


def get_scan_for_doctor_patient(
    db: Session,
    scan_id: int,
    patient_id: int,
    doctor_id: int,
) -> Scan | None:
    return (
        db.query(Scan)
        .filter(
            Scan.id == scan_id,
            Scan.patient_id == patient_id,
            Scan.user_id == doctor_id,
        )
        .first()
    )


def reconcile_unlinked_scans_for_doctor(db: Session, doctor_id: int) -> int:
    """
    Link orphan scans to patient profiles when patient_name matches exactly.

    Returns the number of scans updated.
    """
    patients = db.query(Patient).filter(Patient.doctor_id == doctor_id).all()
    if not patients:
        return 0

    name_to_id = {p.name.strip().lower(): p.id for p in patients}
    orphans = (
        db.query(Scan)
        .filter(Scan.user_id == doctor_id, Scan.patient_id.is_(None))
        .all()
    )
    updated = 0
    for scan in orphans:
        key = scan.patient_name.strip().lower()
        patient_id = name_to_id.get(key)
        if patient_id is not None:
            scan.patient_id = patient_id
            updated += 1

    if updated:
        db.commit()
    return updated
