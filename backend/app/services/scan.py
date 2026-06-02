"""Scan history persistence and queries."""

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.scan import Scan
from app.services.prediction import PredictionResult
from app.services.user import get_or_create_default_user


def create_scan_from_prediction(
    db: Session,
    *,
    patient_name: str,
    result: PredictionResult,
) -> Scan:
    user = get_or_create_default_user(db)
    display_name = patient_name.strip() or "Unknown Patient"

    scan = Scan(
        user_id=user.id,
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


def list_scans(db: Session, *, skip: int = 0, limit: int = 50) -> list[Scan]:
    return (
        db.query(Scan)
        .order_by(desc(Scan.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_scan_by_id(db: Session, scan_id: int) -> Scan | None:
    return db.query(Scan).filter(Scan.id == scan_id).first()
