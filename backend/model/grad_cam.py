"""
Grad-CAM explainability for chest X-ray classifiers (custom CNN, EfficientNet, etc.).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import tensorflow as tf
from PIL import Image
from tensorflow.keras.layers import (
    Conv2D,
    DepthwiseConv2D,
    SeparableConv2D,
)
from tensorflow.keras.models import Model

from model.preprocessing import CLASS_INDICES, CLASS_NAMES, preprocess_image

logger = logging.getLogger(__name__)

# Jet colormap lookup (256 x RGB), no matplotlib dependency.
_JET_LUT = np.zeros((256, 3), dtype=np.uint8)
for _i in range(256):
    _x = _i / 255.0
    _r = np.clip(1.5 - abs(4 * _x - 3), 0, 1)
    _g = np.clip(1.5 - abs(4 * _x - 2), 0, 1)
    _b = np.clip(1.5 - abs(4 * _x - 1), 0, 1)
    _JET_LUT[_i] = [int(_r * 255), int(_g * 255), int(_b * 255)]

_CONV_LAYER_TYPES = (Conv2D, SeparableConv2D, DepthwiseConv2D)
_SKIP_LAYER_TYPES = (
    tf.keras.layers.InputLayer,
    tf.keras.layers.Dropout,
    tf.keras.layers.BatchNormalization,
)


@dataclass(frozen=True)
class GradCamConfig:
    img_size: int = 224
    overlay_alpha: float = 0.45


def _output_rank(layer: tf.keras.layers.Layer) -> int | None:
    """Return tensor rank (4 = spatial feature map) when known."""
    shape = getattr(layer, "output_shape", None)
    if shape is None:
        return None
    if isinstance(shape, (list, tuple)) and shape and isinstance(shape[0], (list, tuple)):
        inner = shape[0]
        return len(inner) if inner else None
    if isinstance(shape, (list, tuple)):
        return len(shape)
    return None


def _is_spatial_layer(layer: tf.keras.layers.Layer) -> bool:
    """True when the layer produces a feature map (rank 4) or is a known conv type."""
    if isinstance(layer, _CONV_LAYER_TYPES):
        return True
    rank = _output_rank(layer)
    return rank == 4 and not isinstance(layer, _SKIP_LAYER_TYPES)


def _conv_layer_priority(layer: tf.keras.layers.Layer) -> int:
    """Prefer standard Conv2D over depthwise blocks for sharper Grad-CAM maps."""
    if isinstance(layer, Conv2D):
        return 3
    if isinstance(layer, SeparableConv2D):
        return 2
    if isinstance(layer, DepthwiseConv2D):
        return 1
    return 0


def _walk_layers(container: Model | tf.keras.layers.Layer) -> Iterable[tf.keras.layers.Layer]:
    """Post-order traversal so the last yielded layer is deepest/rightmost in the graph."""
    if not hasattr(container, "layers"):
        return
    for layer in container.layers:
        if isinstance(layer, Model) or (hasattr(layer, "layers") and layer.layers):
            yield from _walk_layers(layer)
        yield layer


def _collect_conv_candidates(model: Model) -> list[tf.keras.layers.Layer]:
    """Collect Conv2D-family layers with spatial outputs (works inside EfficientNet)."""
    candidates: list[tf.keras.layers.Layer] = []
    seen: set[int] = set()

    def add(layer: tf.keras.layers.Layer) -> None:
        layer_id = id(layer)
        if layer_id in seen:
            return
        seen.add(layer_id)
        if _is_spatial_layer(layer):
            candidates.append(layer)

    for layer in _walk_layers(model):
        if isinstance(layer, _CONV_LAYER_TYPES):
            add(layer)

    if candidates:
        return candidates

    gap_fallback = _layer_before_global_pool(model)
    if gap_fallback is not None:
        logger.info(
            "Grad-CAM: using feature map before global pooling: %r (%s)",
            gap_fallback.name,
            gap_fallback.__class__.__name__,
        )
        return [gap_fallback]

    for layer in _walk_layers(model):
        if _output_rank(layer) == 4:
            add(layer)

    return candidates


def _layer_before_global_pool(model: Model) -> tf.keras.layers.Layer | None:
    """Fallback when conv layers lack output_shape (common after .h5 load)."""
    layer_list = list(model.layers)
    for index, layer in enumerate(layer_list):
        if isinstance(layer, tf.keras.layers.GlobalAveragePooling2D):
            for prev in reversed(layer_list[:index]):
                if not isinstance(prev, _SKIP_LAYER_TYPES):
                    return prev
    return None


def _log_layer_candidates(model: Model, candidates: list[tf.keras.layers.Layer]) -> None:
    if not candidates:
        logger.error(
            "Grad-CAM: no spatial conv/feature layers found. Top-level layers: %s",
            [(layer.name, layer.__class__.__name__) for layer in model.layers],
        )
        return

    preview = candidates[-8:]
    logger.info(
        "Grad-CAM: %d spatial layer candidate(s); last %d: %s",
        len(candidates),
        len(preview),
        [
            {
                "name": layer.name,
                "type": layer.__class__.__name__,
                "output_shape": getattr(layer, "output_shape", None),
                "priority": _conv_layer_priority(layer),
            }
            for layer in preview
        ],
    )


def find_last_conv_layer(
    model: Model,
    *,
    layer_name: str | None = None,
) -> tf.keras.layers.Layer:
    """
    Resolve the layer used for Grad-CAM.

    Uses ``layer_name`` when set (e.g. EfficientNet ``top_conv``); otherwise picks the
    last spatial Conv2D (or SeparableConv2D / DepthwiseConv2D) in the model graph.
    """
    if layer_name and layer_name.strip():
        name = layer_name.strip()
        try:
            layer = model.get_layer(name)
            logger.info(
                "Grad-CAM: using configured layer %r (%s, output_shape=%s)",
                name,
                layer.__class__.__name__,
                getattr(layer, "output_shape", None),
            )
            if not _is_spatial_layer(layer):
                logger.warning(
                    "Grad-CAM: configured layer %r has output_shape=%s (expected rank 4)",
                    name,
                    getattr(layer, "output_shape", None),
                )
            return layer
        except ValueError:
            logger.warning(
                "Grad-CAM: GRAD_CAM_LAYER_NAME=%r not found; auto-detecting last Conv2D",
                name,
            )

    candidates = _collect_conv_candidates(model)
    _log_layer_candidates(model, candidates)

    if not candidates:
        raise ValueError(
            "Could not find a convolutional feature map layer for Grad-CAM. "
            "Set GRAD_CAM_LAYER_NAME to a spatial layer (e.g. EfficientNet top_conv)."
        )

    conv_only = [layer for layer in candidates if isinstance(layer, _CONV_LAYER_TYPES)]
    pool = conv_only or candidates

    best_priority = max(_conv_layer_priority(layer) for layer in pool)
    top = [layer for layer in pool if _conv_layer_priority(layer) == best_priority]
    chosen = top[-1]

    logger.info(
        "Grad-CAM: auto-selected layer %r (%s, output_shape=%s)",
        chosen.name,
        chosen.__class__.__name__,
        getattr(chosen, "output_shape", None),
    )
    return chosen


class GradCamGenerator:
    """Compute class-specific Grad-CAM heatmaps and overlays for the chest X-ray model."""

    def __init__(
        self,
        model: Model,
        config: GradCamConfig | None = None,
        conv_layer: tf.keras.layers.Layer | None = None,
        *,
        layer_name: str | None = None,
    ) -> None:
        self.model = model
        self.config = config or GradCamConfig()
        self.conv_layer = conv_layer or find_last_conv_layer(model, layer_name=layer_name)

        try:
            self._grad_model = Model(
                inputs=model.input,
                outputs=[self.conv_layer.output, model.output],
            )
        except Exception as exc:
            logger.exception(
                "Grad-CAM: failed to build gradient model for layer %r (%s)",
                self.conv_layer.name,
                self.conv_layer.__class__.__name__,
            )
            raise ValueError(
                f"Grad-CAM layer {self.conv_layer.name!r} is not connected to model output"
            ) from exc

        logger.info(
            "Grad-CAM: gradient model ready (inputs=%s, conv=%s, output=%s)",
            model.input_shape,
            getattr(self.conv_layer, "output_shape", None),
            model.output_shape,
        )

    def _class_score(
        self,
        predictions: tf.Tensor,
        target_class: str,
    ) -> tf.Tensor:
        prob_pneumonia = predictions[:, 0]
        if target_class.upper() == "PNEUMONIA":
            return prob_pneumonia
        if target_class.upper() == "NORMAL":
            return 1.0 - prob_pneumonia
        raise ValueError(f"Unsupported target class: {target_class}")

    def compute_heatmap(
        self,
        image_batch: np.ndarray,
        target_class: str,
    ) -> np.ndarray:
        """Return a normalized 2D heatmap in [0, 1] for the first image in the batch."""
        with tf.GradientTape() as tape:
            conv_outputs, predictions = self._grad_model(image_batch, training=False)
            loss = self._class_score(predictions, target_class)
        grads = tape.gradient(loss, conv_outputs)
        if grads is None:
            raise RuntimeError(
                f"Grad-CAM gradients are undefined for layer {self.conv_layer.name!r}. "
                "Try GRAD_CAM_LAYER_NAME=top_conv for EfficientNet."
            )

        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_slice = conv_outputs[0]
        heatmap = tf.reduce_sum(conv_slice * pooled_grads, axis=-1)
        heatmap = tf.maximum(heatmap, 0)
        max_val = tf.reduce_max(heatmap)
        heatmap = heatmap / (max_val + 1e-8)
        return heatmap.numpy()

    def generate_overlay(
        self,
        image_path: Path,
        target_class: str,
    ) -> tuple[np.ndarray, np.ndarray]:
        """
        Build an RGB overlay (uint8) of the heatmap on the original X-ray.

        Returns:
            (overlay_rgb, heatmap) where heatmap is normalized in [0, 1].
        """
        original = Image.open(image_path).convert("RGB")
        original_size = original.size

        batch = preprocess_image(image_path, self.config.img_size)
        heatmap = self.compute_heatmap(batch, target_class)

        heatmap_img = Image.fromarray(np.uint8(heatmap * 255)).resize(
            original_size,
            Image.Resampling.BILINEAR,
        )
        heatmap_rgb = _JET_LUT[np.array(heatmap_img, dtype=np.uint8)]

        original_rgb = np.asarray(original, dtype=np.float32)
        alpha = self.config.overlay_alpha
        blended = (1.0 - alpha) * original_rgb + alpha * heatmap_rgb.astype(np.float32)
        return np.clip(blended, 0, 255).astype(np.uint8), heatmap

    def save_overlay(
        self,
        image_path: Path,
        target_class: str,
        output_path: Path,
    ) -> tuple[Path, np.ndarray]:
        """Save Grad-CAM overlay and return (output_path, raw heatmap)."""
        output_path.parent.mkdir(parents=True, exist_ok=True)
        overlay, heatmap = self.generate_overlay(image_path, target_class)
        Image.fromarray(overlay).save(output_path, format="PNG")
        logger.info(
            "Grad-CAM: saved overlay for %s (class=%s) -> %s",
            image_path.name,
            target_class,
            output_path,
        )
        return output_path, heatmap
