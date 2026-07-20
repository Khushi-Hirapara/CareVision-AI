"""AI severity score derived from prediction label and model confidence."""

from typing import Literal

SeverityLabel = Literal["None", "Mild", "Moderate", "Severe"]


def compute_severity(prediction: str, confidence_pct: float) -> SeverityLabel:
    """
    Map prediction + confidence (0–100) to a severity label.

    - NORMAL → None
    - PNEUMONIA: <70 Mild, 70–89 Moderate, ≥90 Severe
    """
    label = prediction.strip().lower()
    if label in ("normal",):
        return "None"
    if label in ("pneumonia",):
        if confidence_pct < 70:
            return "Mild"
        if confidence_pct < 90:
            return "Moderate"
        return "Severe"
    return "None"
