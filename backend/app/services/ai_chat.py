"""Scan-grounded AI chat: explains saved results only, never a final diagnosis."""

from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime

from app.models.scan import Scan
from app.models.scan_note import ScanNote
from app.services.ai_findings import AI_SCREENING_DISCLAIMER
from app.services.recommendations import MEDICAL_DISCLAIMER

CHAT_DISCLAIMER = (
    f"{AI_SCREENING_DISCLAIMER} "
    "This assistant explains the saved screening data for this scan only—it does not "
    "provide a final medical diagnosis, prescribe treatment, or replace your doctor."
)

_BLOCKED_PATTERNS = re.compile(
    r"\b("
    r"prescribe|prescription|medication|medicine|dosage|dose|antibiotic|"
    r"you\s+have\s+pneumonia|definitely\s+have|confirmed\s+diagnosis|"
    r"final\s+diagnosis|diagnose\s+me|what\s+drug|take\s+this\s+med"
    r")\b",
    re.IGNORECASE,
)


@dataclass(frozen=True)
class ScanChatContext:
    patient_name: str
    prediction: str
    confidence_pct: float
    severity: str
    ai_findings: str
    clinical_recommendation: str
    follow_up_recommendation: str
    has_heatmap: bool
    study_date: str
    doctor_notes: str


def _format_study_date(dt: datetime) -> str:
    if dt.tzinfo is not None:
        dt = dt.replace(tzinfo=None)
    return dt.strftime("%B %d, %Y at %I:%M %p")


def _strip_clinical_disclaimer(text: str | None) -> str:
    if not text:
        return "No clinical recommendation was recorded for this scan."
    if MEDICAL_DISCLAIMER in text:
        return text.split(MEDICAL_DISCLAIMER)[0].strip()
    return text.strip()


def _format_doctor_notes(notes: list[ScanNote]) -> str:
    if not notes:
        return "No doctor notes are recorded for this scan yet."
    parts: list[str] = []
    for note in notes:
        author = note.doctor.name if note.doctor else f"Doctor #{note.doctor_id}"
        when = _format_study_date(note.created_at)
        parts.append(f"- {author} ({when}): {note.note_text.strip()}")
    return "\n".join(parts)


def build_scan_chat_context(scan: Scan, notes: list[ScanNote]) -> ScanChatContext:
    return ScanChatContext(
        patient_name=scan.patient_name,
        prediction=scan.prediction,
        confidence_pct=round(scan.confidence * 100, 1),
        severity=scan.severity or "None",
        ai_findings=scan.ai_findings or "AI findings were not recorded for this scan.",
        clinical_recommendation=_strip_clinical_disclaimer(scan.recommendation),
        follow_up_recommendation=(
            scan.follow_up_recommendation
            or "No follow-up recommendation was recorded for this scan."
        ),
        has_heatmap=bool(scan.heatmap_path),
        study_date=_format_study_date(scan.created_at),
        doctor_notes=_format_doctor_notes(notes),
    )


def _is_blocked_message(message: str) -> bool:
    return _BLOCKED_PATTERNS.search(message) is not None


def _classify_intent(message: str) -> str:
    lower = message.lower()
    if any(
        k in lower
        for k in (
            "grad-cam",
            "grad cam",
            "heatmap",
            "heat map",
            "explainability",
            "overlay",
            "highlight",
        )
    ):
        return "grad_cam"
    if any(k in lower for k in ("confidence", "percent", "percentage", "how sure")):
        return "confidence"
    if "severity" in lower or "mild" in lower or "moderate" in lower or "severe" in lower:
        return "severity"
    if any(
        k in lower
        for k in (
            "follow-up",
            "follow up",
            "next step",
            "what should i do",
        )
    ):
        return "follow_up"
    if "recommendation" in lower and "follow" not in lower:
        return "recommendation"
    if any(
        k in lower
        for k in (
            "doctor",
            "physician",
            "discuss",
            "ask my",
            "appointment",
            "consultation",
        )
    ):
        return "doctor_discussion"
    if any(
        k in lower
        for k in (
            "explain",
            "simple",
            "mean",
            "result",
            "summary",
            "tell me about",
            "what is this",
        )
    ):
        return "explain_result"
    return "overview"


def _refusal_answer() -> str:
    return (
        "I can only explain the saved screening data for this chest X-ray scan. "
        "I cannot prescribe medicine, give a final diagnosis, or confirm that you "
        "definitely have pneumonia. Please discuss treatment and diagnosis with a "
        "qualified healthcare professional.\n\n"
        f"{CHAT_DISCLAIMER}"
    )


def _with_disclaimer(body: str) -> str:
    return f"{body.strip()}\n\n{CHAT_DISCLAIMER}"


def _answer_explain_result(ctx: ScanChatContext) -> str:
    screening = (
        "suggests patterns that may be consistent with pneumonia on this screening"
        if ctx.prediction.lower() == "pneumonia"
        else "did not show obvious pneumonia-like opacity patterns on this screening"
    )
    severity_line = (
        f"The AI severity level recorded for this scan is {ctx.severity}."
        if ctx.severity.lower() != "none"
        else "No elevated pneumonia severity level applies because the screening result is Normal."
    )
    return _with_disclaimer(
        f"For {ctx.patient_name}'s study on {ctx.study_date}, the model screening result "
        f"is {ctx.prediction} with {ctx.confidence_pct}% confidence. "
        f"In simple terms, the analysis {screening}. {severity_line}\n\n"
        f"AI findings (saved on this scan): {ctx.ai_findings}\n\n"
        "This is preliminary AI screening—not a final diagnosis."
    )


