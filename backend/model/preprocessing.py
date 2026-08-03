"""
Shared class labels and image preprocessing for training and inference.

Training (`train_model.py`):
  - `image_dataset_from_directory` with `class_names=["NORMAL", "PNEUMONIA", "COVID"]`
  - `label_mode="int"` → NORMAL=0, PNEUMONIA=1, COVID=2
  - Model output: softmax over 3 classes; prediction = argmax

Inference must use the same loader + scaling (no augmentation).
"""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess_input
from tensorflow.keras.utils import img_to_array, load_img

CLASS_NAMES: tuple[str, ...] = ("NORMAL", "PNEUMONIA", "COVID")
CLASS_INDICES: dict[str, int] = {"NORMAL": 0, "PNEUMONIA": 1, "COVID": 2}
INDEX_TO_CLASS: dict[int, str] = {0: "NORMAL", 1: "PNEUMONIA", 2: "COVID"}
NUM_CLASSES: int = len(CLASS_NAMES)
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


def decode_prediction(class_probs: np.ndarray | list[float]) -> tuple[str, float]:
    """
    Map softmax class probabilities to model label and winning-class confidence (0–100).

    Prediction = argmax over [NORMAL, PNEUMONIA, COVID].
    Confidence is the winning class probability × 100.
    """
    probs = np.asarray(class_probs, dtype=np.float64).reshape(-1)
    if probs.size != NUM_CLASSES:
        raise ValueError(
            f"Expected {NUM_CLASSES} class probabilities, got shape {probs.shape}"
        )
    class_index = int(np.argmax(probs))
    confidence = float(probs[class_index]) * 100.0
    return INDEX_TO_CLASS[class_index], round(confidence, 2)
