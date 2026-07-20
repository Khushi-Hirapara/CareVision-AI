"""AI follow-up recommendation from prediction and severity."""

from app.schemas.predict import PredictionLabel, SeverityLabel

_FOLLOW_UP_NORMAL = (
    "Continue routine health monitoring.\n"
    "Consult a healthcare professional if symptoms persist."
)

_FOLLOW_UP_PNEUMONIA: dict[SeverityLabel, str] = {
    "Mild": (
        "Consult a clinician for clinical correlation.\n"
        "Consider repeat imaging if symptoms continue."
    ),
    "Moderate": (
        "Consult radiologist.\n"
        "Repeat X-ray after treatment."
    ),
    "Severe": (
        "Urgent medical evaluation is recommended.\n"
        "Consult radiologist promptly."
    ),
}


def build_follow_up_recommendation(
    prediction: PredictionLabel,
    severity: SeverityLabel,
) -> str:
    """Return follow-up guidance for the given prediction and severity."""
    if prediction == "Normal":
        return _FOLLOW_UP_NORMAL

    if prediction == "Pneumonia":
        if severity in _FOLLOW_UP_PNEUMONIA:
            return _FOLLOW_UP_PNEUMONIA[severity]
        return _FOLLOW_UP_PNEUMONIA["Mild"]

    return _FOLLOW_UP_NORMAL
