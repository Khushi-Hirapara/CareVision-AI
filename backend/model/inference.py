"""
Shared TensorFlow inference for chest X-ray multi-class classification
(NORMAL / PNEUMONIA / COVID).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from tensorflow.keras.applications import (
    EfficientNetB0,
    EfficientNetB1,
    EfficientNetB2,
    EfficientNetB3,
    EfficientNetB4,
    EfficientNetB5,
    EfficientNetB6,
    EfficientNetB7,
)
from tensorflow.keras.models import Model, load_model

try:
    from model.preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        NUM_CLASSES,
        decode_prediction,
        preprocess_image,
        preprocessing_mode,
    )
except ImportError:
    from preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        NUM_CLASSES,
        decode_prediction,
        preprocess_image,
        preprocessing_mode,
    )

logger = logging.getLogger(__name__)

# Required when loading .h5 models that use EfficientNet backbones.
_EFFICIENTNET_CUSTOM_OBJECTS = {
    "EfficientNetB0": EfficientNetB0,
    "EfficientNetB1": EfficientNetB1,
    "EfficientNetB2": EfficientNetB2,
    "EfficientNetB3": EfficientNetB3,
    "EfficientNetB4": EfficientNetB4,
    "EfficientNetB5": EfficientNetB5,
    "EfficientNetB6": EfficientNetB6,
    "EfficientNetB7": EfficientNetB7,
}

DEFAULT_MODEL_PATH = Path(__file__).resolve().parent / "chest_xray_model.h5"
DEFAULT_IMG_SIZE = 224


@dataclass(frozen=True)
class InferenceOutput:
    prediction: str  # "NORMAL" | "PNEUMONIA" | "COVID"
    confidence: float  # winning class probability, 0–100
    class_probabilities: dict[str, float]
    normal_probability: float
    pneumonia_probability: float
    covid_probability: float


class ChestXRayClassifier:
    """Loads the .h5 model once and runs 3-class chest X-ray inference."""

    def __init__(
        self,
        model_path: Path,
        img_size: int = DEFAULT_IMG_SIZE,
        threshold: float | None = None,
    ) -> None:
        self.model_path = model_path
        self.img_size = img_size
        # Kept for API compatibility; multi-class uses argmax, not a threshold.
        self.threshold = threshold
        self._model: Model | None = None

    def _ensure_loaded(self) -> Model:
        if self._model is None:
            if not self.model_path.is_file():
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. "
                    "Train with: cd backend && python model/train_model.py"
                )
            self._model = load_model(
                self.model_path,
                compile=False,
                custom_objects=_EFFICIENTNET_CUSTOM_OBJECTS,
            )
            out_units = int(np.prod(self._model.output_shape[1:]))
            if out_units != NUM_CLASSES:
                raise ValueError(
                    f"Model output has {out_units} units; expected {NUM_CLASSES} "
                    f"for classes {list(CLASS_NAMES)}. Retrain with train_model.py."
                )
            logger.info(
                "Loaded model from %s (layers=%d) class_indices=%s "
                "decode=argmax(softmax) preprocess=%s",
                self.model_path,
                len(self._model.layers),
                CLASS_INDICES,
                preprocessing_mode(),
            )
        return self._model

    def get_model(self) -> Model:
        """Return the loaded Keras model (shared by inference and Grad-CAM)."""
        return self._ensure_loaded()

    def predict(self, image_path: Path) -> InferenceOutput:
        model = self._ensure_loaded()
        batch = preprocess_image(image_path, self.img_size)

        probs = np.asarray(model.predict(batch, verbose=0)[0], dtype=np.float64).reshape(-1)
        prediction, confidence = decode_prediction(probs)
        class_probabilities = {
            name: round(float(probs[CLASS_INDICES[name]]), 4) for name in CLASS_NAMES
        }

        logger.info(
            "Inference: image=%s probs=%s final_prediction=%s confidence=%.2f%%",
            image_path.name,
            class_probabilities,
            prediction,
            confidence,
        )

        return InferenceOutput(
            prediction=prediction,
            confidence=confidence,
            class_probabilities=class_probabilities,
            normal_probability=class_probabilities["NORMAL"],
            pneumonia_probability=class_probabilities["PNEUMONIA"],
            covid_probability=class_probabilities["COVID"],
        )
