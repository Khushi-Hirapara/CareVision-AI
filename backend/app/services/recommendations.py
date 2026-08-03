"""
Safe clinical recommendation text for AI screening results.

Used by /predict and stored on each scan; never states a final diagnosis.
"""

from app.schemas.predict import PredictionLabel

MEDICAL_DISCLAIMER = (
    "Medical disclaimer: This result is AI-assisted preliminary screening only and is "
    "not a final diagnosis. A qualified healthcare professional must interpret these "
    "findings in the context of the full clinical picture."
)


def build_recommendation(prediction: PredictionLabel) -> str:
    """Return recommendation text with required guidance and medical disclaimer."""
    if prediction == "Normal":
        guidance = (
            "No obvious pneumonia or COVID-like pattern was detected on this chest X-ray "
            "screening. If you have symptoms such as cough, fever, shortness of breath, or "
            "chest discomfort, please consult a doctor for further evaluation."
        )
    elif prediction == "COVID":
        guidance = (
            "A possible COVID-19–related pattern was detected on this chest X-ray screening. "
            "Please consult a qualified doctor or radiologist promptly for professional "
            "review and next steps. Seek emergency care immediately if you have severe "
            "symptoms such as breathing difficulty, chest pain, or high fever."
        )
    else:
        guidance = (
            "A possible pneumonia pattern was detected on this chest X-ray screening. "
            "Please consult a qualified doctor or radiologist promptly for professional "
            "review and next steps. Seek emergency care immediately if you have severe "
            "symptoms such as breathing difficulty, chest pain, or high fever."
        )

    return f"{guidance}\n\n{MEDICAL_DISCLAIMER}"
