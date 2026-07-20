"""Public patient invitation acceptance (no authentication required)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database import get_db
from app.schemas.patient import (
    AcceptInvitationBody,
    AcceptInvitationResponse,
    InvitationAcceptPreviewResponse,
)
from app.services.invitation import (
    EmailAlreadyRegisteredError,
    InvitationNotFoundError,
    InvitationValidationError,
    accept_invitation,
    get_invitation_preview,
)

router = APIRouter(prefix="/patient-invitations", tags=["patient-invitations"])


def _map_invitation_error(exc: Exception) -> HTTPException:
    if isinstance(exc, InvitationNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, EmailAlreadyRegisteredError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if isinstance(exc, InvitationValidationError):
        return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc),
    )


@router.get("/accept/{token}", response_model=InvitationAcceptPreviewResponse)
def preview_accept_invitation(
    token: str,
    db: Session = Depends(get_db),
) -> InvitationAcceptPreviewResponse:
    """Validate token and return invitation details for the accept form."""
    try:
        invitation = get_invitation_preview(db, token)
    except Exception as exc:
        raise _map_invitation_error(exc) from exc

    doctor = invitation.doctor
    return InvitationAcceptPreviewResponse(
        email=invitation.email,
        patient_name=invitation.patient_name,
        doctor_name=doctor.name if doctor else "Your care team",
        status=invitation.status,
        expires_at=invitation.expires_at,
    )


@router.post("/accept/{token}", response_model=AcceptInvitationResponse)
def accept_invitation_by_token(
    token: str,
    body: AcceptInvitationBody,
    db: Session = Depends(get_db),
) -> AcceptInvitationResponse:
    """Accept invitation and create the patient portal account."""
    try:
        user, _patient = accept_invitation(
            db,
            token=token,
            password=body.password,
            name=body.name,
        )
    except Exception as exc:
        raise _map_invitation_error(exc) from exc

    access_token = create_access_token(subject=user.id)
    return AcceptInvitationResponse(
        message="Invitation accepted. You can now sign in to your patient portal.",
        access_token=access_token,
    )
