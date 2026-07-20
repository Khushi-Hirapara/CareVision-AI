from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_doctor
from app.database import get_db
from app.models.user import User
from app.schemas.scan_note import (
    ScanNoteCreate,
    ScanNoteListResponse,
    ScanNoteResponse,
    ScanNoteUpdate,
)
from app.services.scan_access import get_scan_for_doctor_managed_patient
from app.services.scan_note import (
    create_scan_note,
    delete_scan_note,
    get_note_for_doctor,
    list_notes_for_scan,
    update_scan_note,
)

router = APIRouter(prefix="/scans", tags=["scan-notes"])


def _scan_not_found(scan_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scan {scan_id} not found.",
    )


def _note_not_found(note_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Note {note_id} not found.",
    )


@router.get("/{scan_id}/notes", response_model=ScanNoteListResponse)
def get_scan_notes(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanNoteListResponse:
    """List doctor notes for a scan belonging to one of the doctor's patients."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    notes = list_notes_for_scan(db, scan.id)
    return ScanNoteListResponse(
        items=[ScanNoteResponse.model_validate(note) for note in notes],
    )


@router.post(
    "/{scan_id}/notes",
    response_model=ScanNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note(
    scan_id: int,
    body: ScanNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanNoteResponse:
    """Add a doctor note to a scan for one of the doctor's patients."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    note = create_scan_note(
        db,
        scan_id=scan.id,
        doctor_id=current_user.id,
        note_text=body.note_text,
    )
    return ScanNoteResponse.model_validate(note)


@router.put("/{scan_id}/notes/{note_id}", response_model=ScanNoteResponse)
def update_note(
    scan_id: int,
    note_id: int,
    body: ScanNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanNoteResponse:
    """Update a doctor note owned by the authenticated doctor."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    note = get_note_for_doctor(
        db,
        note_id=note_id,
        scan_id=scan.id,
        doctor_id=current_user.id,
    )
    if note is None:
        raise _note_not_found(note_id)

    updated = update_scan_note(db, note, body.note_text)
    return ScanNoteResponse.model_validate(updated)


@router.delete(
    "/{scan_id}/notes/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_note(
    scan_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> None:
    """Delete a doctor note owned by the authenticated doctor."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    note = get_note_for_doctor(
        db,
        note_id=note_id,
        scan_id=scan.id,
        doctor_id=current_user.id,
    )
    if note is None:
        raise _note_not_found(note_id)

    delete_scan_note(db, note)
