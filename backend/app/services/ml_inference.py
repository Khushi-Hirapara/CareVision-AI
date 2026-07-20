"""TensorFlow chest X-ray classifier (loads model from `backend/model/`)."""

from __future__ import annotations

import logging
import sys
from functools import lru_cache
from pathlib import Path

import app.core.tf_env  # noqa: F401 — quiet TF before model import
from app.core.config import Settings

# Allow `from model.inference import ...` when running uvicorn from backend/
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from model.inference import ChestXRayClassifier, InferenceOutput  # noqa: E402

logger = logging.getLogger(__name__)


@lru_cache
def get_classifier(
    model_path: str,
    img_size: int,
    threshold: float,
) -> ChestXRayClassifier:
    return ChestXRayClassifier(
        model_path=Path(model_path),
        img_size=img_size,
        threshold=threshold,
    )


def run_model_inference(image_path: Path, settings: Settings) -> InferenceOutput:
    try:
        classifier = get_classifier(
            str(settings.resolved_model_path),
            settings.model_input_size,
            settings.prediction_threshold,
        )
        return classifier.predict(image_path)
    except Exception:
        logger.exception("TensorFlow inference failed for %s", image_path)
        raise
