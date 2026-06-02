"""Scan history persistence and queries."""

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.services.prediction import PredictionResult


def create_scan_from_prediction(
    db: Session,
    *,
    user_id: int,
    patient_name: str,
    result: PredictionResult,
) -> Scan:
    display_name = patient_name.strip() or "Unknown Patient"

    scan = Scan(
        user_id=user_id,
        patient_name=display_name,
        image_path=result.image_path,
        heatmap_path=result.heatmap_path,
        prediction=result.prediction,
        confidence=result.confidence / 100.0,
        recommendation=result.recommendation,
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


def get_scan_for_user(db: Session, scan_id: int, user_id: int) -> Scan | None:
    return (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.user_id == user_id)
        .first()
    )
