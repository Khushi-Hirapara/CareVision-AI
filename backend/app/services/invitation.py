"""Patient invitation lifecycle."""

import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.invitation_status import ACCEPTED, CANCELLED, EXPIRED, PENDING
from app.core.roles import PATIENT
from app.core.security import get_password_hash
from app.models.patient import Patient
from app.models.patient_invitation import PatientInvitation
from app.models.user import User
from app.schemas.patient import CreateInvitationRequest
from app.core.email_delivery import SKIPPED
from app.services.email import (
    EmailDeliveryResult,
    build_invitation_accept_url,
    send_invitation_email,
)
from app.services.user import get_user_by_email

logger = logging.getLogger(__name__)


class InvitationNotFoundError(LookupError):
    pass


class InvitationValidationError(ValueError):
    pass


class EmailAlreadyRegisteredError(ValueError):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _expire_if_needed(db: Session, invitation: PatientInvitation) -> PatientInvitation:
    if invitation.status == PENDING and invitation.expires_at < _utcnow():
        invitation.status = EXPIRED
        db.commit()
        db.refresh(invitation)
    return invitation


def get_invitation_by_token(db: Session, token: str) -> PatientInvitation | None:
    return (
        db.query(PatientInvitation)
        .filter(PatientInvitation.token == token.strip())
        .first()
    )


def get_invitation_for_doctor(
    db: Session,
    *,
    invitation_id: int,
    doctor_id: int,
) -> PatientInvitation | None:
    return (
        db.query(PatientInvitation)
        .filter(
            PatientInvitation.id == invitation_id,
            PatientInvitation.doctor_id == doctor_id,
        )
        .first()
    )


def _list_invitations_by_status(
    db: Session,
    *,
    doctor_id: int,
    status: str,
) -> list[PatientInvitation]:
    invitations = (
        db.query(PatientInvitation)
        .filter(
            PatientInvitation.doctor_id == doctor_id,
            PatientInvitation.status == status,
        )
        .order_by(desc(PatientInvitation.created_at))
        .all()
    )
    if status == PENDING:
        return [_expire_if_needed(db, inv) for inv in invitations]
    return invitations


def list_invitations_grouped_for_doctor(
    db: Session,
    doctor_id: int,
) -> dict[str, list[PatientInvitation]]:
    pending = _list_invitations_by_status(db, doctor_id=doctor_id, status=PENDING)
    return {
        PENDING: [inv for inv in pending if inv.status == PENDING],
        ACCEPTED: _list_invitations_by_status(db, doctor_id=doctor_id, status=ACCEPTED),
        EXPIRED: _list_invitations_by_status(db, doctor_id=doctor_id, status=EXPIRED),
        CANCELLED: _list_invitations_by_status(db, doctor_id=doctor_id, status=CANCELLED),
    }


def get_invitation_preview(db: Session, token: str) -> PatientInvitation:
    invitation = get_invitation_by_token(db, token)
    if invitation is None:
        raise InvitationNotFoundError("Invalid invitation link.")
    invitation = _expire_if_needed(db, invitation)
    if invitation.status != PENDING:
        raise InvitationValidationError(f"This invitation is {invitation.status}.")
    return invitation


def _apply_email_delivery_result(
    invitation: PatientInvitation,
    result: EmailDeliveryResult,
) -> None:
    invitation.email_status = result.status
    invitation.email_error_log = result.error_message if result.failed else None


def _deliver_invitation_email(
    db: Session,
    settings: Settings,
    invitation: PatientInvitation,
    *,
    doctor_name: str,
) -> EmailDeliveryResult:
    patient_name = invitation.patient_name or invitation.email.split("@")[0] or "Patient"
    accept_url = build_invitation_accept_url(settings, invitation.token)
    result = send_invitation_email(
        settings,
        to_email=invitation.email,
        patient_name=patient_name,
        doctor_name=doctor_name,
        accept_url=accept_url,
    )
    _apply_email_delivery_result(invitation, result)
    db.commit()
    db.refresh(invitation)

    if result.failed:
        logger.warning(
            "Invitation id=%s email_status=failed accept_url=%s",
            invitation.id,
            accept_url,
        )
    elif result.status == SKIPPED:
        logger.info(
            "Invitation id=%s email_status=skipped accept_url=%s",
            invitation.id,
            accept_url,
        )
    return result


def _invitation_response_message(result: EmailDeliveryResult) -> str:
    if result.succeeded:
        return "Patient invitation sent."
    if result.status == SKIPPED:
        return (
            "Invitation created. Email was not sent (SMTP is not configured); "
            "share the accept link with the patient manually."
        )
    return (
        "Invitation created but the email could not be delivered. "
        "You may resend from the dashboard or share the accept link manually."
    )


