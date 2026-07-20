import logging

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.deps import require_doctor
from app.core.http_errors import error_detail
from app.core.invitation_status import ACCEPTED, CANCELLED, EXPIRED, PENDING
from app.database import get_db
from app.models.user import User
from app.schemas.patient import (
    CancelInvitationResponse,
    CreateInvitationRequest,
    CreateInvitationResponse,
    InvitationStatusGroup,
    PatientCreate,
    PatientInvitationResponse,
    PatientInvitationsGroupedResponse,
    PatientListResponse,
    PatientResponse,
    PatientUpdate,
    ResendInvitationResponse,
)
from app.schemas.predict import PredictResponse
from app.schemas.scan import ScanListResponse, ScanResponse
from app.services.invitation import (
    EmailAlreadyRegisteredError,
    InvitationNotFoundError,
    InvitationValidationError,
    cancel_invitation,
    create_invitation,
    list_invitations_grouped_for_doctor,
    resend_invitation,
)
from app.services.patient import (
    count_accepted_patients_for_doctor,
    create_patient,
    delete_patient,
    get_accepted_patient_for_doctor,
    get_patient_for_doctor,
    list_accepted_patients,
    update_patient,
)
from app.services.pdf_report import generate_scan_report_pdf
from app.services.predict_response import build_predict_response
from app.services.prediction import run_prediction
from app.services.scan import (
    count_scans_for_patient,
    create_scan_from_prediction,
    list_scans_for_patient,
)
from app.services.upload import save_xray_upload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/patients", tags=["patients"])


def _patient_not_found(patient_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Patient {patient_id} not found.",
    )


def _invitation_not_found() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Invitation not found.",
    )


def _map_invitation_service_error(exc: Exception) -> HTTPException:
    if isinstance(exc, InvitationNotFoundError):
        return _invitation_not_found()
    if isinstance(exc, EmailAlreadyRegisteredError):
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        )
    if isinstance(exc, InvitationValidationError):
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc),
    )


def _build_grouped_invitations(
    grouped: dict[str, list],
) -> PatientInvitationsGroupedResponse:
    def group(status_key: str) -> InvitationStatusGroup:
        items = grouped[status_key]
        return InvitationStatusGroup(
            items=[PatientInvitationResponse.model_validate(i) for i in items],
            total=len(items),
        )

    return PatientInvitationsGroupedResponse(
        pending=group(PENDING),
        accepted=group(ACCEPTED),
        expired=group(EXPIRED),
        cancelled=group(CANCELLED),
    )


# --- Invitation management (doctor only) ---


@router.post(
    "/invitations",
    response_model=CreateInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_patient_invitation(
    body: CreateInvitationRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(require_doctor),
) -> CreateInvitationResponse:
    """Send a patient portal invitation by email."""
    try:
        invitation, message = create_invitation(
            db,
            settings,
            doctor_id=current_user.id,
            doctor_name=current_user.name,
            invite_in=body,
        )
    except Exception as exc:
        raise _map_invitation_service_error(exc) from exc
    return CreateInvitationResponse(
        message=message,
        invitation=PatientInvitationResponse.model_validate(invitation),
    )


@router.get("/invitations", response_model=PatientInvitationsGroupedResponse)
def list_patient_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PatientInvitationsGroupedResponse:
    """List invitations grouped by status (separate from accepted patient profiles)."""
    grouped = list_invitations_grouped_for_doctor(db, current_user.id)
    return _build_grouped_invitations(grouped)


@router.post(
    "/invitations/{invitation_id}/resend",
    response_model=ResendInvitationResponse,
)
def resend_patient_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
    current_user: User = Depends(require_doctor),
) -> ResendInvitationResponse:
    """Resend a pending or expired invitation (regenerates token and expiry)."""
    try:
        invitation, message = resend_invitation(
            db,
            settings,
            invitation_id=invitation_id,
            doctor_id=current_user.id,
            doctor_name=current_user.name,
        )
    except Exception as exc:
        raise _map_invitation_service_error(exc) from exc
    return ResendInvitationResponse(
        message=message,
        invitation=PatientInvitationResponse.model_validate(invitation),
    )


