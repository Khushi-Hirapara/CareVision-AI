"""
Train an EfficientNetB0 transfer-learning model for chest X-ray classification.

Expected dataset layout (relative to project root):

    dataset/
      train/NORMAL/  train/PNEUMONIA/
      val/NORMAL/    val/PNEUMONIA/
      test/NORMAL/   test/PNEUMONIA/

Usage:
    cd backend
    .\\.venv\\Scripts\\Activate.ps1
    python model\\train_model.py
"""

from __future__ import annotations

import argparse
import logging
import os
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

try:
    from model.evaluate_model import _binary_metrics, _classification_report
    from model.preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        preprocess_array_for_model,
        preprocessing_mode,
    )
except ImportError:
    from evaluate_model import _binary_metrics, _classification_report
    from preprocessing import (
        CLASS_INDICES,
        CLASS_NAMES,
        preprocess_array_for_model,
        preprocessing_mode,
    )

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = MODEL_DIR.parent.parent
DEFAULT_DATASET_DIR = PROJECT_ROOT / "dataset"
DEFAULT_MODEL_PATH = MODEL_DIR / "chest_xray_model.h5"
DEFAULT_HISTORY_PLOT = MODEL_DIR / "training_history.png"
IMG_SIZE = 224
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".gif"}


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "y", "on"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train EfficientNetB0 chest X-ray classifier (NORMAL vs PNEUMONIA)."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=DEFAULT_DATASET_DIR,
        help="Root folder containing train/, val/, and test/ splits.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_MODEL_PATH,
        help="Path to save the best model (.h5).",
    )
    parser.add_argument("--batch-size", type=int, default=32)
    parser.add_argument("--epochs", type=int, default=20, help="Frozen backbone epochs.")
    parser.add_argument("--fine-tune-epochs", type=int, default=10, help="Fine-tuning epochs.")
    parser.add_argument(
        "--unfreeze-top-layers",
        type=int,
        default=40,
        help="Number of top EfficientNet layers to unfreeze during fine-tuning.",
    )
    parser.add_argument("--learning-rate", type=float, default=1e-3)
    parser.add_argument("--fine-tune-learning-rate", type=float, default=1e-5)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--use-class-weights",
        action=argparse.BooleanOptionalAction,
        default=_env_bool("USE_CLASS_WEIGHTS", True),
        help="Enable class weights (env override: USE_CLASS_WEIGHTS=true/false).",
    )
    return parser.parse_args()


def _check_split(dataset_dir: Path, split: str) -> Path:
    split_dir = dataset_dir / split
    if not split_dir.is_dir():
        raise FileNotFoundError(
            f"Missing split directory: {split_dir}\n"
            "Download the Chest X-Ray (Pneumonia) dataset and run:\n"
            "  py -3.11 backend/model/prepare_dataset.py --source path/to/chest_xray\n"
            "See dataset/README.md for details."
        )
    for class_name in CLASS_NAMES:
        class_dir = split_dir / class_name
        if not class_dir.is_dir():
            raise FileNotFoundError(f"Missing class folder: {class_dir}")
        if not any(class_dir.iterdir()):
            raise FileNotFoundError(f"No images found in {class_dir}")
    return split_dir


