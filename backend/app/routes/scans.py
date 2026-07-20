from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.deps import require_doctor
from app.database import get_db
from app.models.user import User
from app.schemas.scan import ScanListResponse, ScanResponse
from app.services.pdf_report import generate_scan_report_pdf
from app.services.scan_access import (
    count_scans_for_doctor_managed_patients,
    get_scan_for_doctor_managed_patient,
    list_scans_for_doctor_managed_patients,
)
from app.services.scan_note import list_notes_for_scan_report

router = APIRouter(prefix="/scans", tags=["scans"])


def _scan_not_found(scan_id: int) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Scan {scan_id} not found.",
    )


@router.get("", response_model=ScanListResponse)
def get_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanListResponse:
    """List scans for patients managed by the authenticated doctor."""
    scans = list_scans_for_doctor_managed_patients(
        db,
        doctor_id=current_user.id,
        skip=skip,
        limit=limit,
    )
    total = count_scans_for_doctor_managed_patients(db, current_user.id)
    return ScanListResponse(
        items=[ScanResponse.model_validate(scan) for scan in scans],
        total=total,
    )


@router.get("/{scan_id}/report")
def download_scan_report(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> Response:
    """Download PDF report for a scan belonging to one of the doctor's patients."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
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
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor),
) -> ScanResponse:
    """Get a scan record for one of the doctor's patients."""
    scan = get_scan_for_doctor_managed_patient(db, scan_id, current_user.id)
    if scan is None:
        raise _scan_not_found(scan_id)
    return ScanResponse.model_validate(scan)
