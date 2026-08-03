# Chest X-ray dataset

Training expects this layout at the **repo root** (`CareVision-AI/dataset/`):

```
dataset/
  train/
    NORMAL/       ← .jpeg or .png images
    PNEUMONIA/
    COVID/
  val/
    NORMAL/
    PNEUMONIA/
    COVID/
  test/
    NORMAL/
    PNEUMONIA/
    COVID/
```

Image files are gitignored; only folder structure is committed.

Training requires **at least one image in each of NORMAL, PNEUMONIA, and COVID** under `train/` and `test/`.

## Option A — Kaggle “Chest X-Ray Images (Pneumonia)” + your COVID images

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

4. Add COVID X-rays into:

```
dataset/train/COVID/
dataset/val/COVID/    (optional; training splits from train/)
dataset/test/COVID/
```

5. Train:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\train_model.py
```

## Option B — Manual copy

Copy images so they match the tree above under `D:\CareVision-AI\dataset\`.

## Verify

```powershell
Test-Path D:\CareVision-AI\dataset\train\NORMAL
Test-Path D:\CareVision-AI\dataset\train\PNEUMONIA
Test-Path D:\CareVision-AI\dataset\train\COVID
(Get-ChildItem D:\CareVision-AI\dataset\train\NORMAL -File).Count
(Get-ChildItem D:\CareVision-AI\dataset\train\PNEUMONIA -File).Count
(Get-ChildItem D:\CareVision-AI\dataset\train\COVID -File).Count
```

All three counts should be greater than zero before training.
