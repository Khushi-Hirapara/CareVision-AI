# CareVision AI

<p align="center">
  <strong>AI-assisted chest X-ray screening for pneumonia detection</strong><br/>
  Explainable Grad-CAM heatmaps · Scan history · Clinical-style PDF reports · 100% local deployment
</p>

<p align="center">
  <a href="#installation-guide">Installation</a> ·
  <a href="#api-endpoints">API</a> ·
  <a href="#ai-model-training">Training</a> ·
  <a href="#model-evaluation-results">Evaluation</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a>
</p>

---

## 1. Project Overview

**CareVision AI** is an end-to-end medical imaging application that analyzes chest X-rays for signs of pneumonia. It combines a **TensorFlow / Keras** classifier (EfficientNetB0 transfer learning) with a **FastAPI** backend and a **Next.js** web interface.

The system is designed for **research, education, and clinical decision-support** on your own machine—no cloud account required. Each analysis returns a prediction label, confidence score, AI-generated recommendation (with medical disclaimer), Grad-CAM explainability overlay, persistent scan history in **PostgreSQL**, and a downloadable **PDF report**.

> **Important:** CareVision AI does **not** provide a final medical diagnosis. Always consult qualified healthcare professionals.

---

## 2. Features

| Feature | Description |
|--------|-------------|
| **Pneumonia screening** | Binary classification: **Normal** vs **Pneumonia** |
| **Configurable threshold** | `PREDICTION_THRESHOLD` (default `0.90`) for sigmoid decision boundary |
| **Confidence scores** | Winning-class probability shown as a percentage |
| **Grad-CAM explainability** | Heatmap highlighting regions that influenced the model |
| **Scan history** | Search, filter, and review past analyses with thumbnails |
| **Scan detail view** | Patient info, prediction summary, images, and actions |
| **PDF reports** | Hospital-style layout with patient data, prediction, images, and disclaimer |
| **Safe recommendations** | Screening guidance without claiming a definitive diagnosis |
| **Local-first** | Backend, database, model weights, and UI run on localhost |

### Web application pages

| Route | Purpose |
|-------|---------|
| `/` | Landing page and recent scans |
| `/analyze` | Upload X-ray and view results |
| `/history` | Scan history dashboard |
| `/scans/[scanId]` | Full scan detail and PDF download |

---

## 3. Technology Stack

| Layer | Technologies |
|-------|----------------|
| **Machine learning** | TensorFlow 2.x, Keras, EfficientNetB0, Grad-CAM |
| **Backend API** | FastAPI, Uvicorn, Pydantic, SQLAlchemy |
| **Database** | PostgreSQL |
| **PDF generation** | ReportLab |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Tooling** | Python 3.10–3.13, Node.js 18+ |

---

## 4. System Architecture

CareVision AI is a **modular monorepo**: data, training, inference, API, and UI are separated but wired for local development.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CareVision AI                                   │
├─────────────┬──────────────────────┬────────────────────┬──────────────────┤
│  dataset/   │      backend/        │     frontend/      │      docs/       │
│  X-ray data │  FastAPI + Postgres  │   Next.js web UI   │  Architecture    │
│             │  inference + PDF     │                    │  Dev guides      │
└──────┬──────┴──────────┬───────────┴─────────┬──────────┴──────────────────┘
       │                 │                     │
       │    train/eval   │                     │ REST / JSON
       └────────────────►│ backend/model/      │
                         │  (.h5 weights)      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │     PostgreSQL        │
                         │  scans, users, meta   │
                         └───────────────────────┘