def _count_images(class_dir: Path) -> int:
    return sum(
        1 for path in class_dir.iterdir() if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def _count_split(split_dir: Path) -> dict[str, int]:
    return {class_name: _count_images(split_dir / class_name) for class_name in CLASS_NAMES}


def _print_split_counts(dataset_dir: Path) -> dict[str, int]:
    print("\n--- Dataset class counts ---")
    train_counts = _count_split(dataset_dir / "train")
    for split in ("train", "val", "test"):
        split_dir = dataset_dir / split
        if not split_dir.is_dir():
            continue
        counts = _count_split(split_dir)
        total = sum(counts.values())
        print(f"{split}: total={total}  " + "  ".join(f"{name}={counts[name]}" for name in CLASS_NAMES))
    return train_counts


def _compute_class_weights(train_counts: dict[str, int]) -> dict[int, float]:
    n_normal = train_counts["NORMAL"]
    n_pneumonia = train_counts["PNEUMONIA"]
    if n_normal == 0 or n_pneumonia == 0:
        raise ValueError("Both NORMAL and PNEUMONIA must have at least one training image.")
    total = n_normal + n_pneumonia
    weights = {
        0: total / (2.0 * n_normal),
        1: total / (2.0 * n_pneumonia),
    }
    print(
        "\nClass weights (balanced): "
        f"NORMAL={weights[0]:.4f}  PNEUMONIA={weights[1]:.4f}"
    )
    return weights


def _build_datasets(
    dataset_dir: Path,
    batch_size: int,
    seed: int,
) -> tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset, list[str]]:
    train_dir = _check_split(dataset_dir, "train")
    test_dir = _check_split(dataset_dir, "test")

    common_kwargs = {
        "image_size": (IMG_SIZE, IMG_SIZE),
        "batch_size": batch_size,
        "label_mode": "binary",
        "class_names": list(CLASS_NAMES),
        "seed": seed,
        "validation_split": 0.2,
    }

    train_ds = keras.utils.image_dataset_from_directory(
        train_dir,
        subset="training",
        shuffle=True,
        **common_kwargs,
    )
    val_ds = keras.utils.image_dataset_from_directory(
        train_dir,
        subset="validation",
        shuffle=True,
        **common_kwargs,
    )
    test_ds = keras.utils.image_dataset_from_directory(
        test_dir,
        shuffle=False,
        image_size=(IMG_SIZE, IMG_SIZE),
        batch_size=batch_size,
        label_mode="binary",
        class_names=list(CLASS_NAMES),
        seed=seed,
    )

    class_names = list(train_ds.class_names)
    return train_ds, val_ds, test_ds, class_names


def _preprocess_batch(images: tf.Tensor, labels: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    """
    Apply backbone-specific preprocessing.
    For EfficientNet: raw 0-255 float arrays -> efficientnet.preprocess_input.
    """
    images = tf.cast(images, tf.float32)
    images = preprocess_array_for_model(images)
    return images, labels


def _augment_images(images: tf.Tensor, labels: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    """
    Apply augmentation only for training.
    """
    images = tf.cast(images, tf.float32)
    images = tf.image.random_flip_left_right(images)
    images = tf.image.random_brightness(images, max_delta=20.0)
    images = tf.image.random_contrast(images, lower=0.9, upper=1.1)
    images = tf.clip_by_value(images, 0.0, 255.0)
    images = preprocess_array_for_model(images)
    return images, labels


def _prepare_pipelines(
    train_ds: tf.data.Dataset,
    val_ds: tf.data.Dataset,
    test_ds: tf.data.Dataset,
) -> tuple[tf.data.Dataset, tf.data.Dataset, tf.data.Dataset]:
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.map(_augment_images, num_parallel_calls=autotune).prefetch(autotune)
    val_ds = val_ds.map(_preprocess_batch, num_parallel_calls=autotune).prefetch(autotune)
    test_ds = test_ds.map(_preprocess_batch, num_parallel_calls=autotune).prefetch(autotune)
    return train_ds, val_ds, test_ds


def _print_class_indices(class_names: list[str]) -> None:
    class_indices = {name: index for index, name in enumerate(class_names)}
    print("\n--- Class label mapping (train_generator.class_indices) ---")
    print(f"class_indices: {class_indices}")
    print("Expected: {'NORMAL': 0, 'PNEUMONIA': 1}")
    print("Inference rule: raw_output >= 0.5 => PNEUMONIA (1), else NORMAL (0)")
    if class_indices != CLASS_INDICES:
        raise ValueError(f"Unexpected class_indices {class_indices}; expected {CLASS_INDICES}")
    logger.info("Training class_indices verified: %s", class_indices)


def _dataset_label_counts(dataset: tf.data.Dataset) -> dict[str, int]:
    labels_all: list[np.ndarray] = []
    for _, labels in dataset:
        labels_all.append(tf.reshape(labels, [-1]).numpy().astype(np.int32))
    flat = np.concatenate(labels_all) if labels_all else np.array([], dtype=np.int32)
    return {
        "NORMAL": int(np.sum(flat == 0)),
        "PNEUMONIA": int(np.sum(flat == 1)),
    }


def _build_model() -> tuple[keras.Model, keras.Model]:
    inputs = keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3), name="image")
    backbone = keras.applications.EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_tensor=inputs,
        pooling="avg",
    )
    backbone.trainable = False

    x = layers.Dropout(0.35, name="dropout_1")(backbone.output)
    x = layers.Dense(128, activation="relu", name="dense_hidden")(x)
    x = layers.Dropout(0.25, name="dropout_2")(x)
    outputs = layers.Dense(1, activation="sigmoid", name="pneumonia_prob")(x)
    model = keras.Model(inputs, outputs, name="carevision_effnetb0")
    return model, backbone