@router.post(
    "/invitations/{invitation_id}/cancel",
    response_model=CancelInvitationResponse,
)
def cancel_patient_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> CancelInvitationResponse:
    """Cancel a pending invitation."""
    try:
        invitation = cancel_invitation(
            db,
            invitation_id=invitation_id,
            doctor_id=current_user.id,
        )
    except Exception as exc:
        raise _map_invitation_service_error(exc) from exc
    return CancelInvitationResponse(
        message="Invitation cancelled",
        invitation=PatientInvitationResponse.model_validate(invitation),
    )


# --- Patient profiles (doctor only) ---


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient_record(
    body: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PatientResponse:
    """Create a clinical patient profile (no portal until invitation is accepted)."""
    patient = create_patient(db, doctor_id=current_user.id, patient_in=body)
    return PatientResponse.model_validate(patient)


@router.get("", response_model=PatientListResponse)
def get_patients(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PatientListResponse:
    """List accepted patients (portal accounts linked to this doctor)."""
    patients = list_accepted_patients(
        db,
        doctor_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    total = count_accepted_patients_for_doctor(db, current_user.id)
    return PatientListResponse(
        items=[PatientResponse.model_validate(patient) for patient in patients],
        total=total,
    )


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PatientResponse:
    """Get a single accepted patient record owned by the authenticated doctor."""
    patient = get_accepted_patient_for_doctor(db, patient_id, current_user.id)
    if patient is None:
        raise _patient_not_found(patient_id)
    return PatientResponse.model_validate(patient)


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient_record(
    patient_id: int,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PatientResponse:
    """Update a patient record owned by the authenticated doctor."""
    patient = get_patient_for_doctor(db, patient_id, current_user.id)
    if patient is None:
        raise _patient_not_found(patient_id)

    updated = update_patient(db, patient=patient, patient_in=body)
    return PatientResponse.model_validate(updated)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient_record(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> None:
    """Delete a patient record owned by the authenticated doctor."""
    patient = get_patient_for_doctor(db, patient_id, current_user.id)
    if patient is None:
        raise _patient_not_found(patient_id)
    delete_patient(db, patient)


@router.post("/{patient_id}/predict", response_model=PredictResponse)
async def predict_for_patient(
    patient_id: int,
    file: UploadFile = File(..., description="Chest X-ray image (PNG or JPEG)."),
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> PredictResponse:
    """Upload and analyze a chest X-ray for an accepted patient of the doctor."""
    patient = get_accepted_patient_for_doctor(db, patient_id, current_user.id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Patient {patient_id} was not found or has not accepted the "
                "portal invitation yet."
            ),
        )

    try:
        image_path = await save_xray_upload(file, settings)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to save uploaded X-ray")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Upload save failed"),
        ) from exc

    try:
        result = run_prediction(image_path, settings)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error during prediction")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail(settings, exc, context="Prediction failed"),
        ) from exc

    try:
        scan = create_scan_from_prediction(
            db,
            user_id=current_user.id,
            patient_id=patient.id,
            patient_name=patient.name,
            result=result,
            model_version=settings.model_version,
        )
    except SQLAlchemyError as exc:
        logger.exception("Prediction succeeded but scan could not be saved")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=error_detail(
                settings,
                exc,
                context="Prediction succeeded but scan could not be saved",
            ),
        ) from exc

    return build_predict_response(scan, result)


@router.get("/{patient_id}/scans", response_model=ScanListResponse)
def get_patient_scans(
    patient_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanListResponse:
    """List scan history for a patient managed by the authenticated doctor."""
    patient = get_patient_for_doctor(db, patient_id, current_user.id)
    if patient is None:
        raise _patient_not_found(patient_id)

    scans = list_scans_for_patient(
        db,
        patient_id=patient.id,
        skip=skip,
        limit=limit,
    )
    total = count_scans_for_patient(db, patient.id)
    return ScanListResponse(
        items=[ScanResponse.model_validate(scan) for scan in scans],
        total=total,
    )