```

### Request flow (analysis)

1. User uploads a chest X-ray via the **frontend** (`POST /predict`).
2. **Backend** validates the file, stores it under `backend/uploads/`, and runs **TensorFlow inference**.
3. Optional **Grad-CAM** heatmap is generated and saved.
4. A **scan record** is persisted in PostgreSQL.
5. JSON response is rendered in the UI; user may open detail view or download a **PDF report**.

For deeper design notes, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 5. Installation Guide

### Prerequisites

| Tool | Version |
|------|---------|
| **Python** | 3.10–3.13 (3.11 recommended; TensorFlow does not support 3.14) |
| **Node.js** | 18+ LTS |
| **PostgreSQL** | 14+ |
| **Git** | Recent |

Optional: **NVIDIA GPU** + CUDA for faster training (CPU inference is supported).

### Repository layout

```
CareVision-AI/
├── backend/              # FastAPI app, uploads, reports
│   ├── app/              # Routes, services, schemas
│   └── model/            # Training, evaluation, chest_xray_model.h5
├── frontend/             # Next.js application
├── dataset/              # Chest X-ray splits (images not committed)
├── docs/                 # Architecture, screenshots guide
├── .env.example          # Environment template
└── README.md
```

### Quick setup (all components)

```powershell
# 1. Clone
git clone <repository-url>
cd CareVision-AI

# 2. Environment
Copy-Item .env.example .env
# Edit DATABASE_URL, MODEL_PATH, PREDICTION_THRESHOLD, CORS_ORIGINS

# 3. Frontend env
@"
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
"@ | Set-Content frontend\.env.local

# 4. Backend venv + dependencies + DB
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m scripts.init_db

# 5. Dataset + train model (see sections 8 & dataset/README.md)
python model\train_model.py

# 6. Run API (from backend/)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 7. Run UI (new terminal, from frontend/)
cd ..\frontend
npm install
npm run dev
```

Open **http://localhost:3000** (UI) and **http://localhost:8000/docs** (Swagger).

---

## 6. Backend Setup

### Environment variables

Copy `.env.example` to `.env` at the **repository root**. Key settings:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `MODEL_PATH` | Path to `chest_xray_model.h5` |
| `PREDICTION_THRESHOLD` | Sigmoid threshold (default `0.90`) |
| `ENABLE_GRAD_CAM` | Generate heatmaps when `true` |
| `UPLOAD_DIR` | Stored X-rays and heatmaps |
| `CORS_ORIGINS` | Frontend origin(s), e.g. `http://localhost:3000` |

### Database initialization

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m scripts.init_db
```

Create the PostgreSQL database and user first if they do not exist (match `DATABASE_URL` in `.env`).

### Run the API server

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

| Resource | URL |
|----------|-----|
| API base | http://localhost:8000 |
| Interactive docs | http://localhost:8000/docs |
| Uploaded images | http://localhost:8000/uploads/... |

See [backend/README.md](backend/README.md) for additional backend notes.

---

## 7. Frontend Setup

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Development

```powershell
npm run dev
```

### Production build

```powershell
npm run build
npm start
```

See [frontend/README.md](frontend/README.md) for UI-specific details.

---

## 8. AI Model Training

### Dataset

Place chest X-ray images under `dataset/` using the Kaggle **Chest X-Ray Images (Pneumonia)** layout. See [dataset/README.md](dataset/README.md) for download and `prepare_dataset.py` instructions.

```
dataset/
  train/
    NORMAL/
    PNEUMONIA/
  test/
    NORMAL/
    PNEUMONIA/
```

> Training uses an **80/20 split from `dataset/train`** for train/validation. The optional `dataset/val` folder is not required by the default training script.

### Train

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\train_model.py
```

**Model architecture:** EfficientNetB0 backbone (ImageNet weights), frozen head training, then fine-tuning of top layers. Preprocessing uses `tensorflow.keras.applications.efficientnet.preprocess_input` on 224×224 RGB images.

**Outputs:**

| Artifact | Location |
|----------|----------|
| Best weights | `backend/model/chest_xray_model.h5` |
| Training curves | `backend/model/training_history.png` |
| Debug histogram | `backend/model/raw_output_histogram.png` (after `debug_model_predictions.py`) |

### Optional flags

```powershell
# Class weights (env USE_CLASS_WEIGHTS or CLI)
python model\train_model.py --use-class-weights

# Custom epochs
python model\train_model.py --epochs 20 --fine-tune-epochs 10
```

### Evaluate

```powershell
python model\evaluate_model.py
python model\evaluate_model.py --threshold 0.90
python model\evaluate_thresholds.py
python model\debug_model_predictions.py
```

Align API behavior with evaluation by setting `PREDICTION_THRESHOLD` in `.env` to the same value used in `evaluate_model.py --threshold`.

