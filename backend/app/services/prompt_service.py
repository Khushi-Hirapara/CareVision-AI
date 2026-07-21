"""Prompt construction for CareVision AI Health Assistant.

Always grounds Gemini in the patient's saved scan report + knowledge base.
Never sends only the raw patient question.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.services.ai_chat import ScanChatContext, CHAT_DISCLAIMER
from app.services.knowledge_service import KnowledgeArticle, format_knowledge_for_prompt


SYSTEM_INSTRUCTION = f"""You are CareVision AI Health Assistant — a compassionate,
professional healthcare education assistant for CareVision AI.

CRITICAL RULES (never break these):
1. You explain EXISTING saved screening reports only. You do NOT analyze X-ray images.
2. You NEVER diagnose diseases, confirm pneumonia clinically, or replace a doctor.
3. You NEVER prescribe medicines, dosages, or treatment plans.
4. You NEVER change, override, or invent prediction results.
5. Always remind the user this is AI-assisted education, not medical care.
6. If asked to diagnose/prescribe, politely refuse and direct them to their clinician.
7. Use clear, calm, patient-friendly language. Prefer short sections and bullet points.
8. When relevant, explain prediction, confidence, severity, Grad-CAM, recommendations,
   and doctor notes using ONLY the provided report data.
9. Use the knowledge base for general education; do not invent clinical facts.
10. End substantive answers with a brief reminder that a clinician must guide care.

Mandatory disclaimer to reinforce when appropriate:
{CHAT_DISCLAIMER}
"""


@dataclass(frozen=True)
class PreviousScanSummary:
    study_date: str
    prediction: str
    confidence_pct: float
    severity: str
    ai_findings: str
    comparison_summary: str | None = None


def build_user_prompt(
    *,
    question: str,
    scan_ctx: ScanChatContext,
    knowledge: list[KnowledgeArticle],
    previous: PreviousScanSummary | None = None,
    recent_messages: list[tuple[str, str]] | None = None,
) -> str:
    """Build the full grounded prompt for Gemini."""
    previous_block = "No previous scan available for comparison."
    if previous is not None:
        previous_block = (
            f"Previous study date: {previous.study_date}\n"
            f"Previous prediction: {previous.prediction}\n"
            f"Previous confidence: {previous.confidence_pct}%\n"
            f"Previous severity: {previous.severity}\n"
            f"Previous AI findings: {previous.ai_findings}\n"
        )
        if previous.comparison_summary:
            previous_block += f"Comparison summary: {previous.comparison_summary}\n"

    history_block = "No prior messages in this conversation."
    if recent_messages:
        lines = [f"{sender.upper()}: {text}" for sender, text in recent_messages[-8:]]
        history_block = "\n".join(lines)

    knowledge_block = format_knowledge_for_prompt(knowledge)

    return f"""## Patient Scan Report (authoritative — do not invent fields)
Patient name: {scan_ctx.patient_name}
Study date: {scan_ctx.study_date}
Prediction (AI screening label): {scan_ctx.prediction}
Confidence: {scan_ctx.confidence_pct}%
Severity: {scan_ctx.severity}
AI findings: {scan_ctx.ai_findings}
Clinical recommendation: {scan_ctx.clinical_recommendation}
Follow-up recommendation: {scan_ctx.follow_up_recommendation}
Grad-CAM heatmap available: {"yes" if scan_ctx.has_heatmap else "no"}
Doctor notes:
{scan_ctx.doctor_notes}

## Previous Scan Summary
{previous_block}

## Relevant Knowledge Base
{knowledge_block}

## Recent Conversation
{history_block}

## Patient Question
{question.strip()}

Respond helpfully using the report and knowledge base above. Do not invent scan data.
"""
