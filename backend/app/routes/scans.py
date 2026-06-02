from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.scan import ScanListResponse, ScanResponse
from app.services.pdf_report import generate_scan_report_pdf
from app.services.scan import get_scan_by_id, list_scans

router = APIRouter(prefix="/scans", tags=["scans"])


@router.get("", response_model=ScanListResponse)
def get_scans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> ScanListResponse:
    """List chest X-ray scan history, newest first."""
    scans = list_scans(db, skip=skip, limit=limit)
    return ScanListResponse(
        items=[ScanResponse.model_validate(scan) for scan in scans],
        total=len(scans),
    )


@router.get("/{scan_id}/report")
def download_scan_report(
    scan_id: int,
    db: Session = Depends(get_db),
) -> Response:
    """Generate and download a PDF report for a scan."""
    scan = get_scan_by_id(db, scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan {scan_id} not found.",
        )

    try:
        pdf_bytes = generate_scan_report_pdf(scan)
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
) -> ScanResponse:
    """Get a single scan record by id."""
    scan = get_scan_by_id(db, scan_id)
    if scan is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan {scan_id} not found.",
        )
    return ScanResponse.model_validate(scan)
