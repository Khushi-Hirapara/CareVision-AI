"""Tests for pre-inference image quality validation."""

from pathlib import Path

import numpy as np
import pytest
from PIL import Image

from app.services.image_quality import validate_image_quality


def _save_gray(path: Path, gray: np.ndarray) -> None:
    Image.fromarray(gray.astype(np.uint8), mode="L").save(path)


def _save_rgb(path: Path, rgb: np.ndarray) -> None:
    Image.fromarray(rgb.astype(np.uint8), mode="RGB").save(path)


def test_sharp_portrait_xray_passes(tmp_path: Path):
    gray = np.linspace(40, 220, 512 * 640, dtype=np.float32).reshape(640, 512)
    gray += np.random.default_rng(0).normal(0, 8, gray.shape)
    path = tmp_path / "good.png"
    _save_gray(path, gray)
    report = validate_image_quality(path)
    assert report.passed, report.summary()


def test_dark_image_rejected(tmp_path: Path):
    gray = np.full((400, 400), 12, dtype=np.float32)
    path = tmp_path / "dark.png"
    _save_gray(path, gray)
    report = validate_image_quality(path)
    assert not report.passed
    assert any(i.code == "too_dark" for i in report.issues)


def test_blurred_image_rejected(tmp_path: Path):
    gray = np.full((400, 400), 120, dtype=np.float32)
    path = tmp_path / "blur.png"
    _save_gray(path, gray)
    report = validate_image_quality(path)
    assert not report.passed
    assert any(i.code == "blurred" for i in report.issues)


def test_low_resolution_rejected(tmp_path: Path):
    gray = np.random.default_rng(1).integers(60, 200, (180, 180), dtype=np.uint8)
    path = tmp_path / "small.png"
    _save_gray(path, gray.astype(np.float32))
    report = validate_image_quality(path)
    assert not report.passed
    assert any(i.code == "low_resolution" for i in report.issues)


def test_landscape_orientation_rejected(tmp_path: Path):
    gray = np.random.default_rng(2).integers(50, 210, (320, 640), dtype=np.uint8).astype(np.float32)
    path = tmp_path / "landscape.png"
    _save_gray(path, gray)
    report = validate_image_quality(path)
    assert not report.passed
    assert any(i.code == "wrong_orientation" for i in report.issues)


def test_color_photo_rejected(tmp_path: Path):
    rgb = np.zeros((480, 480, 3), dtype=np.float32)
    rgb[:, :, 0] = 220
    rgb[:, :, 1] = 80
    rgb[:, :, 2] = 40
    path = tmp_path / "color.jpg"
    _save_rgb(path, rgb)
    report = validate_image_quality(path)
    assert not report.passed
    assert any(i.code == "non_chest" for i in report.issues)
