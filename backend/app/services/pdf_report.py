"""Generate PDF diagnostic reports for saved scans."""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    Image as RLImage,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.core.config import PROJECT_ROOT
from app.models.scan import Scan
from app.services.recommendations import MEDICAL_DISCLAIMER

# Hospital-style palette
_TEAL = colors.HexColor("#0d9488")
_TEAL_DARK = colors.HexColor("#0f766e")
_SLATE_900 = colors.HexColor("#0f172a")
_SLATE_600 = colors.HexColor("#475569")
_SLATE_500 = colors.HexColor("#64748b")
_SLATE_200 = colors.HexColor("#e2e8f0")
_SLATE_50 = colors.HexColor("#f8fafc")
_NORMAL_BG = colors.HexColor("#ecfdf5")
_NORMAL_TEXT = colors.HexColor("#047857")
_PNEUMONIA_BG = colors.HexColor("#fff1f2")
_PNEUMONIA_TEXT = colors.HexColor("#be123c")
_WHITE = colors.white

_PAGE_WIDTH, _PAGE_HEIGHT = letter
_CONTENT_WIDTH = _PAGE_WIDTH - 1.5 * inch  # 0.75" margins


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
    return dt.strftime("%B %d, %Y at %I:%M %p")


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
        "brand_title": ParagraphStyle(
            "BrandTitle",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=_TEAL_DARK,
        ),
        "brand_sub": ParagraphStyle(
            "BrandSub",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=_SLATE_500,
        ),
        "report_meta": ParagraphStyle(
            "ReportMeta",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=_SLATE_600,
            alignment=TA_RIGHT,
        ),
        "section_heading": ParagraphStyle(
            "SectionHeading",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=14,
            textColor=_TEAL_DARK,
            spaceBefore=4,
            spaceAfter=2,
        ),
        "field_label": ParagraphStyle(
            "FieldLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=_SLATE_500,
            spaceAfter=2,
        ),
        "field_value": ParagraphStyle(
            "FieldValue",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=11,
            leading=14,
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
        "image_caption": ParagraphStyle(
            "ImageCaption",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=_SLATE_600,
            alignment=TA_CENTER,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
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
    }


def _section_banner(title: str, styles: dict[str, ParagraphStyle]) -> Table:
    """Teal section header bar."""
    table = Table(
        [[Paragraph(title, styles["section_heading"])]],
        colWidths=[_CONTENT_WIDTH],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _SLATE_50),
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("LINEBELOW", (0, 0), (-1, 0), 2, _TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def _info_grid(rows: list[tuple[str, str]], styles: dict[str, ParagraphStyle]) -> Table:
    """Two-column label / value rows inside a bordered panel."""
    data: list[list[Paragraph]] = []
    for label, value in rows:
        data.append(
            [
                Paragraph(label.upper(), styles["field_label"]),
                Paragraph(escape(value), styles["field_value"]),
            ]
        )
    table = Table(data, colWidths=[1.55 * inch, _CONTENT_WIDTH - 1.55 * inch])
    table.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, _SLATE_200),
                ("BACKGROUND", (0, 0), (0, -1), _SLATE_50),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return table


def _build_header(styles: dict[str, ParagraphStyle], generated_at: datetime) -> Table:
    logo_mark = Table(
        [[Paragraph("CV", ParagraphStyle(
            "LogoMark",
            fontName="Helvetica-Bold",
            fontSize=14,
            textColor=_WHITE,
            alignment=TA_CENTER,
        ))]],
        colWidths=[0.5 * inch],
        rowHeights=[0.5 * inch],
    )
    logo_mark.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _TEAL),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )

    brand_block = [
        Paragraph("CareVision AI", styles["brand_title"]),
        Paragraph("Chest X-Ray Screening Report", styles["brand_sub"]),
    ]

    meta_block = Paragraph(
        f"<b>Report generated</b><br/>{_format_datetime(generated_at)}",
        styles["report_meta"],
    )

    header = Table(
        [[logo_mark, brand_block, meta_block]],
        colWidths=[0.55 * inch, 3.6 * inch, 2.35 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (1, 0), (1, 0), 10),
                ("ALIGN", (2, 0), (2, 0), "RIGHT"),
            ]
        )
    )
    return header


def _prediction_badge(prediction: str, confidence_pct: float, styles: dict[str, ParagraphStyle]) -> Table:
    is_pneumonia = prediction.strip().lower() == "pneumonia"
    bg = _PNEUMONIA_BG if is_pneumonia else _NORMAL_BG
    fg = _PNEUMONIA_TEXT if is_pneumonia else _NORMAL_TEXT

    badge_style = ParagraphStyle(
        "Badge",
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=fg,
        alignment=TA_LEFT,
    )
    conf_style = ParagraphStyle(
        "ConfBadge",
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=fg,
        alignment=TA_RIGHT,
    )

    table = Table(
        [[
            Paragraph(escape(prediction), badge_style),
            Paragraph(f"{confidence_pct}% confidence", conf_style),
        ]],
        colWidths=[3.2 * inch, 3.3 * inch],
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.5, fg),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 12),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    return table


def _image_panel(
    title: str,
    path: Path | None,
    styles: dict[str, ParagraphStyle],
    *,
    placeholder: str,
    max_w: float,
    max_h: float,
) -> list:
    """Single image cell for the images table."""
    caption = Paragraph(title, styles["image_caption"])
    if path and path.is_file():
        content: list = [caption, Spacer(1, 4), _scaled_image(path, max_w, max_h)]
    else:
        content = [
            caption,
            Spacer(1, 4),
            Table(
                [[Paragraph(placeholder, styles["body"])]],
                colWidths=[max_w],
                rowHeights=[max_h * 0.85],
            ),
        ]
        content[-1].setStyle(  # type: ignore[union-attr]
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), _SLATE_50),
                    ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
    return content