---

## 9. API Endpoints

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `POST` | `/predict` | Upload X-ray (`multipart/form-data`: `file`, optional `patient_name`) |
| `GET` | `/scans` | List scan history (`?skip=0&limit=50`) |
| `GET` | `/scans/{id}` | Single scan details |
| `GET` | `/scans/{id}/report` | Download PDF report |

### Example: predict

```bash
curl -X POST "http://localhost:8000/predict" \
  -F "file=@chest_xray.jpeg" \
  -F "patient_name=Jane Doe"
```

### Example response (`POST /predict`)

```json
{
  "scan_id": 12,
  "prediction": "Pneumonia",
  "confidence": 94.2,
  "recommendation": "A possible pneumonia pattern was detected...",
  "image_path": "backend/uploads/...",
  "heatmap_path": "backend/uploads/heatmaps/..."
}
```

---

## 10. Screenshots

Add UI captures under `docs/images/` and reference them here. See [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) for filenames and capture tips.

| Screenshot | File | Description |
|------------|------|-------------|
| Home | `docs/images/home.png` | Landing page |
| Analyze upload | `docs/images/analyze-upload.png` | X-ray upload panel |
| Analyze results | `docs/images/analyze-results.png` | Prediction + Grad-CAM |
| Scan history | `docs/images/history.png` | History cards with search/filter |
| Scan detail | `docs/images/report.png` | Scan detail view |
| PDF report | `docs/images/report-pdf.png` | Generated PDF (optional) |

<!-- Uncomment when images are added:

![Home](docs/images/home.png)
![Analyze results](docs/images/analyze-results.png)
![Scan history](docs/images/history.png)
![Scan detail](docs/images/report.png)

-->

---

## 11. Model Evaluation Results

Metrics depend on your dataset, training run, and **decision threshold**. Reproduce results on your machine with the commands below.

### How to evaluate

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\evaluate_model.py --threshold 0.90
python model\evaluate_thresholds.py
```

Scripts report **accuracy**, **precision**, **recall**, **F1**, and a **confusion matrix** on `dataset/test`.

### Example benchmark (reference run)

Representative results after EfficientNetB0 training on the Kaggle pneumonia dataset (your numbers may vary):

| Metric | Test @ threshold 0.50 | Notes |
|--------|----------------------|--------|
| **Accuracy** | ~0.84 | Full test split |
| **Class balance** | Pneumonia-heavy at 0.50 | Many false positives on NORMAL |
| **Recommended threshold** | **0.80 – 0.90** | Fewer false positives; aligns with `PREDICTION_THRESHOLD=0.90` |
| **Sigmoid spread** | Healthy (not collapsed) | After EfficientNet preprocessing fix + retrain |

### Threshold comparison (illustrative)

Use `evaluate_thresholds.py` for a full table. Higher thresholds generally **increase precision** on the Pneumonia class at the cost of recall:

| Threshold | Typical effect |
|-----------|----------------|
| 0.50 | Higher recall; more Normal cases flagged as Pneumonia |
| 0.80 | Balanced trade-off for screening |
| 0.90 | Stricter Pneumonia calls; fewer false positives (default in `.env`) |

### Training artifacts

| File | Purpose |
|------|---------|
| `backend/model/training_history.png` | Loss and AUC curves per epoch |
| `backend/model/raw_output_histogram.png` | Sigmoid output distribution (debug script) |

> Replace this section with your own metrics after training by pasting output from `evaluate_model.py` and `evaluate_thresholds.py`.

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flows |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Extended development guide |
| [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md) | Screenshot checklist |
| [dataset/README.md](dataset/README.md) | Dataset layout and Kaggle import |
| [backend/README.md](backend/README.md) | API and model paths |
| [frontend/README.md](frontend/README.md) | Frontend development |

---

## Disclaimer

CareVision AI is intended for **research, education, and decision-support** unless independently validated for regulated clinical use. Model output is **not a final diagnosis**. When using real patient data, comply with **HIPAA**, **GDPR**, and applicable local regulations.

---

## License

License to be specified by the project maintainers.
