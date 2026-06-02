"""
Evaluate a trained chest X-ray model on dataset/test.

Usage:
    cd backend
    .\\.venv\\Scripts\\Activate.ps1
    python model\\evaluate_model.py
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

try:
    from model.inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from model.preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        PNEUMONIA_THRESHOLD,
        preprocess_image,
        preprocessing_mode,
    )
except ImportError:
    from inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        PNEUMONIA_THRESHOLD,
        preprocess_image,
        preprocessing_mode,
    )

MODEL_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = MODEL_DIR.parent.parent
DEFAULT_DATASET_DIR = PROJECT_ROOT / "dataset"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate chest X-ray pneumonia classifier.")
    parser.add_argument(
        "--model",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to trained model (.h5).",
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=DEFAULT_DATASET_DIR,
        help="Dataset root containing test/NORMAL and test/PNEUMONIA.",
    )
    parser.add_argument("--batch-size", type=int, default=32, help="Inference batch size.")
    parser.add_argument(
        "--threshold",
        type=float,
        default=PNEUMONIA_THRESHOLD,
        help="Sigmoid threshold. raw_output >= threshold => PNEUMONIA.",
    )
    return parser.parse_args()


def _list_class_images(class_dir: Path) -> list[Path]:
    return sorted(
        path
        for path in class_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def _load_test_split(dataset_dir: Path) -> tuple[list[Path], np.ndarray, dict[str, int]]:
    test_dir = dataset_dir / "test"
    if not test_dir.is_dir():
        raise FileNotFoundError(f"Missing test directory: {test_dir}")

    image_paths: list[Path] = []
    labels: list[int] = []
    counts: dict[str, int] = {}

    for class_name in CLASS_NAMES:
        class_dir = test_dir / class_name
        if not class_dir.is_dir():
            raise FileNotFoundError(f"Missing class folder: {class_dir}")
        class_images = _list_class_images(class_dir)
        if not class_images:
            raise FileNotFoundError(f"No images found in {class_dir}")

        class_index = CLASS_INDICES[class_name]
        counts[class_name] = len(class_images)
        image_paths.extend(class_images)
        labels.extend([class_index] * len(class_images))

    return image_paths, np.asarray(labels, dtype=np.int32), counts


def _predict_raw_outputs(
    model: ChestXRayClassifier,
    image_paths: list[Path],
    batch_size: int,
) -> np.ndarray:
    keras_model = model.get_model()
    raw_outputs: list[np.ndarray] = []

    for start in range(0, len(image_paths), batch_size):
        chunk = image_paths[start : start + batch_size]
        batch = np.concatenate([preprocess_image(path, model.img_size) for path in chunk], axis=0)
        chunk_pred = keras_model.predict(batch, verbose=0).reshape(-1)
        raw_outputs.append(chunk_pred.astype(np.float32))

    return np.concatenate(raw_outputs, axis=0)


def _safe_div(num: float, den: float) -> float:
    return num / den if den else 0.0


def _binary_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float | int]:
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))

    accuracy = _safe_div(tp + tn, tp + tn + fp + fn)
    precision = _safe_div(tp, tp + fp)
    recall = _safe_div(tp, tp + fn)
    f1 = _safe_div(2 * precision * recall, precision + recall)

    return {
        "tp": tp,
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }


def _classification_report(y_true: np.ndarray, y_pred: np.ndarray) -> str:
    lines: list[str] = []
    header = f"{'Class':<12}{'Precision':>11}{'Recall':>10}{'F1-score':>11}{'Support':>10}"
    lines.append(header)
    lines.append("-" * len(header))

    precisions: list[float] = []
    recalls: list[float] = []
    f1_scores: list[float] = []
    supports: list[int] = []

    for class_name in CLASS_NAMES:
        class_id = CLASS_INDICES[class_name]
        tp = int(np.sum((y_true == class_id) & (y_pred == class_id)))
        fp = int(np.sum((y_true != class_id) & (y_pred == class_id)))
        fn = int(np.sum((y_true == class_id) & (y_pred != class_id)))
        support = int(np.sum(y_true == class_id))

        precision = _safe_div(tp, tp + fp)
        recall = _safe_div(tp, tp + fn)
        f1 = _safe_div(2 * precision * recall, precision + recall)

        precisions.append(precision)
        recalls.append(recall)
        f1_scores.append(f1)
        supports.append(support)

        lines.append(
            f"{class_name:<12}{precision:>11.4f}{recall:>10.4f}{f1:>11.4f}{support:>10d}"
        )

    total = int(np.sum(supports))
    macro_precision = float(np.mean(precisions))
    macro_recall = float(np.mean(recalls))
    macro_f1 = float(np.mean(f1_scores))
    weighted_precision = float(np.average(precisions, weights=supports))
    weighted_recall = float(np.average(recalls, weights=supports))
    weighted_f1 = float(np.average(f1_scores, weights=supports))

    lines.append("-" * len(header))
    lines.append(
        f"{'Macro avg':<12}{macro_precision:>11.4f}{macro_recall:>10.4f}{macro_f1:>11.4f}{total:>10d}"
    )
    lines.append(
        f"{'Weighted avg':<12}{weighted_precision:>11.4f}{weighted_recall:>10.4f}{weighted_f1:>11.4f}{total:>10d}"
    )
    return "\n".join(lines)


def main() -> None:
    args = parse_args()

    print("\n=== CareVision AI Model Evaluation ===")
    print(f"Model path:   {args.model.resolve()}")
    print(f"Dataset path: {args.dataset_dir.resolve()}")
    print(f"Threshold:    {args.threshold:.2f}")
    print(f"Class mapping: {CLASS_INDICES}")
    print(f"Preprocessing mode: {preprocessing_mode()}")
    print("Rule: raw_output >= threshold => PNEUMONIA (1), else NORMAL (0)")

    image_paths, y_true, counts = _load_test_split(args.dataset_dir)
    print("\n--- Test Image Counts ---")
    print(f"NORMAL images:    {counts['NORMAL']}")
    print(f"PNEUMONIA images: {counts['PNEUMONIA']}")
    print(f"Total images:     {len(image_paths)}")

    classifier = ChestXRayClassifier(
        model_path=args.model,
        threshold=args.threshold,
    )
    raw_outputs = _predict_raw_outputs(classifier, image_paths, args.batch_size)
    y_pred = (raw_outputs >= args.threshold).astype(np.int32)

    metrics = _binary_metrics(y_true, y_pred)
    cm = np.array(
        [
            [metrics["tn"], metrics["fp"]],
            [metrics["fn"], metrics["tp"]],
        ],
        dtype=np.int32,
    )

    print("\n--- Core Metrics ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1']:.4f}")

    print("\n--- Confusion Matrix ---")
    print("Rows = Actual, Columns = Predicted")
    print("                NORMAL   PNEUMONIA")
    print(f"Actual NORMAL   {cm[0, 0]:>6d}     {cm[0, 1]:>6d}")
    print(f"Actual PNEUMONIA{cm[1, 0]:>6d}     {cm[1, 1]:>6d}")

    print("\n--- Classification Report ---")
    print(_classification_report(y_true, y_pred))
    print()


if __name__ == "__main__":
    main()
