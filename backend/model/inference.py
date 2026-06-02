"""
Shared TensorFlow inference for chest X-ray pneumonia classification.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

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
        PNEUMONIA_THRESHOLD,
        decode_prediction,
        preprocess_image,
        preprocessing_mode,
    )
except ImportError:
    from preprocessing import (
        CLASS_INDICES,
        PNEUMONIA_THRESHOLD,
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
    prediction: str  # "NORMAL" | "PNEUMONIA"
    confidence: float  # winning class probability, 0–100
    pneumonia_probability: float
    normal_probability: float
    raw_output: float  # sigmoid P(PNEUMONIA)


class ChestXRayClassifier:
    """Loads the .h5 model once and runs binary pneumonia inference."""

    def __init__(
        self,
        model_path: Path,
        img_size: int = DEFAULT_IMG_SIZE,
        threshold: float = PNEUMONIA_THRESHOLD,
    ) -> None:
        self.model_path = model_path
        self.img_size = img_size
        self.threshold = threshold
        self._model: Model | None = None

    def _ensure_loaded(self) -> Model:
        if self._model is None:
            if not self.model_path.is_file():
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. "
                    "Train with: cd backend/model && python train_model.py"
                )
            self._model = load_model(
                self.model_path,
                compile=False,
                custom_objects=_EFFICIENTNET_CUSTOM_OBJECTS,
            )
            logger.info(
                "Loaded model from %s (layers=%d) class_indices=%s "
                "threshold=%.2f (raw >= threshold -> PNEUMONIA) preprocess=%s",
                self.model_path,
                len(self._model.layers),
                CLASS_INDICES,
                self.threshold,
                preprocessing_mode(),
            )
        return self._model

    def get_model(self) -> Model:
        """Return the loaded Keras model (shared by inference and Grad-CAM)."""
        return self._ensure_loaded()

    def predict(self, image_path: Path) -> InferenceOutput:
        model = self._ensure_loaded()
        batch = preprocess_image(image_path, self.img_size)

        raw_output = float(model.predict(batch, verbose=0)[0][0])
        pneumonia_prob = raw_output
        normal_prob = 1.0 - raw_output
        prediction, confidence = decode_prediction(raw_output, self.threshold)

        logger.info(
            "Inference: image=%s raw_sigmoid_output=%.6f pneumonia_probability=%.6f "
            "normal_probability=%.6f threshold=%.2f final_prediction=%s confidence=%.2f%%",
            image_path.name,
            raw_output,
            pneumonia_prob,
            normal_prob,
            self.threshold,
            prediction,
            confidence,
        )

        return InferenceOutput(
            prediction=prediction,
            confidence=confidence,
            pneumonia_probability=round(pneumonia_prob, 4),
            normal_probability=round(normal_prob, 4),
            raw_output=round(raw_output, 6),
        )
