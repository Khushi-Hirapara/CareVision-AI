"""Dashboard statistics scoped by doctor or patient."""

from sqlalchemy import desc, func
from sqlalchemy.orm import Query, Session

from app.models.patient import Patient
from app.models.scan import Scan
from app.services.patient import count_patients_for_doctor, get_patient_by_user_id
from app.services.prediction_labels import COVID_LABEL, NORMAL_LABEL, PNEUMONIA_LABEL
from app.services.scan import reconcile_unlinked_scans_for_doctor

RECENT_SCAN_LIMIT = 5


def _patient_ids_for_doctor(db: Session, doctor_id: int) -> list[int]:
    rows = db.query(Patient.id).filter(Patient.doctor_id == doctor_id).all()
    return [row[0] for row in rows]


def _prediction_counts(base: Query) -> dict[str, int]:
    return {
        "total_scans": base.count(),
        "normal_scans": base.filter(Scan.prediction == NORMAL_LABEL).count(),
        "pneumonia_scans": base.filter(Scan.prediction == PNEUMONIA_LABEL).count(),
        "covid_scans": base.filter(Scan.prediction == COVID_LABEL).count(),
    }


def get_doctor_dashboard_stats(db: Session, doctor_id: int) -> dict:
    reconcile_unlinked_scans_for_doctor(db, doctor_id)
    total_patients = count_patients_for_doctor(db, doctor_id)
    patient_ids = _patient_ids_for_doctor(db, doctor_id)

    if not patient_ids:
        return {
            "total_patients": total_patients,
            "total_scans": 0,
            "normal_scans": 0,
            "pneumonia_scans": 0,
            "covid_scans": 0,
            "average_confidence": None,
            "recent_scans": [],
        }

    base = db.query(Scan).filter(Scan.patient_id.in_(patient_ids))
    counts = _prediction_counts(base)
    average_confidence = (
        db.query(func.avg(Scan.confidence))
        .filter(Scan.patient_id.in_(patient_ids))
        .scalar()
    )
    recent_scans = (
        db.query(Scan)
        .filter(Scan.patient_id.in_(patient_ids))
        .order_by(desc(Scan.created_at))
        .limit(RECENT_SCAN_LIMIT)
        .all()
    )

    return {
        "total_patients": total_patients,
        **counts,
        "average_confidence": float(average_confidence) if average_confidence is not None else None,
        "recent_scans": recent_scans,
    }


def get_patient_dashboard_stats(db: Session, user_id: int) -> dict:
    patient = get_patient_by_user_id(db, user_id)
    if patient is None:
        return {
            "total_scans": 0,
            "normal_scans": 0,
            "pneumonia_scans": 0,
            "covid_scans": 0,
            "average_confidence": None,
            "last_scan_result": None,
            "last_scan_date": None,
        }

    base = db.query(Scan).filter(Scan.patient_id == patient.id)
    counts = _prediction_counts(base)
    last_scan = (
        db.query(Scan)
        .filter(Scan.patient_id == patient.id)
        .order_by(desc(Scan.created_at))
        .first()
    )
    average_confidence = (
        db.query(func.avg(Scan.confidence))
        .filter(Scan.patient_id == patient.id)
        .scalar()
    )

    return {
        **counts,
        "average_confidence": (
            float(average_confidence) if average_confidence is not None else None
        ),
        "last_scan_result": last_scan.prediction if last_scan else None,
        "last_scan_date": last_scan.created_at if last_scan else None,
    }
