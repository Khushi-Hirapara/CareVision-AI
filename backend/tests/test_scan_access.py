"""Unit tests for scan_access isolation helpers."""

from datetime import datetime, timezone

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import models  # noqa: F401 — register ORM tables
from app.database import Base
from app.models.patient import Patient
from app.models.scan import Scan
from app.models.user import User
from app.services.scan_access import (
    get_scan_for_doctor_managed_patient,
    get_scan_for_patient_profile,
    list_scans_for_doctor_managed_patients,
)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    session = sessionmaker(bind=engine)()
    try:
        yield session
    finally:
        session.close()


def _seed(db):
    doctor_a = User(
        id=1,
        email="a@doc.com",
        name="Doc A",
        hashed_password="x",
        role="doctor",
    )
    doctor_b = User(
        id=2,
        email="b@doc.com",
        name="Doc B",
        hashed_password="x",
        role="doctor",
    )
    patient_user = User(
        id=3,
        email="p@pat.com",
        name="Pat",
        hashed_password="x",
        role="patient",
    )
    profile_a = Patient(
        id=10,
        doctor_id=1,
        user_id=3,
        name="Pat A",
        email="p@pat.com",
    )
    profile_b = Patient(
        id=20,
        doctor_id=2,
        user_id=None,
        name="Pat B",
        email="b@pat.com",
    )
    scan_a = Scan(
        id=100,
        user_id=1,
        patient_id=10,
        patient_name="Pat A",
        image_path="uploads/a.jpg",
        prediction="Normal",
        confidence=0.9,
        severity="None",
        observed_regions="No significant opacity regions identified",
        ai_findings="",
        follow_up_recommendation="",
        recommendation="",
        created_at=datetime.now(timezone.utc),
    )
    scan_b = Scan(
        id=200,
        user_id=2,
        patient_id=20,
        patient_name="Pat B",
        image_path="uploads/b.jpg",
        prediction="Pneumonia",
        confidence=0.8,
        severity="Mild",
        observed_regions="Right Lung\nLower Lobe\nApproximate infected region: 23%",
        ai_findings="",
        follow_up_recommendation="",
        recommendation="",
        created_at=datetime.now(timezone.utc),
    )
    db.add_all([doctor_a, doctor_b, patient_user, profile_a, profile_b, scan_a, scan_b])
    db.commit()
    return scan_a, scan_b


def test_doctor_a_sees_only_managed_patient_scans(db):
    _seed(db)
    scans = list_scans_for_doctor_managed_patients(db, doctor_id=1, limit=10)
    assert len(scans) == 1
    assert scans[0].id == 100


def test_doctor_b_cannot_read_doctor_a_scan(db):
    _seed(db)
    assert get_scan_for_doctor_managed_patient(db, 100, doctor_id=2) is None


def test_doctor_a_can_read_own_patient_scan(db):
    _seed(db)
    scan = get_scan_for_doctor_managed_patient(db, 100, doctor_id=1)
    assert scan is not None
    assert scan.patient_id == 10


def test_patient_cannot_read_other_profile_scan(db):
    _seed(db)
    assert get_scan_for_patient_profile(db, 200, patient_id=10) is None


def test_patient_can_read_own_scan(db):
    _seed(db)
    scan = get_scan_for_patient_profile(db, 100, patient_id=10)
    assert scan is not None
