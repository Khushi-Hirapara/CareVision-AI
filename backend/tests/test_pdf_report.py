"""Tests for hospital-style PDF report generation."""

from datetime import datetime, timezone
from types import SimpleNamespace

from app.core.config import Settings
from app.services.pdf_report import generate_scan_report_pdf


def _mock_scan(**overrides):
    base = dict(
        id=42,
        patient_name="Jane Doe",
        image_path="missing.png",
        heatmap_path=None,
        prediction="Pneumonia",
        confidence=0.846,
        severity="Moderate",
        observed_regions=(
            "Right Lung\nLower Lobe\n"
            "Approximate infected region: 18%\nHeatmap confidence: 92%"
        ),
        ai_findings="AI analysis detected pneumonia-like opacity patterns.",
        follow_up_recommendation="Consult a radiologist within 24 hours.",
        recommendation="Urgent medical evaluation is recommended.",
        model_version="v1.0-efficientnetb0",
        dicom_metadata=None,
        created_at=datetime(2026, 6, 3, 14, 1, tzinfo=timezone.utc),
        user=SimpleNamespace(
            name="Dr. Enamul Kabir",
            email="doctor@carevision.local",
            role="doctor",
        ),
    )
    base.update(overrides)
    return SimpleNamespace(**base)


def test_generate_scan_report_pdf_returns_valid_bytes():
    scan = _mock_scan()
    cfg = Settings(
        HOSPITAL_NAME="CareVision Medical Center",
        FRONTEND_URL="http://localhost:3000",
    )
    pdf_bytes = generate_scan_report_pdf(scan, notes=[], cfg=cfg)
    assert isinstance(pdf_bytes, bytes)
    assert len(pdf_bytes) > 1500
    assert pdf_bytes.startswith(b"%PDF")


def test_generate_scan_report_pdf_without_doctor_user():
    scan = _mock_scan(user=None)
    pdf_bytes = generate_scan_report_pdf(scan, notes=[])
    assert pdf_bytes.startswith(b"%PDF")
