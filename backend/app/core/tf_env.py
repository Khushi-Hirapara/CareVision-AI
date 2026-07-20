"""Apply TensorFlow env flags before any `tensorflow` import.

Pydantic Settings reads `.env` into Settings fields only; TensorFlow reads
`os.environ` at import time. Call `apply_tensorflow_env()` as early as possible
(e.g. first import from `app.main`).
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/app/core/tf_env.py → CareVision-AI/
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"

# Quiet oneDNN + reduce C++ log noise (0=all, 1=INFO, 2=WARNING, 3=ERROR)
_DEFAULTS = {
    "TF_ENABLE_ONEDNN_OPTS": "0",
    "TF_CPP_MIN_LOG_LEVEL": "2",
}


def apply_tensorflow_env() -> None:
    """Load `.env` into the process env, then ensure TF quiet defaults."""
    if _ENV_FILE.is_file():
        # Do not override vars already set in the shell / process.
        load_dotenv(_ENV_FILE, override=False)

    for key, value in _DEFAULTS.items():
        os.environ.setdefault(key, value)


apply_tensorflow_env()
