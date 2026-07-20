"""Patient persistence and queries."""

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.models.patient import Patient
from app.schemas.patient import PatientCreate, PatientUpdate


def count_accepted_patients_for_doctor(db: Session, doctor_id: int) -> int:
    """Patients who accepted an invitation (linked portal account)."""
    return (
        db.query(func.count())
        .select_from(Patient)
        .filter(
            Patient.doctor_id == doctor_id,
            Patient.user_id.isnot(None),
        )
        .scalar()
        or 0
    )


def count_patients_for_doctor(db: Session, doctor_id: int) -> int:
    """All patient profiles for dashboard totals."""
    return (
        db.query(func.count())
        .select_from(Patient)
        .filter(Patient.doctor_id == doctor_id)
        .scalar()
        or 0
    )


def list_accepted_patients(
    db: Session,
    *,
    doctor_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Patient]:
    return (
        db.query(Patient)
        .filter(
            Patient.doctor_id == doctor_id,
            Patient.user_id.isnot(None),
        )
        .order_by(desc(Patient.created_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_patients(
    db: Session,
    *,
    doctor_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[Patient]:
    return list_accepted_patients(db, doctor_id=doctor_id, skip=skip, limit=limit)


def get_patient_for_doctor(
    db: Session,
    patient_id: int,
    doctor_id: int,
) -> Patient | None:
    return (
        db.query(Patient)
        .filter(Patient.id == patient_id, Patient.doctor_id == doctor_id)
        .first()
    )


def get_accepted_patient_for_doctor(
    db: Session,
    patient_id: int,
    doctor_id: int,
) -> Patient | None:
    return (
        db.query(Patient)
        .filter(
            Patient.id == patient_id,
            Patient.doctor_id == doctor_id,
            Patient.user_id.isnot(None),
        )
        .first()
    )


def get_patient_by_user_id(db: Session, user_id: int) -> Patient | None:
    return db.query(Patient).filter(Patient.user_id == user_id).first()


def find_patient_for_doctor_by_name(
    db: Session,
    doctor_id: int,
    name: str,
) -> Patient | None:
    """Match a doctor's patient by exact name (case-insensitive)."""
    normalized = name.strip().lower()
    if not normalized:
        return None
    patients = (
        db.query(Patient)
        .filter(Patient.doctor_id == doctor_id)
        .all()
    )
    for patient in patients:
        if patient.name.strip().lower() == normalized:
            return patient
    return None


def resolve_patient_for_scan(
    db: Session,
    *,
    doctor_id: int,
    patient_id: int | None,
    patient_name: str | None,
) -> tuple[int | None, str]:
    """
    Resolve patient record for a new scan.

    Priority: explicit patient_id, then name match to an existing patient profile.
    """
    if patient_id is not None:
        patient = get_patient_for_doctor(db, patient_id, doctor_id)
        if patient is None:
            raise LookupError(f"Patient {patient_id} was not found for this doctor.")
        return patient.id, patient.name

    if patient_name and patient_name.strip():
        name = patient_name.strip()
        matched = find_patient_for_doctor_by_name(db, doctor_id, name)
        if matched is not None:
            return matched.id, matched.name
        return None, name

    return None, ""


def create_patient(
    db: Session,
    *,
    doctor_id: int,
    patient_in: PatientCreate,
) -> Patient:
    patient = Patient(
        doctor_id=doctor_id,
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        phone=patient_in.phone or None,
        email=str(patient_in.email) if patient_in.email else None,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def update_patient(
    db: Session,
    *,
    patient: Patient,
    patient_in: PatientUpdate,
) -> Patient:
    update_data = patient_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if field == "email" and value is not None:
            setattr(patient, field, str(value))
        elif value is not None:
            setattr(patient, field, value)

    db.commit()
    db.refresh(patient)
    return patient


def delete_patient(db: Session, patient: Patient) -> None:
    db.delete(patient)
    db.commit()
