"""Generate PDF diagnostic reports for saved scans."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.core.config import PROJECT_ROOT
from app.models.scan import Scan
from app.models.scan_note import ScanNote
from app.services.ai_findings import AI_SCREENING_DISCLAIMER
from app.services.recommendations import MEDICAL_DISCLAIMER

# Clinical report palette
_TEAL_HEADER = colors.HexColor("#115e59")
_SLATE_900 = colors.HexColor("#0f172a")
_SLATE_700 = colors.HexColor("#334155")
_SLATE_600 = colors.HexColor("#475569")
_SLATE_500 = colors.HexColor("#64748b")
_SLATE_200 = colors.HexColor("#e2e8f0")
_SLATE_100 = colors.HexColor("#f1f5f9")
_SLATE_50 = colors.HexColor("#f8fafc")
_NORMAL_BG = colors.HexColor("#f0fdf4")
_NORMAL_TEXT = colors.HexColor("#166534")
_PNEUMONIA_BG = colors.HexColor("#fef2f2")
_PNEUMONIA_TEXT = colors.HexColor("#991b1b")
_SEVERITY_MILD_BG = colors.HexColor("#fffbeb")
_SEVERITY_MILD_TEXT = colors.HexColor("#92400e")
_SEVERITY_MODERATE_BG = colors.HexColor("#fff7ed")
_SEVERITY_MODERATE_TEXT = colors.HexColor("#9a3412")
_SEVERITY_SEVERE_BG = colors.HexColor("#fef2f2")
_SEVERITY_SEVERE_TEXT = colors.HexColor("#991b1b")
_WHITE = colors.white

_PAGE_WIDTH, _PAGE_HEIGHT = letter
_CONTENT_WIDTH = _PAGE_WIDTH - 1.5 * inch


def _resolve_storage_path(stored: str | None) -> Path | None:
    if not stored:
        return None
    path = Path(stored)
    if path.is_absolute():
        return path if path.is_file() else None
    full = PROJECT_ROOT / path
    return full if full.is_file() else None


def _format_datetime(dt: datetime) -> str:
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt.strftime("%B %d, %Y · %I:%M %p")


def _format_date(dt: datetime) -> str:
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt.strftime("%d %b %Y")


def _report_number(scan_id: int) -> str:
    return f"CV-{scan_id:06d}"


def _confidence_tier(pct: float) -> str:
    if pct >= 90:
        return "Very high"
    if pct >= 75:
        return "High"
    if pct >= 60:
        return "Moderate"
    return "Low"


def _scaled_image(path: Path, max_width: float, max_height: float) -> RLImage:
    img = RLImage(str(path))
    ratio = min(max_width / img.drawWidth, max_height / img.drawHeight, 1.0)
    img.drawWidth *= ratio
    img.drawHeight *= ratio
    img.hAlign = "CENTER"
    return img


def _styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "letterhead_title": ParagraphStyle(
            "LetterheadTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=_WHITE,
        ),
        "letterhead_sub": ParagraphStyle(
            "LetterheadSub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#ccfbf1"),
        ),
        "letterhead_meta": ParagraphStyle(
            "LetterheadMeta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#ccfbf1"),
            alignment=TA_RIGHT,
        ),
        "confidential": ParagraphStyle(
            "Confidential",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7,
            leading=9,
            textColor=_SLATE_500,
            alignment=TA_CENTER,
        ),
        "meta_label": ParagraphStyle(
            "MetaLabel",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7,
            leading=9,
            textColor=_SLATE_500,
        ),
        "meta_value": ParagraphStyle(
            "MetaValue",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=_SLATE_900,
        ),
        "section_title": ParagraphStyle(
            "SectionTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=_TEAL_HEADER,
            spaceBefore=2,
            spaceAfter=4,
        ),
        "field_label": ParagraphStyle(
            "FieldLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=_SLATE_600,
        ),
        "field_value": ParagraphStyle(
            "FieldValue",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=_SLATE_900,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=_SLATE_900,
        ),
        "impression": ParagraphStyle(
            "Impression",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=_SLATE_700,
        ),
        "image_caption": ParagraphStyle(
            "ImageCaption",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=_SLATE_600,
            alignment=TA_CENTER,
        ),
        "figure_label": ParagraphStyle(
            "FigureLabel",
            parent=base["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=8,
            leading=10,
            textColor=_SLATE_500,
            alignment=TA_CENTER,
        ),
        "disclaimer": ParagraphStyle(
            "Disclaimer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=_SLATE_600,
        ),
        "summary_label": ParagraphStyle(
            "SummaryLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=_SLATE_600,
        ),
        "summary_value": ParagraphStyle(
            "SummaryValue",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=_SLATE_900,
        ),
        "summary_value_large": ParagraphStyle(
            "SummaryValueLarge",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=16,
            textColor=_SLATE_900,
        ),
        "signature_label": ParagraphStyle(
            "SignatureLabel",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=_SLATE_500,
        ),
    }


def _letterhead(
    scan_id: int,
    generated_at: datetime,
    styles: dict[str, ParagraphStyle],
) -> Table:
    report_no = _report_number(scan_id)
    left = [
        Paragraph("CareVision AI", styles["letterhead_title"]),
        Paragraph(
            "Chest X-Ray · AI-Assisted Screening Report",
            styles["letterhead_sub"],
        ),
    ]
    right = Paragraph(
        f"<b>Report No.</b> {report_no}<br/>"
        f"<b>Issued</b> {_format_date(generated_at)}<br/>"
        f"<b>Time</b> {generated_at.strftime('%I:%M %p')}",
        styles["letterhead_meta"],
    )
    band = Table([[left, right]], colWidths=[4.1 * inch, 2.4 * inch])
    band.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _TEAL_HEADER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (0, 0), 16),
                ("RIGHTPADDING", (1, 0), (1, 0), 16),
                ("TOPPADDING", (0, 0), (-1, -1), 14),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
            ]
        )
    )
    return band


def _confidential_strip(styles: dict[str, ParagraphStyle]) -> Table:
    table = Table(
        [[Paragraph("CONFIDENTIAL — FOR CLINICAL USE ONLY", styles["confidential"])]],
        colWidths=[_CONTENT_WIDTH],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _SLATE_100),
                ("BOX", (0, 0), (-1, -1), 0.25, _SLATE_200),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return table


def _meta_strip(
    rows: list[tuple[str, str]],
    styles: dict[str, ParagraphStyle],
) -> Table:
    """Horizontal key facts row (4 columns)."""
    cells: list[list[Paragraph]] = [[]]
    for label, value in rows:
        cells[0].append(
            Paragraph(
                f'<font size="7" color="#64748b">{escape(label.upper())}</font><br/>'
                f"<b>{escape(value)}</b>",
                styles["meta_value"],
            )
        )
    col_w = _CONTENT_WIDTH / max(len(rows), 1)
    table = Table(cells, colWidths=[col_w] * len(rows))
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, _SLATE_200),
                ("BACKGROUND", (0, 0), (-1, -1), _WHITE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def _section_title(title: str, styles: dict[str, ParagraphStyle]) -> list:
    return [
        Spacer(1, 0.1 * inch),
        Paragraph(title.upper(), styles["section_title"]),
        HRFlowable(width="100%", thickness=0.5, color=_SLATE_200, spaceAfter=6),
    ]


def _info_grid(rows: list[tuple[str, str]], styles: dict[str, ParagraphStyle]) -> Table:
    data: list[list[Paragraph]] = []
    for label, value in rows:
        data.append(
            [
                Paragraph(label, styles["field_label"]),
                Paragraph(escape(value), styles["field_value"]),
            ]
        )
    table = Table(data, colWidths=[1.65 * inch, _CONTENT_WIDTH - 1.65 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, _SLATE_200),
                ("BACKGROUND", (0, 0), (0, -1), _SLATE_50),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def _severity_colors(severity: str) -> tuple[colors.Color, colors.Color, colors.Color]:
    key = severity.strip().lower()
    if key == "mild":
        return _SEVERITY_MILD_BG, _SEVERITY_MILD_TEXT, _SEVERITY_MILD_TEXT
    if key == "moderate":
        return _SEVERITY_MODERATE_BG, _SEVERITY_MODERATE_TEXT, _SEVERITY_MODERATE_TEXT
    if key == "severe":
        return _SEVERITY_SEVERE_BG, _SEVERITY_SEVERE_TEXT, _SEVERITY_SEVERE_TEXT
    return _SLATE_50, _SLATE_600, _SLATE_200


def _diagnostic_summary_table(
    prediction: str,
    confidence_pct: float,
    severity: str,
    model_version: str,
    styles: dict[str, ParagraphStyle],
) -> Table:
    is_pneumonia = prediction.strip().lower() == "pneumonia"
    finding_bg = _PNEUMONIA_BG if is_pneumonia else _NORMAL_BG
    finding_fg = _PNEUMONIA_TEXT if is_pneumonia else _NORMAL_TEXT
    finding_display = prediction.strip().title()
    if is_pneumonia:
        finding_sub = "AI pattern consistent with pneumonia"
    else:
        finding_sub = "No pneumonia pattern detected by AI"

    tier = _confidence_tier(confidence_pct)
    sev_label = severity.strip() or "None"
    sev_bg, sev_fg, sev_border = _severity_colors(sev_label)
    if sev_label.lower() == "none":
        sev_display = "Not elevated (screening)"
        sev_bg, sev_fg, sev_border = _SLATE_50, _SLATE_600, _SLATE_200
    else:
        sev_display = sev_label

    header_style = ParagraphStyle(
        "SumHdr",
        fontName="Helvetica-Bold",
        fontSize=8,
        textColor=_WHITE,
        alignment=TA_CENTER,
    )

    finding_style = ParagraphStyle(
        "Finding",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=17,
        textColor=finding_fg,
    )
    finding_sub_style = ParagraphStyle(
        "FindingSub",
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=finding_fg,
    )

    data = [
        [
            Paragraph("PRIMARY AI FINDING", header_style),
            Paragraph("MODEL CONFIDENCE", header_style),
            Paragraph("AI SEVERITY", header_style),
            Paragraph("ANALYSIS MODEL", header_style),
        ],
        [
            [
                Paragraph(escape(finding_display), finding_style),
                Spacer(1, 2),
                Paragraph(escape(finding_sub), finding_sub_style),
            ],
            Paragraph(
                f'{confidence_pct}%<br/><font size="8" color="#475569">'
                f"({escape(tier)} certainty)</font>",
                ParagraphStyle(
                    "ConfCell",
                    fontName="Helvetica-Bold",
                    fontSize=16,
                    leading=19,
                    textColor=_SLATE_900,
                    alignment=TA_CENTER,
                ),
            ),
            Paragraph(
                escape(sev_display),
                ParagraphStyle(
                    "SevCell",
                    fontName="Helvetica-Bold",
                    fontSize=12,
                    leading=15,
                    textColor=sev_fg,
                    alignment=TA_CENTER,
                ),
            ),
            Paragraph(
                escape(model_version),
                ParagraphStyle(
                    "ModelCell",
                    fontName="Helvetica",
                    fontSize=9,
                    leading=12,
                    textColor=_SLATE_700,
                    alignment=TA_CENTER,
                ),
            ),
        ],
    ]

    col_w = _CONTENT_WIDTH / 4
    table = Table(data, colWidths=[col_w] * 4)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), _TEAL_HEADER),
                ("BACKGROUND", (1, 0), (1, 0), _TEAL_HEADER),
                ("BACKGROUND", (2, 0), (2, 0), _TEAL_HEADER),
                ("BACKGROUND", (3, 0), (3, 0), _TEAL_HEADER),
                ("BACKGROUND", (0, 1), (0, 1), finding_bg),
                ("BACKGROUND", (1, 1), (1, 1), _WHITE),
                ("BACKGROUND", (2, 1), (2, 1), sev_bg),
                ("BACKGROUND", (3, 1), (3, 1), _SLATE_50),
                ("BOX", (0, 0), (-1, -1), 0.75, _SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, 0), "CENTER"),
                ("ALIGN", (1, 1), (1, 1), "CENTER"),
                ("ALIGN", (2, 1), (2, 1), "CENTER"),
                ("ALIGN", (3, 1), (3, 1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, 0), 6),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                ("TOPPADDING", (0, 1), (-1, 1), 12),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 12),
            ]
        )
    )
    return table


def _clinical_impression(
    prediction: str,
    confidence_pct: float,
    severity: str,
    styles: dict[str, ParagraphStyle],
) -> Table:
    is_pneumonia = prediction.strip().lower() == "pneumonia"
    sev = severity.strip()
    if is_pneumonia:
        text = (
            f"The AI screening model classified this study as <b>pneumonia</b> with "
            f"<b>{confidence_pct}%</b> confidence ({_confidence_tier(confidence_pct).lower()}). "
        )
        if sev and sev.lower() != "none":
            text += f"Associated AI severity is graded as <b>{escape(sev)}</b>. "
        text += (
            "Correlation with clinical presentation, laboratory findings, and physician "
            "interpretation is required before treatment decisions."
        )
    else:
        text = (
            f"The AI screening model did not detect a pneumonia pattern in this chest X-ray "
            f"(<b>{confidence_pct}%</b> confidence for the reported class). "
            "This does not exclude other pathology; standard clinical review remains indicated."
        )
    table = Table([[Paragraph(text, styles["impression"])]], colWidths=[_CONTENT_WIDTH])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _SLATE_50),
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def _body_box(text: str, styles: dict[str, ParagraphStyle]) -> Table:
    table = Table([[Paragraph(text, styles["body"])]], colWidths=[_CONTENT_WIDTH])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("BACKGROUND", (0, 0), (-1, -1), _WHITE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def _disclaimer_box(title: str, text: str, styles: dict[str, ParagraphStyle]) -> Table:
    content = (
        f'<font name="Helvetica-Bold" size="9">{escape(title)}</font><br/><br/>'
        f"{escape(text)}"
    )
    table = Table([[Paragraph(content, styles["disclaimer"])]], colWidths=[_CONTENT_WIDTH])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fcd34d")),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    return table


def _image_panel(
    figure_no: int,
    title: str,
    path: Path | None,
    styles: dict[str, ParagraphStyle],
    *,
    placeholder: str,
    max_w: float,
    max_h: float,
) -> list:
    caption = Paragraph(f"Figure {figure_no}. {title}", styles["image_caption"])
    if path and path.is_file():
        content: list = [
            caption,
            Spacer(1, 6),
            _scaled_image(path, max_w, max_h),
            Spacer(1, 4),
            Paragraph("Source: stored study image", styles["figure_label"]),
        ]
    else:
        ph_table = Table(
            [[Paragraph(placeholder, styles["body"])]],
            colWidths=[max_w],
            rowHeights=[max_h * 0.8],
        )
        ph_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), _SLATE_50),
                    ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            )
        )
        content = [caption, Spacer(1, 6), ph_table]
    return content


def _build_imaging_section(
    xray_path: Path | None,
    heatmap_path: Path | None,
    styles: dict[str, ParagraphStyle],
) -> list:
    if not xray_path and not heatmap_path:
        return []

    img_w = 2.95 * inch
    img_h = 2.75 * inch
    left = _image_panel(
        1,
        "Posteroanterior chest radiograph (study image)",
        xray_path,
        styles,
        placeholder="Study image unavailable",
        max_w=img_w,
        max_h=img_h,
    )
    right = _image_panel(
        2,
        "Grad-CAM explainability overlay",
        heatmap_path,
        styles,
        placeholder="Explainability overlay not available",
        max_w=img_w,
        max_h=img_h,
    )

    grid = Table([[left, right]], colWidths=[3.15 * inch, 3.15 * inch])
    grid.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("BACKGROUND", (0, 0), (-1, -1), _WHITE),
            ]
        )
    )
    return [
        *_section_title("Radiology Images", styles),
        grid,
    ]


def _build_doctor_notes_section(
    notes: list[ScanNote],
    styles: dict[str, ParagraphStyle],
) -> list:
    if not notes:
        return []

    rows: list[list[Paragraph]] = []
    for note in notes:
        author = note.doctor.name if note.doctor else f"Physician ID {note.doctor_id}"
        header = (
            f"<b>{escape(author)}</b> · "
            f"{escape(_format_datetime(note.created_at))}"
        )
        body = escape(note.note_text).replace("\n", "<br/>")
        rows.append([Paragraph(f"{header}<br/><br/>{body}", styles["body"])])

    table = Table(rows, colWidths=[_CONTENT_WIDTH])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("BACKGROUND", (0, 0), (-1, -1), _WHITE),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ("LINEBELOW", (0, 0), (-1, -2), 0.25, _SLATE_200),
            ]
        )
    )
    return [
        *_section_title("Physician Notes", styles),
        table,
    ]


def _signature_block(styles: dict[str, ParagraphStyle]) -> Table:
    line = Table([[""]], colWidths=[2.8 * inch], rowHeights=[0.01 * inch])
    line.setStyle(TableStyle([("LINEBELOW", (0, 0), (0, 0), 0.5, _SLATE_600)]))
    block = Table(
        [
            [line],
            [Paragraph("Reviewing clinician (signature)", styles["signature_label"])],
            [Paragraph("Date: _________________________", styles["signature_label"])],
        ],
        colWidths=[3 * inch],
    )
    block.setStyle(
        TableStyle(
            [
                ("TOPPADDING", (0, 1), (0, 1), 8),
                ("TOPPADDING", (0, 2), (0, 2), 4),
            ]
        )
    )
    outer = Table([[block, ""]], colWidths=[3.2 * inch, _CONTENT_WIDTH - 3.2 * inch])
    outer.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM")]))
    return outer


def _make_page_callbacks(scan_id: int, patient_name: str):
    report_no = _report_number(scan_id)
    patient_safe = patient_name[:40]

    def _draw_page(canvas, doc) -> None:
        canvas.saveState()
        # Top rule on pages 2+
        if canvas.getPageNumber() > 1:
            canvas.setStrokeColor(_SLATE_200)
            canvas.setLineWidth(0.5)
            y_top = _PAGE_HEIGHT - 0.6 * inch
            canvas.line(0.75 * inch, y_top, _PAGE_WIDTH - 0.75 * inch, y_top)
            canvas.setFont("Helvetica", 7)
            canvas.setFillColor(_SLATE_500)
            canvas.drawString(
                0.75 * inch,
                y_top + 0.08 * inch,
                f"CareVision AI · Report {report_no} · {patient_safe}",
            )

        footer_y = 0.55 * inch
        canvas.setStrokeColor(_SLATE_200)
        canvas.setLineWidth(0.5)
        canvas.line(
            0.75 * inch,
            footer_y + 0.35 * inch,
            _PAGE_WIDTH - 0.75 * inch,
            footer_y + 0.35 * inch,
        )
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(_SLATE_500)
        canvas.drawCentredString(
            _PAGE_WIDTH / 2,
            footer_y + 0.12 * inch,
            "AI-assisted screening — not a substitute for professional medical diagnosis.",
        )
        canvas.setFont("Helvetica-Bold", 7)
        canvas.setFillColor(_TEAL_HEADER)
        canvas.drawCentredString(
            _PAGE_WIDTH / 2,
            footer_y - 0.08 * inch,
            f"CareVision AI · {report_no}",
        )
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(_SLATE_500)
        canvas.drawRightString(
            _PAGE_WIDTH - 0.75 * inch,
            footer_y - 0.28 * inch,
            f"Page {canvas.getPageNumber()}",
        )
        canvas.restoreState()

    return _draw_page


def generate_scan_report_pdf(
    scan: Scan,
    *,
    notes: list[ScanNote] | None = None,
) -> bytes:
    """Build a PDF report from saved scan data (no model re-inference)."""
    buffer = BytesIO()
    generated_at = datetime.now()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.65 * inch,
        bottomMargin=1.0 * inch,
        title=f"CareVision AI Report - {_report_number(scan.id)}",
    )

    styles = _styles()
    confidence_pct = round(scan.confidence * 100, 1)
    severity_display = scan.severity or "None"
    ai_findings = scan.ai_findings or "AI findings not recorded for this scan."
    follow_up = (
        scan.follow_up_recommendation
        or "Follow-up recommendation not recorded for this scan."
    )
    model_version = scan.model_version or "Not recorded"

    recommendation = scan.recommendation or "No recommendation recorded."
    if MEDICAL_DISCLAIMER in recommendation:
        recommendation = recommendation.split(MEDICAL_DISCLAIMER)[0].strip()
    rec_display = escape(recommendation).replace("\n", "<br/>")

    xray_path = _resolve_storage_path(scan.image_path)
    heatmap_path = _resolve_storage_path(scan.heatmap_path)
    if heatmap_path and heatmap_path == xray_path:
        heatmap_path = None

    report_notes = notes or []
    page_cb = _make_page_callbacks(scan.id, scan.patient_name)

    story: list = [
        _letterhead(scan.id, generated_at, styles),
        Spacer(1, 0.08 * inch),
        _confidential_strip(styles),
        Spacer(1, 0.1 * inch),
        _meta_strip(
            [
                ("Patient", scan.patient_name),
                ("Study ID", str(scan.id)),
                ("Study Date", _format_date(scan.created_at)),
                ("Modality", "Chest X-Ray (PA)"),
            ],
            styles,
        ),
        Spacer(1, 0.12 * inch),
        *_section_title("Patient & Study Record", styles),
        _info_grid(
            [
                ("Patient name", scan.patient_name),
                ("Internal study ID", str(scan.id)),
                ("Date of study", _format_datetime(scan.created_at)),
                ("Report issued", _format_datetime(generated_at)),
            ],
            styles,
        ),
        Spacer(1, 0.06 * inch),
        *_section_title("AI Diagnostic Summary", styles),
        _diagnostic_summary_table(
            scan.prediction,
            confidence_pct,
            severity_display,
            model_version,
            styles,
        ),
        Spacer(1, 0.08 * inch),
        _clinical_impression(scan.prediction, confidence_pct, severity_display, styles),
        Spacer(1, 0.1 * inch),
        *_section_title("AI Findings Narrative", styles),
        _body_box(escape(ai_findings), styles),
    ]

    imaging = _build_imaging_section(xray_path, heatmap_path, styles)
    if imaging:
        story.append(Spacer(1, 0.06 * inch))
        story.extend(imaging)

    notes_block = _build_doctor_notes_section(report_notes, styles)
    if notes_block:
        story.append(Spacer(1, 0.06 * inch))
        story.extend(notes_block)

    story.extend(
        [
            Spacer(1, 0.06 * inch),
            *_section_title("Follow-Up Care Plan", styles),
            _body_box(escape(follow_up), styles),
            *_section_title("Clinical Recommendations", styles),
            _body_box(rec_display, styles),
            *_section_title("Important Notices", styles),
            _disclaimer_box(
                "Medical disclaimer",
                f"{MEDICAL_DISCLAIMER} {AI_SCREENING_DISCLAIMER}",
                styles,
            ),
            Spacer(1, 0.14 * inch),
            _signature_block(styles),
        ]
    )

    doc.build(story, onFirstPage=page_cb, onLaterPages=page_cb)
    return buffer.getvalue()
