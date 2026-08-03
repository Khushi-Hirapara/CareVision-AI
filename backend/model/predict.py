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
) -> dict[str, object]:
    classifier = ChestXRayClassifier(Path(model_path))
    result = classifier.predict(Path(image_path))
    return {
        "prediction": result.prediction,
        "confidence": result.confidence,
        "class_probabilities": result.class_probabilities,
        "normal_probability": result.normal_probability,
        "pneumonia_probability": result.pneumonia_probability,
        "covid_probability": result.covid_probability,
        "image": str(Path(image_path).resolve()),
        "model": str(Path(model_path).resolve()),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Chest X-ray inference (NORMAL / PNEUMONIA / COVID)."
    )
    parser.add_argument("--image", type=Path, required=True, help="Path to a PNG/JPEG X-ray.")
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to chest_xray_model.h5",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result = predict_image(args.image, model_path=args.model)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
