"""AI severity score derived from prediction label and model confidence."""

from app.schemas.predict import SeverityLabel
from app.services.prediction_labels import is_abnormal_prediction


def compute_severity(prediction: str, confidence_pct: float) -> SeverityLabel:
    """
    Map prediction + confidence (0–100) to a severity label.

    - NORMAL → None
    - PNEUMONIA / COVID: <70 Mild, 70–89 Moderate, ≥90 Severe
    """
    if not is_abnormal_prediction(prediction):
        return "None"
    if confidence_pct < 70:
        return "Mild"
    if confidence_pct < 90:
        return "Moderate"
    return "Severe"
