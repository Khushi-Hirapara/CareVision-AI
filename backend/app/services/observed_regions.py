"""Observed lung-region summary for AI analysis reports."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.schemas.predict import PredictionLabel, SeverityLabel

_NORMAL_REGIONS = "No significant opacity regions identified"

_FALLBACK_PNEUMONIA: dict[SeverityLabel, str] = {
    "Mild": (
        "Unspecified lung field\n"
        "Subtle opacity pattern\n"
        "Approximate infected region: not quantified"
    ),
    "Moderate": (
        "Unspecified lung field\n"
        "Abnormal opacity pattern\n"
        "Approximate infected region: not quantified"
    ),
    "Severe": (
        "Unspecified lung field\n"
        "Extensive opacity pattern\n"
        "Approximate infected region: not quantified"
    ),
    "None": (
        "Unspecified lung field\n"
        "Abnormal opacity pattern\n"
        "Approximate infected region: not quantified"
    ),
}

_LOBE_LABELS = {
    "upper": "Upper Lobe",
    "middle": "Middle Lobe",
    "lower": "Lower Lobe",
}


@dataclass(frozen=True)
class RegionLocalization:
    """Structured Grad-CAM localization for clinician explainability."""

    lung: str
    lobe: str
    infected_pct: int
    heatmap_confidence_pct: int = 0
    is_diffuse: bool = False

    def format(self) -> str:
        lines = [
            self.lung,
            self.lobe,
            f"Approximate infected region: {self.infected_pct}%",
        ]
        if self.heatmap_confidence_pct > 0:
            lines.append(f"Heatmap confidence: {self.heatmap_confidence_pct}%")
        return "\n".join(lines)


def _approx_infected_pct(heatmap: np.ndarray, activation_threshold: float = 0.45) -> int:
    """
    Estimate the share of the radiograph with strong Grad-CAM activation.

    Uses a fixed relative threshold on the normalized heatmap (0–1).
    """
    if heatmap.size == 0:
        return 0
    active = float(np.count_nonzero(heatmap >= activation_threshold))
    pct = int(round(100.0 * active / float(heatmap.size)))
    return int(np.clip(pct, 0, 100))


def _heatmap_confidence_pct(
    heatmap: np.ndarray,
    zone_scores: dict[tuple[str, str], float],
    best_key: tuple[str, str] | None,
    *,
    is_diffuse: bool,
) -> int:
    """Estimate how strongly the heatmap supports the localized suspicious region."""
    if is_diffuse or best_key is None:
        active = heatmap[heatmap >= 0.45] if heatmap.size else heatmap
        if active.size == 0:
            return int(np.clip(round(float(heatmap.mean()) * 100), 0, 100))
        return int(np.clip(round(float(active.mean()) * 100), 0, 100))

    best_score = zone_scores.get(best_key, 0.0)
    scaled = (best_score - 0.15) / (0.85 - 0.15)
    return int(np.clip(round(100 * scaled), 0, 100))


def analyze_heatmap_localization(
    heatmap: np.ndarray,
    min_mean: float = 0.28,
) -> RegionLocalization:
    """
    Map Grad-CAM activation to lung side, lobe, and approximate infected area %.

    Chest X-rays are displayed with the patient's right on the viewer's left.
    """
    infected_pct = _approx_infected_pct(heatmap)

    if heatmap.ndim != 2 or heatmap.size == 0:
        return RegionLocalization(
            lung="Both Lungs",
            lobe="Diffuse pattern",
            infected_pct=infected_pct,
            heatmap_confidence_pct=0,
            is_diffuse=True,
        )

    height, width = heatmap.shape
    row_cut_a, row_cut_b = height // 3, (2 * height) // 3
    col_mid = width // 2

    # Image-left = patient-right; image-right = patient-left.
    zones: dict[tuple[str, str], np.ndarray] = {
        ("Right Lung", "upper"): heatmap[0:row_cut_a, 0:col_mid],
        ("Right Lung", "middle"): heatmap[row_cut_a:row_cut_b, 0:col_mid],
        ("Right Lung", "lower"): heatmap[row_cut_b:, 0:col_mid],
        ("Left Lung", "upper"): heatmap[0:row_cut_a, col_mid:],
        ("Left Lung", "middle"): heatmap[row_cut_a:row_cut_b, col_mid:],
        ("Left Lung", "lower"): heatmap[row_cut_b:, col_mid:],
    }

    scores = {
        key: float(np.mean(region))
        for key, region in zones.items()
        if region.size > 0
    }
    if not scores:
        return RegionLocalization(
            lung="Both Lungs",
            lobe="Diffuse pattern",
            infected_pct=infected_pct,
            heatmap_confidence_pct=_heatmap_confidence_pct(
                heatmap, scores, None, is_diffuse=True
            ),
            is_diffuse=True,
        )

    best_lung, best_zone = max(scores, key=scores.get)
    best_key = (best_lung, best_zone)
    if scores[best_key] < min_mean:
        return RegionLocalization(
            lung="Both Lungs",
            lobe="Diffuse pattern",
            infected_pct=max(infected_pct, 1) if infected_pct > 0 else 0,
            heatmap_confidence_pct=_heatmap_confidence_pct(
                heatmap, scores, best_key, is_diffuse=True
            ),
            is_diffuse=True,
        )

    return RegionLocalization(
        lung=best_lung,
        lobe=_LOBE_LABELS[best_zone],
        infected_pct=max(infected_pct, 1),
        heatmap_confidence_pct=_heatmap_confidence_pct(
            heatmap, scores, best_key, is_diffuse=False
        ),
        is_diffuse=False,
    )


def localize_from_heatmap(heatmap: np.ndarray, min_mean: float = 0.28) -> str:
    """Return a multi-line clinician-facing localization summary."""
    return analyze_heatmap_localization(heatmap, min_mean=min_mean).format()


def build_observed_regions(
    prediction: PredictionLabel,
    severity: SeverityLabel,
    region_hint: str | None = None,
) -> str:
    """Return a structured affected-area block for the AI report."""
    if prediction == "Normal":
        return _NORMAL_REGIONS

    if region_hint and region_hint.strip():
        return region_hint.strip()

    return _FALLBACK_PNEUMONIA.get(severity, _FALLBACK_PNEUMONIA["Moderate"])