def _answer_confidence(ctx: ScanChatContext) -> str:
    return _with_disclaimer(
        f"The model's confidence for this scan is {ctx.confidence_pct}% "
        f"for the {ctx.prediction} screening label. Confidence reflects how strongly "
        f"the model favored that label on this image—it does not by itself confirm a "
        f"clinical diagnosis. Your care team should interpret this result in context of "
        f"symptoms, history, and professional review."
    )


def _answer_grad_cam(ctx: ScanChatContext) -> str:
    if ctx.has_heatmap:
        heatmap = (
            "A Grad-CAM heatmap was saved with this scan. The overlay highlights regions "
            "of the X-ray that most influenced the model's screening decision. Brighter "
            "areas indicate stronger influence—they are for explanation only, not a map "
            "of disease location or a diagnosis."
        )
    else:
        heatmap = (
            "No Grad-CAM heatmap is stored for this scan (it may be disabled or could "
            "not be generated). The prediction and other saved fields still reflect the "
            "model screening output for the uploaded image."
        )
    return _with_disclaimer(
        f"{heatmap} The screening label for this study is {ctx.prediction} "
        f"({ctx.confidence_pct}% confidence)."
    )


def _answer_severity(ctx: ScanChatContext) -> str:
    if ctx.prediction.lower() != "pneumonia":
        return _with_disclaimer(
            f"Severity levels apply when the screening result is Pneumonia. "
            f"This scan is {ctx.prediction}, so the recorded severity is "
            f"{ctx.severity} (not applicable as an elevated pneumonia severity band)."
        )
    bands = (
        "Mild (confidence below 70%): lower-confidence pneumonia pattern on screening.\n"
        "Moderate (70–89%): stronger pattern on screening.\n"
        "Severe (90%+): strongest pattern on screening with high model confidence."
    )
    return _with_disclaimer(
        f"This scan's recorded AI severity is {ctx.severity} "
        f"(screening: {ctx.prediction}, {ctx.confidence_pct}% confidence).\n\n"
        f"How severity is assigned on this system:\n{bands}\n\n"
        f"AI findings for this scan: {ctx.ai_findings}"
    )


def _answer_recommendation(ctx: ScanChatContext) -> str:
    return _with_disclaimer(
        f"Clinical recommendation (saved on this scan):\n{ctx.clinical_recommendation}"
    )


def _answer_follow_up(ctx: ScanChatContext) -> str:
    return _with_disclaimer(
        f"Follow-up recommendation (saved on this scan):\n{ctx.follow_up_recommendation}"
    )


def _answer_doctor_discussion(ctx: ScanChatContext) -> str:
    topics = [
        "Your symptoms and how long they have lasted",
        "Whether this AI screening aligns with their clinical assessment",
        "If further tests or a follow-up chest X-ray are appropriate",
        "The meaning of the confidence score and severity level on this scan",
    ]
    if ctx.has_heatmap:
        topics.append("What the Grad-CAM heatmap highlights and what it does not prove")
    if ctx.prediction.lower() == "pneumonia":
        topics.append("Urgency of evaluation based on your current condition")
    bullet = "\n".join(f"- {t}" for t in topics)
    notes_block = (
        f"\n\nDoctor notes already on this scan:\n{ctx.doctor_notes}"
        if "No doctor notes" not in ctx.doctor_notes
        else ""
    )
    return _with_disclaimer(
        f"You may discuss the following with your doctor about this study "
        f"({ctx.study_date}):\n{bullet}{notes_block}"
    )


def _answer_overview(ctx: ScanChatContext) -> str:
    return _with_disclaimer(
        f"I can help explain this saved scan for {ctx.patient_name} "
        f"({ctx.study_date}).\n\n"
        f"- Screening result: {ctx.prediction} ({ctx.confidence_pct}% confidence)\n"
        f"- Severity: {ctx.severity}\n"
        f"- AI findings: {ctx.ai_findings}\n"
        f"- Follow-up: {ctx.follow_up_recommendation}\n\n"
        "Try asking: explain the result in simple words, explain confidence, "
        "explain Grad-CAM, explain severity, explain recommendation, or "
        "what should I discuss with my doctor?"
    )


_INTENT_HANDLERS = {
    "explain_result": _answer_explain_result,
    "confidence": _answer_confidence,
    "grad_cam": _answer_grad_cam,
    "severity": _answer_severity,
    "recommendation": _answer_recommendation,
    "follow_up": _answer_follow_up,
    "doctor_discussion": _answer_doctor_discussion,
    "overview": _answer_overview,
}


def generate_scan_chat_answer(
    scan: Scan,
    notes: list[ScanNote],
    message: str,
) -> str:
    """Produce a scan-grounded reply with mandatory disclaimer."""
    if _is_blocked_message(message):
        return _refusal_answer()

    ctx = build_scan_chat_context(scan, notes)
    intent = _classify_intent(message)
    handler = _INTENT_HANDLERS.get(intent, _answer_overview)
    return handler(ctx)