def _compile_model(model: keras.Model, learning_rate: float) -> None:
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=learning_rate),
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.BinaryAccuracy(name="accuracy"),
            keras.metrics.Precision(name="precision"),
            keras.metrics.Recall(name="recall"),
            keras.metrics.AUC(name="auc"),
        ],
    )


def _create_callbacks(output_path: Path) -> list[keras.callbacks.Callback]:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    return [
        keras.callbacks.ModelCheckpoint(
            filepath=str(output_path),
            monitor="val_auc",
            mode="max",
            save_best_only=True,
            save_weights_only=False,
            verbose=1,
        ),
        keras.callbacks.EarlyStopping(
            monitor="val_auc",
            mode="max",
            patience=6,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_auc",
            mode="max",
            factor=0.5,
            patience=2,
            min_lr=1e-7,
            verbose=1,
        ),
        EpochMetricsLogger(),
    ]


class EpochMetricsLogger(keras.callbacks.Callback):
    """Compact per-epoch log for key metrics."""

    def on_epoch_end(self, epoch: int, logs: dict[str, float] | None = None) -> None:
        if logs is None:
            logs = {}
        print(
            f"[epoch {epoch + 1}] "
            f"train_loss={logs.get('loss', float('nan')):.4f} "
            f"val_loss={logs.get('val_loss', float('nan')):.4f} "
            f"train_auc={logs.get('auc', float('nan')):.4f} "
            f"val_auc={logs.get('val_auc', float('nan')):.4f}"
        )


def _merge_histories(*histories: keras.callbacks.History) -> dict[str, list[float]]:
    merged: dict[str, list[float]] = {}
    for history in histories:
        for key, values in history.history.items():
            merged.setdefault(key, []).extend(values)
    return merged


def _save_history_plot(history: dict[str, list[float]], plot_path: Path) -> None:
    try:
        import matplotlib.pyplot as plt
    except Exception as exc:
        logger.warning("Could not generate training history plot (matplotlib unavailable): %s", exc)
        return

    epochs = range(1, len(history.get("loss", [])) + 1)
    if not epochs:
        return

    plt.figure(figsize=(12, 8))

    plt.subplot(2, 2, 1)
    plt.plot(epochs, history.get("loss", []), label="train")
    plt.plot(epochs, history.get("val_loss", []), label="val")
    plt.title("Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Binary cross-entropy")
    plt.legend()

    plt.subplot(2, 2, 2)
    plt.plot(epochs, history.get("accuracy", []), label="train")
    plt.plot(epochs, history.get("val_accuracy", []), label="val")
    plt.title("Accuracy")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()

    plt.subplot(2, 2, 3)
    plt.plot(epochs, history.get("auc", []), label="train")
    plt.plot(epochs, history.get("val_auc", []), label="val")
    plt.title("AUC")
    plt.xlabel("Epoch")
    plt.ylabel("AUC")
    plt.legend()

    plt.subplot(2, 2, 4)
    plt.plot(epochs, history.get("precision", []), label="train precision")
    plt.plot(epochs, history.get("recall", []), label="train recall")
    plt.plot(epochs, history.get("val_precision", []), label="val precision")
    plt.plot(epochs, history.get("val_recall", []), label="val recall")
    plt.title("Precision / Recall")
    plt.xlabel("Epoch")
    plt.ylabel("Score")
    plt.legend(fontsize=8)

    plt.tight_layout()
    plot_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(plot_path, dpi=160)
    plt.close()
    print(f"\nSaved training history plot to {plot_path.resolve()}")


