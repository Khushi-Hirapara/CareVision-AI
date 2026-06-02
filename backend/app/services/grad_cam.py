"""Grad-CAM heatmap generation and persistence for uploaded chest X-rays."""

from __future__ import annotations

import logging
from functools import lru_cache
from pathlib import Path

from app.core.config import Settings
from app.services.ml_inference import get_classifier
from model.grad_cam import GradCamConfig, GradCamGenerator

logger = logging.getLogger(__name__)


@lru_cache
def get_grad_cam_generator(
    model_path: str,
    img_size: int,
    threshold: float,
    grad_cam_layer_name: str | None,
) -> GradCamGenerator:
    classifier = get_classifier(model_path, img_size, threshold)
    model = classifier.get_model()
    layer_name = (grad_cam_layer_name or "").strip() or None

    logger.info(
        "Initializing Grad-CAM for model %s (input=%s, layer_name=%s)",
        model_path,
        model.input_shape,
        layer_name or "auto",
    )

    config = GradCamConfig(img_size=img_size)
    return GradCamGenerator(
        model,
        config=config,
        layer_name=layer_name,
    )


def heatmap_output_path(source_image: Path, settings: Settings) -> Path:
    heatmap_dir = settings.upload_path / "heatmaps"
    heatmap_dir.mkdir(parents=True, exist_ok=True)
    return heatmap_dir / f"{source_image.stem}_heatmap.png"


def generate_grad_cam_heatmap(
    image_path: Path,
    target_class: str,
    settings: Settings,
) -> Path:
    """
    Generate a Grad-CAM overlay for the predicted class and save it under uploads/heatmaps/.

    Args:
        image_path: Stored upload path for the chest X-ray.
        target_class: Model label ("NORMAL" or "PNEUMONIA").
        settings: Application settings (model path, input size, upload dir).

    Returns:
        Path to the saved overlay PNG.

    Raises:
        Exception: Propagates failures from model load or overlay generation (logged first).
    """
    try:
        generator = get_grad_cam_generator(
            str(settings.resolved_model_path),
            settings.model_input_size,
            settings.prediction_threshold,
            settings.grad_cam_layer_name,
        )
        output_path = heatmap_output_path(image_path, settings)
        return generator.save_overlay(image_path, target_class, output_path)
    except Exception:
        logger.exception(
            "Grad-CAM overlay failed for %s (target_class=%s, layer=%s)",
            image_path,
            target_class,
            settings.grad_cam_layer_name or "auto",
        )
        raise


def try_generate_grad_cam_heatmap(
    image_path: Path,
    target_class: str,
    settings: Settings,
) -> Path | None:
    """
    Generate Grad-CAM when enabled; on failure log and return None so prediction can continue.
    """
    if not settings.enable_grad_cam:
        logger.debug("Grad-CAM disabled (ENABLE_GRAD_CAM=false)")
        return None

    try:
        return generate_grad_cam_heatmap(image_path, target_class, settings)
    except Exception:
        logger.warning(
            "Grad-CAM skipped for %s; prediction will continue without heatmap_path",
            image_path,
        )
        return None
