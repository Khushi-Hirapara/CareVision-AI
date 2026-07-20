"""Doctor notes on scans."""

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.models.scan import Scan
from app.models.scan_note import ScanNote
from app.services.scan_access import (
    get_scan_for_doctor_managed_patient,
    get_scan_for_patient_user,
)

# Re-export for routes that import from scan_note.
__all__ = [
    "get_scan_for_doctor_managed_patient",
    "create_scan_note",
    "delete_scan_note",
    "get_note_for_doctor",
    "list_notes_for_scan",
    "list_notes_for_scan_report",
    "update_scan_note",
]


def list_notes_for_scan(db: Session, scan_id: int) -> list[ScanNote]:
    return (
        db.query(ScanNote)
        .filter(ScanNote.scan_id == scan_id)
        .order_by(desc(ScanNote.created_at))
        .all()
    )


def list_notes_for_scan_report(db: Session, scan_id: int) -> list[ScanNote]:
    """Load doctor notes with author names for PDF reports."""
    return (
        db.query(ScanNote)
        .options(joinedload(ScanNote.doctor))
        .filter(ScanNote.scan_id == scan_id)
        .order_by(desc(ScanNote.created_at))
        .all()
    )


def create_scan_note(
    db: Session,
    *,
    scan_id: int,
    doctor_id: int,
    note_text: str,
) -> ScanNote:
    note = ScanNote(
        scan_id=scan_id,
        doctor_id=doctor_id,
        note_text=note_text.strip(),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def get_note_for_doctor(
    db: Session,
    *,
    note_id: int,
    scan_id: int,
    doctor_id: int,
) -> ScanNote | None:
    return (
        db.query(ScanNote)
        .filter(
            ScanNote.id == note_id,
            ScanNote.scan_id == scan_id,
            ScanNote.doctor_id == doctor_id,
        )
        .first()
    )


def update_scan_note(db: Session, note: ScanNote, note_text: str) -> ScanNote:
    note.note_text = note_text.strip()
    db.commit()
    db.refresh(note)
    return note


def delete_scan_note(db: Session, note: ScanNote) -> None:
    db.delete(note)
    db.commit()
