"""Unit tests for observed lung-region localization."""

import numpy as np

from app.services.observed_regions import (
    analyze_heatmap_localization,
    build_observed_regions,
    localize_from_heatmap,
)


def test_localize_right_lower_lung():
    heatmap = np.zeros((30, 30), dtype=np.float32)
    heatmap[20:30, 0:15] = 1.0
    text = localize_from_heatmap(heatmap)
    assert "Right Lung" in text
    assert "Lower Lobe" in text
    assert "Approximate infected region:" in text
    assert "Heatmap confidence:" in text
    assert "%" in text


def test_localize_left_upper_lung():
    heatmap = np.zeros((30, 30), dtype=np.float32)
    heatmap[0:10, 15:30] = 1.0
    loc = analyze_heatmap_localization(heatmap)
    assert loc.lung == "Left Lung"
    assert loc.lobe == "Upper Lobe"
    assert 1 <= loc.infected_pct <= 100
    assert 1 <= loc.heatmap_confidence_pct <= 100


def test_infected_pct_scales_with_activation_area():
    small = np.zeros((40, 40), dtype=np.float32)
    small[30:40, 0:20] = 1.0
    large = np.zeros((40, 40), dtype=np.float32)
    large[:, :] = 1.0
    assert analyze_heatmap_localization(small).infected_pct < analyze_heatmap_localization(
        large
    ).infected_pct


def test_build_observed_regions_normal():
    assert (
        build_observed_regions("Normal", "None")
        == "No significant opacity regions identified"
    )


def test_build_observed_regions_uses_hint():
    hint = (
        "Right Lung\nLower Lobe\nApproximate infected region: 23%\n"
        "Heatmap confidence: 92%"
    )
    assert build_observed_regions("Pneumonia", "Moderate", hint) == hint


def test_build_ai_findings_moderate_tone():
    from app.services.ai_findings import build_ai_findings

    text = build_ai_findings("Pneumonia", "Moderate")
    assert "possible bacterial pneumonia" in text
    assert "Clinical correlation" in text


def test_build_follow_up_moderate_tone():
    from app.services.follow_up_recommendation import build_follow_up_recommendation

    text = build_follow_up_recommendation("Pneumonia", "Moderate")
    assert "Consult radiologist" in text
    assert "Repeat X-ray" in text
