"""Clinical-style AI findings summary from prediction and severity."""

from app.schemas.predict import PredictionLabel, SeverityLabel

AI_SCREENING_DISCLAIMER = (
    "This is an AI-assisted screening result and does not replace professional medical diagnosis."
)

_FINDINGS_NORMAL = (
    "AI analysis does not show obvious pneumonia-like opacity patterns in this chest X-ray."
)

_FINDINGS_PNEUMONIA: dict[SeverityLabel, str] = {
    "Mild": (
        "AI analysis detected mild pneumonia-like opacity patterns. "
        "Findings may require clinical correlation."
    ),
    "Moderate": (
        "AI analysis detected moderate pneumonia-like opacity patterns with noticeable "
        "abnormal lung opacity."
    ),
    "Severe": (
        "AI analysis detected strong pneumonia-like opacity patterns with high model confidence."
    ),
}


def build_ai_findings(prediction: PredictionLabel, severity: SeverityLabel) -> str:
    """Return a short findings summary for the given prediction and severity."""
    if prediction == "Normal":
        return _FINDINGS_NORMAL

    if prediction == "Pneumonia":
        if severity in _FINDINGS_PNEUMONIA:
            return _FINDINGS_PNEUMONIA[severity]
        return _FINDINGS_PNEUMONIA["Mild"]

    return _FINDINGS_NORMAL
