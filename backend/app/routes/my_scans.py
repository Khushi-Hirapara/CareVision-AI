from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.deps import require_patient
from app.database import get_db
from app.models.user import User
from app.schemas.ai_chat import AiChatRequest, AiChatResponse
from app.schemas.scan import ScanListResponse, ScanResponse
from app.schemas.scan_note import ScanNoteListResponse, ScanNoteResponse
from app.services.ai_chat import generate_scan_chat_answer
from app.services.pdf_report import generate_scan_report_pdf
from app.services.patient import get_patient_by_user_id
from app.services.scan import count_scans_for_patient, list_scans_for_patient
from app.services.scan_access import get_scan_for_patient_profile
from app.services.scan_note import list_notes_for_scan, list_notes_for_scan_report

router = APIRouter(prefix="/my", tags=["my-scans"])


def _scan_not_found(scan_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scan {scan_id} not found.",
    )


def _require_linked_patient(db: Session, current_user: User):
    patient = get_patient_by_user_id(db, current_user.id)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No patient profile is linked to this account.",
        )
    return patient


@router.get("/scans", response_model=ScanListResponse)
def get_my_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> ScanListResponse:
    """List scan history for the authenticated patient."""
    patient = _require_linked_patient(db, current_user)
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


@router.get("/scans/{scan_id}/report")
def download_my_scan_report(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> Response:
    """Download the PDF report for a scan belonging to the authenticated patient."""
    patient = _require_linked_patient(db, current_user)
    scan = get_scan_for_patient_profile(db, scan_id, patient.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    try:
        notes = list_notes_for_scan_report(db, scan.id)
        pdf_bytes = generate_scan_report_pdf(scan, notes=notes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF report.",
        ) from exc

    filename = f"carevision-scan-{scan_id}-report.pdf"
    disposition = f'attachment; filename="{filename}"'
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": disposition},
    )


@router.get("/scans/{scan_id}", response_model=ScanResponse)
def get_my_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> ScanResponse:
    """Get a single scan record belonging to the authenticated patient."""
    patient = _require_linked_patient(db, current_user)
    scan = get_scan_for_patient_profile(db, scan_id, patient.id)
    if scan is None:
        raise _scan_not_found(scan_id)
    return ScanResponse.model_validate(scan)


@router.get("/scans/{scan_id}/notes", response_model=ScanNoteListResponse)
def get_my_scan_notes(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> ScanNoteListResponse:
    """List doctor notes on a scan (read-only for the patient)."""
    patient = _require_linked_patient(db, current_user)
    scan = get_scan_for_patient_profile(db, scan_id, patient.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    notes = list_notes_for_scan(db, scan.id)
    return ScanNoteListResponse(
        items=[ScanNoteResponse.model_validate(note) for note in notes],
    )


@router.post("/scans/{scan_id}/ai-chat", response_model=AiChatResponse)
def my_scan_ai_chat(
    scan_id: int,
    body: AiChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_patient),
) -> AiChatResponse:
    """Explain saved scan results (patient's own scans only)."""
    patient = _require_linked_patient(db, current_user)
    scan = get_scan_for_patient_profile(db, scan_id, patient.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    notes = list_notes_for_scan_report(db, scan.id)
    answer = generate_scan_chat_answer(scan, notes, body.message.strip())
    return AiChatResponse(answer=answer)
