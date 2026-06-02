"""
Sweep decision thresholds on dataset/test for chest_xray_model.h5.

Helps diagnose whether PNEUMONIA is over-predicted at the default 0.50 threshold.

Usage:
    cd backend
    .\\.venv\\Scripts\\Activate.ps1
    python model\\evaluate_thresholds.py
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np

try:
    from model.evaluate_model import (
        DEFAULT_DATASET_DIR,
        _binary_metrics,
        _load_test_split,
        _predict_raw_outputs,
    )
    from model.inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from model.preprocessing import CLASS_INDICES, preprocessing_mode
except ImportError:
    from evaluate_model import (
        DEFAULT_DATASET_DIR,
        _binary_metrics,
        _load_test_split,
        _predict_raw_outputs,
    )
    from inference import ChestXRayClassifier, DEFAULT_MODEL_PATH
    from preprocessing import CLASS_INDICES, preprocessing_mode

DEFAULT_THRESHOLDS = (0.50, 0.60, 0.70, 0.80, 0.90)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate chest X-ray model across multiple PNEUMONIA thresholds.",
    )
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
        "--thresholds",
        type=float,
        nargs="+",
        default=list(DEFAULT_THRESHOLDS),
        help="Sigmoid thresholds to compare (default: 0.50 0.60 0.70 0.80 0.90).",
    )
    return parser.parse_args()


def _print_confusion_matrix(metrics: dict[str, float | int]) -> None:
    tn = int(metrics["tn"])
    fp = int(metrics["fp"])
    fn = int(metrics["fn"])
    tp = int(metrics["tp"])
    print("Confusion Matrix (rows = actual, columns = predicted)")
    print("                NORMAL   PNEUMONIA")
    print(f"Actual NORMAL   {tn:>6d}     {fp:>6d}")
    print(f"Actual PNEUMONIA{fn:>6d}     {tp:>6d}")


def _print_threshold_block(
    threshold: float,
    y_true: np.ndarray,
    raw_outputs: np.ndarray,
) -> dict[str, float | int]:
    y_pred = (raw_outputs >= threshold).astype(np.int32)
    metrics = _binary_metrics(y_true, y_pred)
    n = len(y_true)
    pred_pneumonia = int(np.sum(y_pred == 1))
    actual_pneumonia = int(np.sum(y_true == 1))
    false_positives_normal = int(metrics["fp"])

    print(f"\n{'=' * 56}")
    print(f"Threshold: {threshold:.2f}  (raw_output >= {threshold:.2f} => PNEUMONIA)")
    print(f"{'=' * 56}")
    print(f"Predicted PNEUMONIA: {pred_pneumonia}/{n} ({100.0 * pred_pneumonia / n:.1f}%)")
    print(f"Actual PNEUMONIA:    {actual_pneumonia}/{n} ({100.0 * actual_pneumonia / n:.1f}%)")
    print(f"False positives (NORMAL misclassified as PNEUMONIA): {false_positives_normal}")
    print()
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1 Score:  {metrics['f1']:.4f}")
    print()
    _print_confusion_matrix(metrics)
    return metrics


def _print_summary_table(
    thresholds: list[float],
    rows: list[dict[str, float | int]],
    y_true: np.ndarray,
    raw_outputs: np.ndarray,
) -> None:
    print(f"\n{'=' * 56}")
    print("Summary comparison")
    print(f"{'=' * 56}")
    header = (
        f"{'Threshold':>10}  {'Accuracy':>9}  {'Precision':>9}  {'Recall':>8}  "
        f"{'F1':>8}  {'Pred PNA':>9}  {'FP(N->P)':>8}"
    )
    print(header)
    print("-" * len(header))

    for threshold, metrics in zip(thresholds, rows, strict=True):
        y_pred = (raw_outputs >= threshold).astype(np.int32)
        pred_pna = int(np.sum(y_pred == 1))
        print(
            f"{threshold:>10.2f}  "
            f"{metrics['accuracy']:>9.4f}  "
            f"{metrics['precision']:>9.4f}  "
            f"{metrics['recall']:>8.4f}  "
            f"{metrics['f1']:>8.4f}  "
            f"{pred_pna:>9d}  "
            f"{int(metrics['fp']):>8d}"
        )

    print("\n--- Interpretation ---")
    base_fp = int(rows[0]["fp"]) if rows else 0
    base_pred = int(np.sum((raw_outputs >= thresholds[0]).astype(np.int32)))
    high_fp = int(rows[-1]["fp"]) if rows else 0
    high_pred = int(np.sum((raw_outputs >= thresholds[-1]).astype(np.int32)))

    if base_fp > high_fp:
        print(
            f"At {thresholds[0]:.2f}, false positives on NORMAL are high ({base_fp}). "
            f"Raising the threshold reduces PNEUMONIA predictions "
            f"({base_pred} -> {high_pred}) and false positives ({base_fp} -> {high_fp})."
        )
        print("This suggests the model may be overpredicting PNEUMONIA at 0.50.")
    else:
        print("False positives do not clearly decrease as threshold rises; review raw scores.")

    mean_raw = float(np.mean(raw_outputs))
    median_raw = float(np.median(raw_outputs))
    print(f"\nRaw sigmoid stats on test set: mean={mean_raw:.4f}, median={median_raw:.4f}")
    print(f"Fraction with raw_output >= 0.50: {100.0 * np.mean(raw_outputs >= 0.5):.1f}%")


def main() -> None:
    args = parse_args()
    thresholds = sorted(args.thresholds)

    print("\n=== CareVision AI Threshold Evaluation ===")
    print(f"Model:         {args.model.resolve()}")
    print(f"Test dataset:  {args.dataset_dir.resolve()}")
    print(f"Class mapping: {CLASS_INDICES}")
    print(f"Preprocessing: {preprocessing_mode()}")
    print(f"Thresholds:    {', '.join(f'{t:.2f}' for t in thresholds)}")

    image_paths, y_true, counts = _load_test_split(args.dataset_dir)
    print("\n--- Test Image Counts ---")
    print(f"NORMAL images:    {counts['NORMAL']}")
    print(f"PNEUMONIA images: {counts['PNEUMONIA']}")
    print(f"Total:            {len(image_paths)}")

    print("\nRunning inference once (shared preprocessing with training/inference)...")
    classifier = ChestXRayClassifier(model_path=args.model, threshold=0.5)
    raw_outputs = _predict_raw_outputs(classifier, image_paths, args.batch_size)

    result_rows: list[dict[str, float | int]] = []
    for threshold in thresholds:
        result_rows.append(_print_threshold_block(threshold, y_true, raw_outputs))

    _print_summary_table(thresholds, result_rows, y_true, raw_outputs)
    print()


if __name__ == "__main__":
    main()
