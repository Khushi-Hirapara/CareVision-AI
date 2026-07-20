"""Legacy /predict route — use POST /patients/{patient_id}/predict instead."""

import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.deps import require_doctor
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/predict", deprecated=True)
async def predict_xray_deprecated(
    file: UploadFile = File(...),
    current_user: User = Depends(require_doctor),
) -> None:
    """
    Deprecated. Doctors must analyze via POST /patients/{patient_id}/predict
    after selecting an accepted patient.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=(
            "Select a patient and use POST /patients/{patient_id}/predict "
            "to analyze chest X-rays."
        ),
    )
