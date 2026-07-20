"""AI follow-up recommendation from prediction and severity."""

from app.schemas.predict import PredictionLabel, SeverityLabel

_FOLLOW_UP_NORMAL = (
    "Continue routine health monitoring. Consult a healthcare professional if symptoms persist."
)

_FOLLOW_UP_PNEUMONIA: dict[SeverityLabel, str] = {
    "Mild": (
        "Consult a healthcare professional for clinical correlation. "
        "Follow-up may be needed if symptoms continue."
    ),
    "Moderate": (
        "Medical consultation is recommended. A follow-up chest X-ray may be considered "
        "based on doctor's advice."
    ),
    "Severe": (
        "Urgent medical evaluation is recommended. Please consult a qualified healthcare "
        "professional as soon as possible."
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
