"""
Shared class labels and image preprocessing for training and inference.

Training (`train_model.py`):
  - `image_dataset_from_directory` with `class_names=["NORMAL", "PNEUMONIA"]`
  - `label_mode="binary"` → NORMAL=0, PNEUMONIA=1
  - Val/test: uint8 RGB resize via Keras loader, then `/255.0`
  - Model output: sigmoid = P(PNEUMONIA) = P(class 1)

Inference must use the same loader + scaling (no augmentation).
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
from tensorflow.keras.utils import img_to_array, load_img

CLASS_NAMES: tuple[str, ...] = ("NORMAL", "PNEUMONIA")
CLASS_INDICES: dict[str, int] = {"NORMAL": 0, "PNEUMONIA": 1}
INDEX_TO_CLASS: dict[int, str] = {0: "NORMAL", 1: "PNEUMONIA"}
PNEUMONIA_THRESHOLD: float = 0.5
MODEL_BACKBONE: str = os.getenv("MODEL_BACKBONE", "efficientnet").strip().lower()


def preprocessing_mode() -> str:
    """Human-readable preprocessing mode for startup logs."""
    if MODEL_BACKBONE == "efficientnet":
        return "efficientnet.preprocess_input (expects raw 0-255 RGB arrays)"
    return "identity (raw 0-255 RGB arrays)"


def preprocess_array_for_model(array: np.ndarray) -> np.ndarray:
    """
    Preprocess image arrays according to MODEL_BACKBONE.

    Input must be float32 RGB values in [0, 255].
    """
    if MODEL_BACKBONE == "efficientnet":
        return efficientnet_preprocess_input(array)
    return array


def preprocess_image(image_path: Path, img_size: int = 224) -> np.ndarray:
    """
    Load, resize, and preprocess a chest X-ray to model-ready batch (1, H, W, 3).

    Uses `keras.utils.load_img` + `img_to_array` with raw 0-255 values, then
    applies backbone-specific preprocessing (EfficientNet by default).
    """
    if not image_path.is_file():
        raise FileNotFoundError(f"Image not found: {image_path}")

    img = load_img(image_path, target_size=(img_size, img_size), color_mode="rgb")
    array = img_to_array(img, dtype=np.float32)
    batch = np.expand_dims(array, axis=0)
    return preprocess_array_for_model(batch)


def decode_prediction(raw_output: float, threshold: float = PNEUMONIA_THRESHOLD) -> tuple[str, float]:
    """
    Map raw sigmoid output to model label and winning-class confidence (0–100).

    pneumonia_prob >= threshold → PNEUMONIA (maps to API "Pneumonia")
    else → NORMAL (maps to API "Normal")

    Confidence is the predicted class probability × 100.
    """
    pneumonia_prob = float(raw_output)
    normal_prob = 1.0 - pneumonia_prob

    if pneumonia_prob >= threshold:
        return "PNEUMONIA", round(pneumonia_prob * 100, 2)

    return "NORMAL", round(normal_prob * 100, 2)
