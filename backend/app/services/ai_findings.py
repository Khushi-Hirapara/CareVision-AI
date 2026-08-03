"""Clinical-style AI findings summary from prediction and severity."""

from app.schemas.predict import PredictionLabel, SeverityLabel

AI_SCREENING_DISCLAIMER = (
    "This is an AI-assisted screening result and does not replace professional medical diagnosis."
)

_FINDINGS_NORMAL = (
    "No pneumonia-like or COVID-like opacity pattern was identified on this chest X-ray "
    "screening. Clinical correlation is recommended if symptoms are present."
)

_FINDINGS_PNEUMONIA: dict[SeverityLabel, str] = {
    "Mild": (
        "Pattern may be consistent with early or mild pneumonia-like changes. "
        "Clinical correlation is recommended."
    ),
    "Moderate": (
        "Pattern is consistent with possible bacterial pneumonia. "
        "Clinical correlation is recommended."
    ),
    "Severe": (
        "Pattern strongly suggests significant pneumonia-like opacity. "
        "Urgent clinical correlation is recommended."
    ),
}

_FINDINGS_COVID: dict[SeverityLabel, str] = {
    "Mild": (
        "Pattern may be consistent with early or mild COVID-19–related changes. "
        "Clinical correlation is recommended."
    ),
    "Moderate": (
        "Pattern is consistent with possible COVID-19–related opacity. "
        "Clinical correlation is recommended."
    ),
    "Severe": (
        "Pattern strongly suggests significant COVID-19–related opacity. "
        "Urgent clinical correlation is recommended."
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

    if prediction == "COVID":
        if severity in _FINDINGS_COVID:
            return _FINDINGS_COVID[severity]
        return _FINDINGS_COVID["Mild"]

    return _FINDINGS_NORMAL