def _build_images_section(
    xray_path: Path | None,
    heatmap_path: Path | None,
    styles: dict[str, ParagraphStyle],
) -> Table | None:
    img_w = 2.95 * inch
    img_h = 2.85 * inch

    left_items = _image_panel(
        "Original X-ray",
        xray_path,
        styles,
        placeholder="X-ray image unavailable",
        max_w=img_w,
        max_h=img_h,
    )
    right_items = _image_panel(
        "Grad-CAM Heatmap",
        heatmap_path if heatmap_path and heatmap_path != xray_path else None,
        styles,
        placeholder="Heatmap not available for this scan",
        max_w=img_w,
        max_h=img_h,
    )

    if not xray_path and not heatmap_path:
        return None

    left_cell = KeepTogether(left_items)
    right_cell = KeepTogether(right_items)

    table = Table(
        [[left_cell, right_cell]],
        colWidths=[3.15 * inch, 3.15 * inch],
    )
    table.setStyle(
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
    return table


def _draw_page_footer(canvas, doc) -> None:
    """Hospital-style footer on every page."""
    canvas.saveState()
    footer_y = 0.55 * inch
    canvas.setStrokeColor(_SLATE_200)
    canvas.setLineWidth(0.5)
    canvas.line(0.75 * inch, footer_y + 0.35 * inch, _PAGE_WIDTH - 0.75 * inch, footer_y + 0.35 * inch)

    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(_SLATE_500)
    disclaimer = (
        "AI-assisted screening only — not a substitute for professional medical diagnosis."
    )
    canvas.drawCentredString(_PAGE_WIDTH / 2, footer_y + 0.12 * inch, disclaimer)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(_TEAL_DARK)
    canvas.drawCentredString(
        _PAGE_WIDTH / 2,
        footer_y - 0.08 * inch,
        "Report generated by CareVision AI",
    )
    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(_SLATE_500)
    canvas.drawRightString(
        _PAGE_WIDTH - 0.75 * inch,
        footer_y - 0.28 * inch,
        f"Page {canvas.getPageNumber()}",
    )
    canvas.restoreState()


def generate_scan_report_pdf(scan: Scan) -> bytes:
    """Build a PDF report for the given scan record."""
    buffer = BytesIO()
    generated_at = datetime.now()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=1.05 * inch,
        title=f"CareVision AI Report - Scan {scan.id}",
    )

    styles = _styles()
    confidence_pct = round(scan.confidence * 100, 1)
    recommendation = scan.recommendation or "No recommendation recorded."
    if MEDICAL_DISCLAIMER in recommendation:
        recommendation = recommendation.split(MEDICAL_DISCLAIMER)[0].strip()
    rec_display = escape(recommendation).replace("\n", "<br/>")

    xray_path = _resolve_storage_path(scan.image_path)
    heatmap_path = _resolve_storage_path(scan.heatmap_path)

    story: list = [
        _build_header(styles, generated_at),
        Spacer(1, 0.12 * inch),
        HRFlowable(width="100%", thickness=1, color=_TEAL, spaceAfter=14),
        _section_banner("Patient Information", styles),
        Spacer(1, 0.08 * inch),
        _info_grid(
            [
                ("Patient Name", scan.patient_name),
                ("Scan Date", _format_datetime(scan.created_at)),
                ("Scan ID", str(scan.id)),
            ],
            styles,
        ),
        Spacer(1, 0.2 * inch),
        _section_banner("Prediction Summary", styles),
        Spacer(1, 0.1 * inch),
        _prediction_badge(scan.prediction, confidence_pct, styles),
        Spacer(1, 0.12 * inch),
        Table(
            [[
                Paragraph("PREDICTION", styles["field_label"]),
                Paragraph(escape(scan.prediction), styles["field_value"]),
            ]],
            colWidths=[1.55 * inch, _CONTENT_WIDTH - 1.55 * inch],
        ),
        Spacer(1, 0.06 * inch),
        Table(
            [[
                Paragraph("CONFIDENCE", styles["field_label"]),
                Paragraph(f"{confidence_pct}%", styles["field_value"]),
            ]],
            colWidths=[1.55 * inch, _CONTENT_WIDTH - 1.55 * inch],
        ),
        Spacer(1, 0.1 * inch),
        Table(
            [[Paragraph("RECOMMENDATION", styles["field_label"])]],
            colWidths=[_CONTENT_WIDTH],
        ),
        Spacer(1, 0.04 * inch),
        Table(
            [[Paragraph(rec_display, styles["body"])]],
            colWidths=[_CONTENT_WIDTH],
        ),
    ]
    story[-1].setStyle(  # type: ignore[union-attr]
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, _SLATE_200),
                ("BACKGROUND", (0, 0), (-1, -1), _SLATE_50),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    images_table = _build_images_section(xray_path, heatmap_path, styles)
    if images_table is not None:
        story.extend([
            Spacer(1, 0.22 * inch),
            _section_banner("Images", styles),
            Spacer(1, 0.1 * inch),
            images_table,
        ])

    story.extend([
        Spacer(1, 0.22 * inch),
        Table(
            [[Paragraph(f"<b>Clinical notice:</b> {escape(MEDICAL_DISCLAIMER)}", styles["disclaimer"])]],
            colWidths=[_CONTENT_WIDTH],
        ),
    ])
    story[-1].setStyle(  # type: ignore[union-attr]
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fffbeb")),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#fcd34d")),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    doc.build(
        story,
        onFirstPage=_draw_page_footer,
        onLaterPages=_draw_page_footer,
    )
    return buffer.getvalue()
