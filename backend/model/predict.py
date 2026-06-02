"""
Run inference with the trained chest X-ray model.

Usage:
    cd backend/model
    python predict.py --image path/to/xray.jpg
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    from model.inference import DEFAULT_MODEL_PATH, ChestXRayClassifier
except ImportError:
    from inference import DEFAULT_MODEL_PATH, ChestXRayClassifier


def predict_image(
    image_path: str | Path,
    model_path: str | Path = DEFAULT_MODEL_PATH,
    threshold: float = 0.5,
) -> dict[str, object]:
    classifier = ChestXRayClassifier(Path(model_path), threshold=threshold)
    result = classifier.predict(Path(image_path))
    return {
        "prediction": result.prediction,
        "confidence": result.confidence,
        "pneumonia_probability": result.pneumonia_probability,
        "normal_probability": result.normal_probability,
        "image": str(Path(image_path).resolve()),
        "model": str(Path(model_path).resolve()),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Chest X-ray pneumonia inference.")
    parser.add_argument("--image", type=Path, required=True, help="Path to a PNG/JPEG X-ray.")
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to chest_xray_model.h5",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.5,
        help="Sigmoid threshold for PNEUMONIA (default 0.5).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = predict_image(args.image, model_path=args.model, threshold=args.threshold)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