def _evaluate_test_set(model: keras.Model, test_ds: tf.data.Dataset) -> None:
    y_true_batches: list[np.ndarray] = []
    y_prob_batches: list[np.ndarray] = []

    for images, labels in test_ds:
        probs = model.predict(images, verbose=0).reshape(-1)
        y_prob_batches.append(probs.astype(np.float32))
        y_true_batches.append(tf.reshape(labels, [-1]).numpy().astype(np.int32))

    y_true = np.concatenate(y_true_batches)
    y_prob = np.concatenate(y_prob_batches)
    y_pred = (y_prob >= 0.5).astype(np.int32)

    metrics = _binary_metrics(y_true, y_pred)
    cm = np.array(
        [
            [metrics["tn"], metrics["fp"]],
            [metrics["fn"], metrics["tp"]],
        ],
        dtype=np.int32,
    )

    print("\n--- Test metrics (threshold=0.50) ---")
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"F1:        {metrics['f1']:.4f}")

    print("\nConfusion Matrix (rows=actual, cols=predicted)")
    print("                NORMAL   PNEUMONIA")
    print(f"Actual NORMAL   {cm[0, 0]:>6d}     {cm[0, 1]:>6d}")
    print(f"Actual PNEUMONIA{cm[1, 0]:>6d}     {cm[1, 1]:>6d}")

    print("\nClassification Report")
    print(_classification_report(y_true, y_pred))

    print("\nRaw output statistics")
    print(f"min:    {float(np.min(y_prob)):.6f}")
    print(f"max:    {float(np.max(y_prob)):.6f}")
    print(f"mean:   {float(np.mean(y_prob)):.6f}")
    print(f"median: {float(np.median(y_prob)):.6f}")

    pred_normal = int(np.sum(y_pred == 0))
    pred_pneumonia = int(np.sum(y_pred == 1))
    print("\nPrediction distribution")
    print(f"predicted NORMAL:    {pred_normal}")
    print(f"predicted PNEUMONIA: {pred_pneumonia}")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = parse_args()
    tf.keras.utils.set_random_seed(args.seed)

    print(f"Dataset: {args.dataset_dir.resolve()}")
    print(f"Best model output: {args.output.resolve()}")
    print("Model: EfficientNetB0 transfer learning")
    print("Class mapping: NORMAL=0, PNEUMONIA=1")
    print(f"Preprocessing mode: {preprocessing_mode()}")

    _print_split_counts(args.dataset_dir)

    train_ds, val_ds, test_ds, class_names = _build_datasets(
        args.dataset_dir,
        batch_size=args.batch_size,
        seed=args.seed,
    )
    _print_class_indices(class_names)

    train_split_counts = _dataset_label_counts(train_ds)
    val_split_counts = _dataset_label_counts(val_ds)
    print("\n--- Effective split counts (from dataset/train with validation_split=0.2) ---")
    print(
        f"train:      NORMAL={train_split_counts['NORMAL']}  "
        f"PNEUMONIA={train_split_counts['PNEUMONIA']}"
    )
    print(
        f"validation: NORMAL={val_split_counts['NORMAL']}  "
        f"PNEUMONIA={val_split_counts['PNEUMONIA']}"
    )

    class_weights = _compute_class_weights(train_split_counts)

    if args.use_class_weights:
        print("\nClass weighting: ENABLED")
        print(
            f"class_weight[0]={class_weights[0]:.4f}, "
            f"class_weight[1]={class_weights[1]:.4f}"
        )
    else:
        print("\nClass weighting: DISABLED (USE_CLASS_WEIGHTS=false)")
        class_weights = None
    train_ds, val_ds, test_ds = _prepare_pipelines(train_ds, val_ds, test_ds)

    model, backbone = _build_model()
    _compile_model(model, args.learning_rate)
    callbacks = _create_callbacks(args.output)

    print("\n--- Phase 1: train classification head (backbone frozen) ---")
    history_head = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )

    print("\n--- Phase 2: fine-tune top backbone layers ---")
    backbone.trainable = True
    freeze_until = max(0, len(backbone.layers) - args.unfreeze_top_layers)
    for layer in backbone.layers[:freeze_until]:
        layer.trainable = False
    for layer in backbone.layers[freeze_until:]:
        if isinstance(layer, layers.BatchNormalization):
            layer.trainable = False

    _compile_model(model, args.fine_tune_learning_rate)
    history_fine = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs + args.fine_tune_epochs,
        initial_epoch=args.epochs,
        class_weight=class_weights,
        callbacks=callbacks,
        verbose=1,
    )

    # Ensure the file exists even if checkpoint callback did not trigger.
    args.output.parent.mkdir(parents=True, exist_ok=True)
    model.save(args.output)
    print(f"\nSaved final model to {args.output.resolve()}")

    combined_history = _merge_histories(history_head, history_fine)
    _save_history_plot(combined_history, DEFAULT_HISTORY_PLOT)

    # Evaluate the best saved model on test set.
    best_model = keras.models.load_model(args.output, compile=False)
    _evaluate_test_set(best_model, test_ds)


if __name__ == "__main__":
    main()
