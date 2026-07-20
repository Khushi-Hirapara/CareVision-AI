from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_doctor
from app.database import get_db
from app.models.user import User
from app.schemas.ai_chat import AiChatRequest, AiChatResponse
from app.services.ai_chat import generate_scan_chat_answer
from app.services.scan_access import get_scan_for_doctor_managed_patient
from app.services.scan_note import list_notes_for_scan_report

router = APIRouter(prefix="/scans", tags=["ai-chat"])


def _scan_not_found(scan_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scan {scan_id} not found.",
    )


@router.post("/{scan_id}/ai-chat", response_model=AiChatResponse)
def scan_ai_chat(
    scan_id: int,
    body: AiChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> AiChatResponse:
    """Explain saved scan results for a patient managed by the doctor."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)

    notes = list_notes_for_scan_report(db, scan.id)
    answer = generate_scan_chat_answer(scan, notes, body.message.strip())
    return AiChatResponse(answer=answer)
