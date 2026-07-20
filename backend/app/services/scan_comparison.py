"""Scan comparison helpers for treatment-progress tracking."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from app.schemas.predict import PredictionLabel, SeverityLabel

SeverityRank = {"None": 0, "Mild": 1, "Moderate": 2, "Severe": 3}

ComparisonTrend = Literal["improved", "worsened", "stable"]
OpacityChangeLabel = Literal[
    "Opacity Reduced",
    "Opacity Increased",
    "Opacity Unchanged",
    "Opacity not quantified",
]


@dataclass(frozen=True)
class ScanSnapshot:
    id: int
    created_at: datetime
    prediction: PredictionLabel
    confidence: float  # 0–1
    severity: SeverityLabel
    observed_regions: str


@dataclass(frozen=True)
class ScanComparisonResult:
    earlier_id: int
    later_id: int
    improvement_pct: int
    trend: ComparisonTrend
    trend_label: str
    opacity_label: OpacityChangeLabel
    opacity_earlier_pct: float | None
    opacity_later_pct: float | None
    severity_from: SeverityLabel
    severity_to: SeverityLabel
    prediction_from: PredictionLabel
    prediction_to: PredictionLabel
    summary: str


def parse_infected_pct(observed_regions: str) -> float | None:
    for line in observed_regions.splitlines():
        text = line.strip().lower()
        if text.startswith("approximate infected region:"):
            raw = text.split(":", 1)[1].strip().replace("%", "")
            try:
                return float(raw)
            except ValueError:
                return None
    return None


def _opacity_label(
    earlier_pct: float | None,
    later_pct: float | None,
) -> OpacityChangeLabel:
    if earlier_pct is None or later_pct is None:
        return "Opacity not quantified"
    delta = later_pct - earlier_pct
    if delta <= -2:
        return "Opacity Reduced"
    if delta >= 2:
        return "Opacity Increased"
    return "Opacity Unchanged"


def _improvement_pct(
    earlier: ScanSnapshot,
    later: ScanSnapshot,
    earlier_opacity: float | None,
    later_opacity: float | None,
) -> int:
    scores: list[float] = []

    sev_delta = SeverityRank[earlier.severity] - SeverityRank[later.severity]
    scores.append((sev_delta / 3.0) * 100.0)

    if earlier_opacity is not None and later_opacity is not None:
        baseline = max(earlier_opacity, 1.0)
        scores.append(((earlier_opacity - later_opacity) / baseline) * 100.0)

    if earlier.prediction == "Pneumonia" and later.prediction == "Normal":
        scores.append(70.0)
    elif earlier.prediction == "Normal" and later.prediction == "Pneumonia":
        scores.append(-70.0)

    if earlier.prediction == "Pneumonia" and later.prediction == "Pneumonia":
        scores.append((earlier.confidence - later.confidence) * 40.0)

    avg = sum(scores) / len(scores)
    return int(round(max(-100.0, min(100.0, avg))))


def compare_scans(scan_a: ScanSnapshot, scan_b: ScanSnapshot) -> ScanComparisonResult:
    if scan_a.id == scan_b.id:
        raise ValueError("Select two different scans to compare.")

    if scan_a.created_at <= scan_b.created_at:
        earlier, later = scan_a, scan_b
    else:
        earlier, later = scan_b, scan_a

    earlier_opacity = parse_infected_pct(earlier.observed_regions)
    later_opacity = parse_infected_pct(later.observed_regions)
    improvement = _improvement_pct(earlier, later, earlier_opacity, later_opacity)

    if improvement >= 5:
        trend: ComparisonTrend = "improved"
        trend_label = f"Improvement: {improvement}%"
    elif improvement <= -5:
        trend = "worsened"
        trend_label = f"Worsening: {abs(improvement)}%"
    else:
        trend = "stable"
        trend_label = "Stable"

    if trend == "improved":
        summary = (
            f"Screening signals improved by about {improvement}% between the selected studies."
        )
    elif trend == "worsened":
        summary = (
            f"Screening signals worsened by about {abs(improvement)}% between the selected studies."
        )
    else:
        summary = "Screening signals appear broadly stable between the selected studies."

    return ScanComparisonResult(
        earlier_id=earlier.id,
        later_id=later.id,
        improvement_pct=improvement,
        trend=trend,
        trend_label=trend_label,
        opacity_label=_opacity_label(earlier_opacity, later_opacity),
        opacity_earlier_pct=earlier_opacity,
        opacity_later_pct=later_opacity,
        severity_from=earlier.severity,
        severity_to=later.severity,
        prediction_from=earlier.prediction,
        prediction_to=later.prediction,
        summary=summary,
    )