def create_invitation(
    db: Session,
    settings: Settings,
    *,
    doctor_id: int,
    doctor_name: str,
    invite_in: CreateInvitationRequest,
) -> tuple[PatientInvitation, str]:
    email = _normalize_email(str(invite_in.patient_email))
    patient_name = (invite_in.patient_name or email.split("@")[0] or "Patient").strip()

    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(
            "An account with this email already exists. The patient can sign in instead."
        )

    existing_pending = (
        db.query(PatientInvitation)
        .filter(
            PatientInvitation.doctor_id == doctor_id,
            PatientInvitation.email == email,
            PatientInvitation.status == PENDING,
        )
        .first()
    )
    if existing_pending is not None:
        raise InvitationValidationError(
            "A pending invitation already exists for this email."
        )

    token = secrets.token_urlsafe(32)
    expires_at = _utcnow() + timedelta(days=settings.invitation_expire_days)

    invitation = PatientInvitation(
        doctor_id=doctor_id,
        patient_name=patient_name,
        email=email,
        token=token,
        status=PENDING,
        expires_at=expires_at,
    )
    db.add(invitation)
    db.commit()
    db.refresh(invitation)

    result = _deliver_invitation_email(db, settings, invitation, doctor_name=doctor_name)
    return invitation, _invitation_response_message(result)


def resend_invitation(
    db: Session,
    settings: Settings,
    *,
    invitation_id: int,
    doctor_id: int,
    doctor_name: str,
) -> tuple[PatientInvitation, str]:
    invitation = get_invitation_for_doctor(
        db, invitation_id=invitation_id, doctor_id=doctor_id
    )
    if invitation is None:
        raise InvitationNotFoundError("Invitation not found.")

    invitation = _expire_if_needed(db, invitation)
    if invitation.status == ACCEPTED:
        raise InvitationValidationError("Accepted invitations cannot be resent.")
    if invitation.status == CANCELLED:
        raise InvitationValidationError("Cancelled invitations cannot be resent.")

    invitation.token = secrets.token_urlsafe(32)
    invitation.status = PENDING
    invitation.expires_at = _utcnow() + timedelta(days=settings.invitation_expire_days)
    invitation.accepted_at = None
    invitation.email_status = None
    invitation.email_error_log = None
    db.commit()
    db.refresh(invitation)

    result = _deliver_invitation_email(db, settings, invitation, doctor_name=doctor_name)
    return invitation, _invitation_response_message(result)


def cancel_invitation(
    db: Session,
    *,
    invitation_id: int,
    doctor_id: int,
) -> PatientInvitation:
    invitation = get_invitation_for_doctor(
        db, invitation_id=invitation_id, doctor_id=doctor_id
    )
    if invitation is None:
        raise InvitationNotFoundError("Invitation not found.")
    if invitation.status != PENDING:
        raise InvitationValidationError("Only pending invitations can be cancelled.")
    invitation.status = CANCELLED
    db.commit()
    db.refresh(invitation)
    return invitation


def _find_or_create_patient_profile(
    db: Session,
    *,
    doctor_id: int,
    email: str,
    name: str,
) -> Patient:
    existing = (
        db.query(Patient)
        .filter(
            Patient.doctor_id == doctor_id,
            Patient.email == email,
            Patient.user_id.is_(None),
        )
        .first()
    )
    if existing is not None:
        existing.name = name
        return existing

    patient = Patient(
        doctor_id=doctor_id,
        name=name,
        email=email,
    )
    db.add(patient)
    db.flush()
    return patient


def accept_invitation(
    db: Session,
    *,
    token: str,
    password: str,
    name: str,
) -> tuple[User, Patient]:
    invitation = get_invitation_by_token(db, token)
    if invitation is None:
        raise InvitationNotFoundError("Invalid invitation link.")

    invitation = _expire_if_needed(db, invitation)
    if invitation.status != PENDING:
        raise InvitationValidationError(f"This invitation is {invitation.status}.")

    email = invitation.email
    if get_user_by_email(db, email) is not None:
        raise EmailAlreadyRegisteredError(
            "An account with this email already exists. Please sign in instead."
        )

    display_name = (name or invitation.patient_name or email.split("@")[0] or "Patient").strip()

    user = User(
        name=display_name,
        email=email,
        hashed_password=get_password_hash(password),
        role=PATIENT,
    )
    db.add(user)
    db.flush()

    patient = _find_or_create_patient_profile(
        db,
        doctor_id=invitation.doctor_id,
        email=email,
        name=display_name,
    )
    patient.user_id = user.id

    invitation.status = ACCEPTED
    invitation.accepted_at = _utcnow()

    db.commit()
    db.refresh(user)
    db.refresh(patient)
    return user, patient
