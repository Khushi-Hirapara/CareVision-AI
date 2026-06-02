# Chest X-ray dataset

Training expects this layout at the **repo root** (`CareVision-AI/dataset/`):

```
dataset/
  train/
    NORMAL/       ← .jpeg or .png images
    PNEUMONIA/
  val/
    NORMAL/
    PNEUMONIA/
  test/
    NORMAL/
    PNEUMONIA/
```

Image files are gitignored; only folder structure is committed.

## Option A — Kaggle “Chest X-Ray Images (Pneumonia)”

1. Download from [Kaggle: Chest X-Ray Images (Pneumonia)](https://www.kaggle.com/datasets/paultimothymooney/chest-xray-pneumonia) (requires a free Kaggle account).
2. Unzip so you have a folder like `chest_xray/train`, `chest_xray/val`, `chest_xray/test`.
3. From the repo root, run:

```powershell
cd D:\CareVision-AI
py -3.11 backend\model\prepare_dataset.py --source path\to\chest_xray
```

Example if you unzipped inside `dataset/raw/`:

```powershell
py -3.11 backend\model\prepare_dataset.py --source dataset\raw\chest_xray
```

4. Train:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\train_model.py
```

## Option B — Manual copy

Copy (or move) the Kaggle folders so they match the tree above under `D:\CareVision-AI\dataset\`.

## Verify

```powershell
Test-Path D:\CareVision-AI\dataset\train\NORMAL
Test-Path D:\CareVision-AI\dataset\train\PNEUMONIA
(Get-ChildItem D:\CareVision-AI\dataset\train\NORMAL -File).Count
```

Counts should be greater than zero before training.
