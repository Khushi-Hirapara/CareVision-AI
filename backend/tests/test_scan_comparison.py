"""Tests for scan comparison / treatment-progress math."""

from datetime import datetime, timezone

from app.services.scan_comparison import ScanSnapshot, compare_scans, parse_infected_pct


def _scan(
    scan_id: int,
    *,
    day: int,
    prediction: str = "Pneumonia",
    confidence: float = 0.95,
    severity: str = "Severe",
    infected: int | None = 40,
) -> ScanSnapshot:
    regions = "No significant opacity regions identified"
    if infected is not None:
        regions = f"Right Lung\nLower Lobe\nApproximate infected region: {infected}%"
    return ScanSnapshot(
        id=scan_id,
        created_at=datetime(2026, 1, day, tzinfo=timezone.utc),
        prediction=prediction,  # type: ignore[arg-type]
        confidence=confidence,
        severity=severity,  # type: ignore[arg-type]
        observed_regions=regions,
    )


def test_parse_infected_pct():
    text = "Right Lung\nLower Lobe\nApproximate infected region: 23%"
    assert parse_infected_pct(text) == 23.0


def test_severe_to_mild_shows_improvement_and_opacity_reduced():
    earlier = _scan(1, day=1, severity="Severe", infected=40, confidence=0.96)
    later = _scan(2, day=15, severity="Mild", infected=23, confidence=0.72)
    result = compare_scans(earlier, later)

    assert result.trend == "improved"
    assert result.improvement_pct >= 5
    assert result.opacity_label == "Opacity Reduced"
    assert result.severity_from == "Severe"
    assert result.severity_to == "Mild"
    assert "Improvement" in result.trend_label


def test_order_independent():
    earlier = _scan(1, day=1, severity="Severe", infected=40)
    later = _scan(2, day=15, severity="Mild", infected=23)
    assert compare_scans(later, earlier).earlier_id == 1
    assert compare_scans(later, earlier).later_id == 2


def test_worsening_detected():
    earlier = _scan(1, day=1, severity="Mild", infected=15, confidence=0.7)
    later = _scan(2, day=20, severity="Severe", infected=45, confidence=0.95)
    result = compare_scans(earlier, later)
    assert result.trend == "worsened"
    assert result.opacity_label == "Opacity Increased"
