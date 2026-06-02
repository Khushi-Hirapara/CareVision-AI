"""
Debug chest X-ray model bias by inspecting labels, class weights, and output scores.

Usage:
    cd backend
    .\\.venv\\Scripts\\python.exe model\\debug_model_predictions.py --dataset-dir ..\\dataset
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from tensorflow import keras

try:
    from model.evaluate_model import DEFAULT_DATASET_DIR, _load_test_split, _predict_raw_outputs
    from model.inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from model.preprocessing import CLASS_INDICES, CLASS_NAMES, PNEUMONIA_THRESHOLD
except ImportError:
    from evaluate_model import DEFAULT_DATASET_DIR, _load_test_split, _predict_raw_outputs
    from inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from preprocessing import CLASS_INDICES, CLASS_NAMES, PNEUMONIA_THRESHOLD

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}
IMG_SIZE = 224
DEFAULT_HIST_PATH = Path(__file__).resolve().parent / "raw_output_histogram.png"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Debug model collapse / pneumonia overprediction.")
    parser.add_argument("--dataset-dir", type=Path, default=DEFAULT_DATASET_DIR)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--batch-size", type=int, default=64)
    parser.add_argument("--threshold", type=float, default=PNEUMONIA_THRESHOLD)
    parser.add_argument("--save-hist", type=Path, default=DEFAULT_HIST_PATH)
    return parser.parse_args()


def _count_images(class_dir: Path) -> int:
    return sum(
        1 for p in class_dir.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    )


def _count_split(dataset_dir: Path, split: str) -> dict[str, int]:
    split_dir = dataset_dir / split
    if not split_dir.is_dir():
        raise FileNotFoundError(f"Missing split directory: {split_dir}")
    counts: dict[str, int] = {}
    for class_name in CLASS_NAMES:
        class_dir = split_dir / class_name
        if not class_dir.is_dir():
            raise FileNotFoundError(f"Missing class folder: {class_dir}")
        counts[class_name] = _count_images(class_dir)
    return counts


def _class_weights(train_counts: dict[str, int]) -> dict[int, float]:
    n_normal = train_counts["NORMAL"]
    n_pneumonia = train_counts["PNEUMONIA"]
    total = n_normal + n_pneumonia
    if n_normal == 0 or n_pneumonia == 0:
        raise ValueError("Both classes need at least one training image.")
    return {
        0: total / (2.0 * n_normal),
        1: total / (2.0 * n_pneumonia),
    }


def _first_n_labels(dataset_dir: Path, split: str, n: int = 20) -> list[int]:
    split_dir = dataset_dir / split
    ds = keras.utils.image_dataset_from_directory(
        split_dir,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=32,
        label_mode="binary",
        class_names=list(CLASS_NAMES),
        shuffle=False,
    )
    labels: list[int] = []
    for _, batch_labels in ds:
        labels.extend(int(v) for v in np.asarray(batch_labels).reshape(-1))
        if len(labels) >= n:
            break
    return labels[:n]


def _save_histogram(raw_outputs: np.ndarray, output_path: Path) -> None:
    import matplotlib.pyplot as plt

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.figure(figsize=(8, 5))
    plt.hist(raw_outputs, bins=25, range=(0.0, 1.0), color="#0f766e", edgecolor="white")
    plt.axvline(0.5, color="#dc2626", linestyle="--", linewidth=2, label="threshold=0.50")
    plt.title("Raw Sigmoid Output Distribution (PNEUMONIA probability)")
    plt.xlabel("Sigmoid output")
    plt.ylabel("Count")
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_path, dpi=160)
    plt.close()


def main() -> None:
    args = parse_args()

    print("\n=== CareVision AI Model Debug Report ===")
    print(f"Dataset:  {args.dataset_dir.resolve()}")
    print(f"Model:    {args.model.resolve()}")
    print(f"Threshold for counts: {args.threshold:.2f}")

    train_counts = _count_split(args.dataset_dir, "train")
    val_counts = _count_split(args.dataset_dir, "val")
    test_counts = _count_split(args.dataset_dir, "test")

    print("\n1) Number of train images per class")
    print(f"   NORMAL:    {train_counts['NORMAL']}")
    print(f"   PNEUMONIA: {train_counts['PNEUMONIA']}")

    print("\n2) Number of validation images per class")
    print(f"   NORMAL:    {val_counts['NORMAL']}")
    print(f"   PNEUMONIA: {val_counts['PNEUMONIA']}")

    print("\n3) Number of test images per class")
    print(f"   NORMAL:    {test_counts['NORMAL']}")
    print(f"   PNEUMONIA: {test_counts['PNEUMONIA']}")

    print("\n4) Class mapping")
    print(f"   NORMAL = {CLASS_INDICES['NORMAL']}")
    print(f"   PNEUMONIA = {CLASS_INDICES['PNEUMONIA']}")

    print("\n5) First 20 labels from train dataset")
    print(f"   {_first_n_labels(args.dataset_dir, 'train', 20)}")

    print("\n6) First 20 labels from validation dataset")
    print(f"   {_first_n_labels(args.dataset_dir, 'val', 20)}")

    print("\n7) First 20 labels from test dataset")
    print(f"   {_first_n_labels(args.dataset_dir, 'test', 20)}")

    class_weights = _class_weights(train_counts)
    print("\n8) Computed class weights")
    print(f"   class_weight[0] (NORMAL):    {class_weights[0]:.6f}")
    print(f"   class_weight[1] (PNEUMONIA): {class_weights[1]:.6f}")

    image_paths, y_true, _ = _load_test_split(args.dataset_dir)
    classifier = ChestXRayClassifier(model_path=args.model, threshold=args.threshold)
    raw_outputs = _predict_raw_outputs(classifier, image_paths, args.batch_size)

    print("\n9) Raw sigmoid output statistics on test set")
    print(f"   min:    {float(np.min(raw_outputs)):.6f}")
    print(f"   max:    {float(np.max(raw_outputs)):.6f}")
    print(f"   mean:   {float(np.mean(raw_outputs)):.6f}")
    print(f"   median: {float(np.median(raw_outputs)):.6f}")

    y_pred = (raw_outputs >= args.threshold).astype(np.int32)
    pred_normal = int(np.sum(y_pred == 0))
    pred_pneumonia = int(np.sum(y_pred == 1))

    print("\n10) Prediction counts on test set")
    print(f"   predicted NORMAL count:    {pred_normal}")
    print(f"   predicted PNEUMONIA count: {pred_pneumonia}")

    _save_histogram(raw_outputs, args.save_hist)
    print("\n11) Histogram")
    print(f"   saved to: {args.save_hist.resolve()}")

    all_normal_truth = bool(np.all(y_true == 0))
    all_pneumonia_truth = bool(np.all(y_true == 1))
    all_pneumonia_preds = bool(np.all(y_pred == 1))
    all_normal_preds = bool(np.all(y_pred == 0))

    print("\n--- Preliminary diagnosis hints ---")
    if all_normal_truth or all_pneumonia_truth:
        print("Potential label/data split issue: test labels are single-class.")
    else:
        print("Test labels contain both classes.")

    if all_pneumonia_preds or all_normal_preds:
        print("Model collapse likely: predictions are single-class.")
    else:
        print("Predictions are not fully collapsed to one class.")

    frac_ge_threshold = float(np.mean(raw_outputs >= args.threshold))
    print(
        f"Threshold effect: {frac_ge_threshold * 100:.1f}% outputs >= {args.threshold:.2f}."
    )
    print(
        "Use this with histogram + threshold sweep to distinguish threshold issue vs model collapse."
    )
    print()


if __name__ == "__main__":
    main()
