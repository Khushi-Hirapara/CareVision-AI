"""
Copy Kaggle-style chest_xray splits into CareVision-AI/dataset/.

Source may contain NORMAL/ and PNEUMONIA/ (Kaggle pneumonia dataset).
COVID/ is optional in the source; empty COVID folders are created at the target
so you can add COVID images before training.

Usage:
    py -3.11 backend/model/prepare_dataset.py --source path/to/chest_xray
"""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

REQUIRED_SOURCE_CLASSES = ("NORMAL", "PNEUMONIA")
ALL_CLASSES = ("NORMAL", "PNEUMONIA", "COVID")
SPLITS = ("train", "val", "test")

MODEL_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = MODEL_DIR.parent.parent
DEFAULT_TARGET = PROJECT_ROOT / "dataset"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare dataset/ from a chest_xray download.")
    parser.add_argument(
        "--source",
        type=Path,
        required=True,
        help="Path to unzipped chest_xray folder (contains train/, val/, test/).",
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help="Destination dataset root (default: repo dataset/).",
    )
    parser.add_argument(
        "--copy",
        action="store_true",
        help="Copy files instead of creating directory junctions/symlinks on Windows.",
    )
    return parser.parse_args()


def _validate_source(source: Path) -> None:
    if not source.is_dir():
        raise FileNotFoundError(f"Source not found: {source}")
    for split in SPLITS:
        split_dir = source / split
        if not split_dir.is_dir():
            raise FileNotFoundError(f"Missing split in source: {split_dir}")
        for class_name in REQUIRED_SOURCE_CLASSES:
            class_dir = split_dir / class_name
            if not class_dir.is_dir():
                raise FileNotFoundError(f"Missing class folder: {class_dir}")
            if not any(class_dir.iterdir()):
                raise FileNotFoundError(f"No images in {class_dir}")


def _link_or_copy(src: Path, dst: Path, use_copy: bool) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        if dst.is_dir() and not any(dst.iterdir()):
            dst.rmdir()
        elif dst.exists():
            print(f"  skip (exists): {dst}")
            return
    if use_copy:
        if src.is_dir():
            shutil.copytree(src, dst)
        else:
            shutil.copy2(src, dst)
    else:
        try:
            dst.symlink_to(src, target_is_directory=src.is_dir())
        except OSError:
            if src.is_dir():
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)


def prepare(source: Path, target: Path, use_copy: bool) -> None:
    _validate_source(source)
    print(f"Source:  {source.resolve()}")
    print(f"Target:  {target.resolve()}")
    for split in SPLITS:
        for class_name in ALL_CLASSES:
            src = source / split / class_name
            dst = target / split / class_name
            if src.is_dir() and any(src.iterdir()):
                print(f"Linking {split}/{class_name} ...")
                _link_or_copy(src, dst, use_copy)
            else:
                dst.mkdir(parents=True, exist_ok=True)
                if class_name == "COVID":
                    print(
                        f"Created empty {split}/COVID/ — add COVID X-ray images here before training."
                    )
                else:
                    print(f"Created empty {split}/{class_name}/ (source missing).")
    print("\nDone. Add COVID images under dataset/*/COVID/, then:")
    print("  cd backend && python model/train_model.py")


def main() -> None:
    args = parse_args()
    prepare(args.source.resolve(), args.target.resolve(), args.copy)


if __name__ == "__main__":
    main()
