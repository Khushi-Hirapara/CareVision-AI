"""Tests for patient trend aggregation helpers (Python mirror of UI math)."""

from datetime import datetime, timezone

from app.services.scan_comparison import SeverityRank


def build_severity_progression(severities: list[str]) -> str:
    if not severities:
        return "No scans yet"
    if len(severities) == 1:
        return f"Current: {severities[0]}"
    first, last = severities[0], severities[-1]
    if first == last:
        return f"Stable at {last}"
    return f"{first} → {last}"


def recovery_label(predictions: list[str], severities: list[str]) -> str:
    if len(predictions) < 2:
        return "Need 2+ scans"
    first_p, last_p = predictions[0], predictions[-1]
    first_s, last_s = SeverityRank[severities[0]], SeverityRank[severities[-1]]
    if first_p == "Pneumonia" and last_p == "Normal":
        return "Cleared pneumonia pattern"
    delta = first_s - last_s
    if delta > 0:
        return "Improving trajectory"
    if delta < 0:
        return "Worsening trajectory"
    return "Stable trajectory"


def test_severity_progression_improving():
    assert build_severity_progression(["Severe", "Moderate", "Mild"]) == "Severe → Mild"


def test_recovery_cleared():
    assert (
        recovery_label(["Pneumonia", "Pneumonia", "Normal"], ["Severe", "Mild", "None"])
        == "Cleared pneumonia pattern"
    )


def test_scan_frequency_by_month():
    dates = [
        datetime(2026, 1, 1, tzinfo=timezone.utc),
        datetime(2026, 1, 15, tzinfo=timezone.utc),
        datetime(2026, 2, 3, tzinfo=timezone.utc),
    ]
    buckets: dict[str, int] = {}
    for d in dates:
        key = f"{d.year}-{d.month:02d}"
        buckets[key] = buckets.get(key, 0) + 1
    assert buckets == {"2026-01": 2, "2026-02": 1}
