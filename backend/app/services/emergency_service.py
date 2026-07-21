"""Emergency symptom detection for the Health Assistant.

Dangerous questions bypass Gemini and return immediate emergency guidance.
"""

from __future__ import annotations

import re

EMERGENCY_ADVICE = (
    "## Seek emergency care now\n\n"
    "Your message may describe a medical emergency. "
    "**Call your local emergency number immediately** "
    "(for example 911 in the US) or go to the nearest emergency department.\n\n"
    "Do not wait for an AI reply. This assistant cannot provide emergency triage, "
    "diagnose conditions, or replace emergency medical services.\n\n"
    "If someone nearby can help, ask them to call emergency services for you."
)

_EMERGENCY_PATTERNS = re.compile(
    r"("
    r"can'?t\s+breathe|cannot\s+breathe|unable\s+to\s+breathe|"
    r"hard\s+to\s+breathe|difficulty\s+breathing|severe\s+shortness\s+of\s+breath|"
    r"gasping\s+for\s+air|choking|"
    r"oxygen\s*(is|=|:)?\s*(below\s*)?(8\d|7\d|6\d|5\d)|"
    r"spo2\s*(is|=|:)?\s*(below\s*)?(8\d|7\d|6\d|5\d)|"
    r"o2\s*(sat|saturation)?\s*(is|=|:)?\s*(below\s*)?(8\d|7\d|6\d|5\d)|"
    r"severe\s+chest\s+pain|crushing\s+chest\s+pain|chest\s+pain\s+and\s+(can'?t|cannot)|"
    r"heart\s+attack|stroke\s+symptoms|"
    r"blue\s+(lips|face|fingertips)|cyanosis|"
    r"passed\s+out|losing\s+consciousness|unconscious|"
    r"coughing\s+up\s+(a\s+lot\s+of\s+)?blood|"
    r"suicidal|kill\s+myself|end\s+my\s+life"
    r")",
    re.IGNORECASE,
)


def is_emergency_message(message: str) -> bool:
    """Return True when the message suggests an acute emergency."""
    return bool(_EMERGENCY_PATTERNS.search(message or ""))


def get_emergency_response() -> str:
    return EMERGENCY_ADVICE
