# CareVision AI

<p align="center">
  <strong>AI-assisted chest X-ray screening for pneumonia detection</strong><br/>
  Doctor–patient workflows · Grad-CAM explainability · Health assistant · DICOM · Local deployment
</p>

<p align="center">
  <a href="#installation">Installation</a> ·
  <a href="#features">Features</a> ·
  <a href="#api-overview">API</a> ·
  <a href="#ai-model-training">Training</a> ·
  <a href="docs/ARCHITECTURE.md">Architecture</a>
</p>

---

## Project overview

**CareVision AI** is an end-to-end medical imaging application that analyzes chest X-rays for signs of pneumonia. It combines a **TensorFlow / Keras** classifier (EfficientNetB0 transfer learning) with a **FastAPI** backend and a **Next.js** web interface.

The platform supports **doctor and patient roles**: doctors manage patients, run analyses, add clinical notes, and invite patients; patients view their own reports and chat with a health assistant about saved findings. Each analysis returns a prediction label, confidence score, safe recommendation (with medical disclaimer), optional Grad-CAM heatmap, and a downloadable PDF report. Data stays on your machine—**PostgreSQL**, model weights, uploads, and the UI all run locally.

> **Important:** CareVision AI does **not** provide a final medical diagnosis. Always consult qualified healthcare professionals.

---

## Features

| Feature | Description |
|--------|-------------|
| **Pneumonia screening** | Binary classification: **Normal** vs **Pneumonia** |
| **Doctor–patient workflows** | Roles, patient roster, invitations, and access control |
| **Auth** | Email/password (JWT), email verification, password reset, Google & Microsoft SSO |
| **Image formats** | JPEG, PNG, and **DICOM** (`.dcm` / `.dicom`) |
| **Image quality checks** | Optional pre-inference validation (min dimensions) |
| **Configurable threshold** | `PREDICTION_THRESHOLD` (default `0.90`) for the sigmoid decision boundary |
| **Grad-CAM explainability** | Heatmap highlighting regions that influenced the model |
| **Scan history & detail** | Search, filter, thumbnails, notes, and PDF download |
| **Patient trends** | Longitudinal views and scan comparison for doctors |
| **Scan AI chat** | Ask questions about a specific scan result |
| **Health assistant** | Gemini-powered chat that explains **saved reports only** (does not analyze images) |
| **Clinical-style PDF reports** | Hospital-style layout with prediction, images, and disclaimer |
| **Local-first** | Backend, database, model, and UI on localhost |

### Web application routes

| Route | Purpose |
|-------|---------|
| `/` | Landing / home |
| `/login`, `/register` | Sign in and registration |
| `/verify-email`, `/forgot-password`, `/reset-password` | Account recovery |
| `/auth/callback` | SSO callback |
| `/doctor/dashboard` | Doctor overview and stats |
| `/patients`, `/doctor/patients/[id]` | Patient list, detail, trends, compare, reports |
| `/analyze` | Upload X-ray for a selected patient |
| `/history`, `/scans/[scanId]` | Scan history and detail (PDF, notes, AI chat) |
| `/patient/dashboard`, `/patient/reports` | Patient portal |
| `/assistant` | Health assistant (report Q&A) |
| `/accept-invitation/[token]` | Accept doctor invitation |
| `/profile` | User profile |

---

## Technology stack

| Layer | Technologies |
|-------|----------------|
| **Machine learning** | TensorFlow 2.x, Keras, EfficientNetB0, Grad-CAM |
| **Backend API** | FastAPI, Uvicorn, Pydantic, SQLAlchemy, Alembic |
| **Auth** | JWT (python-jose), bcrypt, Authlib (Google / Microsoft OIDC) |
| **Database** | PostgreSQL |
| **Imaging** | Pillow, pydicom |
| **PDF** | ReportLab |
| **Health assistant** | Google Gemini (`google-genai`) |
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Tooling** | Python 3.10–3.13, Node.js 18+ |

---

## System architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            CareVision AI                                   │
├─────────────┬──────────────────────┬────────────────────┬──────────────────┤
│  dataset/   │      backend/        │     frontend/      │      docs/       │
│  X-ray data │  FastAPI + Postgres  │   Next.js web UI   │  Architecture    │
│             │  Auth · inference    │  Doctor / patient  │  Dev guides      │
│             │  PDF · Gemini        │                    │                  │
└──────┬──────┴──────────┬───────────┴─────────┬──────────┴──────────────────┘
       │                 │                     │
       │    train/eval   │                     │ REST / JSON
       └────────────────►│ backend/model/      │
                         │  (.h5 weights)      │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │     PostgreSQL        │
                         │  users, patients,     │
                         │  scans, notes, chat   │
                         └───────────────────────┘
```

### Analysis request flow

1. Doctor selects an accepted patient and uploads a chest X-ray (`POST /patients/{id}/predict`).
2. Backend validates the file (including optional DICOM decode and quality checks), stores it under `backend/uploads/`, and runs TensorFlow inference.
3. Optional Grad-CAM heatmap is generated and saved.
4. A scan record is persisted in PostgreSQL (linked to patient and doctor).
5. JSON is rendered in the UI; doctor or patient may open detail view, add notes, chat about the scan, or download a PDF report.

For deeper design notes, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Installation

### Prerequisites

| Tool | Version |
|------|---------|
| **Python** | 3.10–3.13 (3.11 recommended; TensorFlow does not support 3.14) |
| **Node.js** | 18+ LTS |
| **PostgreSQL** | 14+ |
| **Git** | Recent |

Optional: **NVIDIA GPU** + CUDA for faster training (CPU inference is supported). For the health assistant, a **Gemini API key** from Google AI Studio.

### Repository layout

```
CareVision-AI/
├── backend/              # FastAPI app, uploads, reports, Alembic
│   ├── app/              # Routes, services, schemas, models
│   ├── model/            # Training, evaluation, chest_xray_model.h5
│   ├── scripts/          # init_db and utilities
│   └── tests/
├── frontend/             # Next.js application
├── dataset/              # Chest X-ray splits (images not committed)
├── docs/                 # Architecture and development guides
├── .env.example          # Environment template (repo root)
└── README.md
```

### Quick setup

```powershell
# 1. Clone
git clone <repository-url>
cd CareVision-AI

# 2. Environment (repo root)
Copy-Item .env.example .env
# Edit DATABASE_URL, JWT_SECRET_KEY, MODEL_PATH, PREDICTION_THRESHOLD,
# CORS_ORIGINS, and optionally GEMINI_API_KEY / SSO credentials

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

# 5. Dataset + train model (see AI model training)
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

## Backend setup

### Environment variables

Copy `.env.example` to `.env` at the **repository root**. Configuration is loaded from that file only.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for access/refresh tokens |
| `MODEL_PATH` | Path to `chest_xray_model.h5` |
| `PREDICTION_THRESHOLD` | Sigmoid threshold (default `0.90`) |
| `ENABLE_GRAD_CAM` | Generate heatmaps when `true` |
| `ENABLE_IMAGE_QUALITY_CHECK` | Reject undersized images when `true` |
| `UPLOAD_DIR` | Stored X-rays and heatmaps |
| `CORS_ORIGINS` | Frontend origin(s), e.g. `http://localhost:3000` |
| `FRONTEND_URL` | Used for invitation and email links |
| `GEMINI_API_KEY` | Health assistant (optional; leave empty to disable) |
| `GOOGLE_*` / `MICROSOFT_*` | Optional SSO OIDC credentials |

### Database

Create the PostgreSQL database and user to match `DATABASE_URL`, then:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m scripts.init_db
```

Schema migrations live under `backend/alembic/`. Prefer Alembic for existing databases that already have data.

### Run the API

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

See [backend/README.md](backend/README.md) for additional notes.

---

## Frontend setup

```powershell
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

```powershell
npm run dev          # development — http://localhost:3000
npm run build
npm start            # production build
```

See [frontend/README.md](frontend/README.md) for UI-specific details.

---

## AI model training

### Dataset

Place chest X-ray images under `dataset/` with three classes. See [dataset/README.md](dataset/README.md).

```
dataset/
  train/
    NORMAL/
    PNEUMONIA/
    COVID/
  test/
    NORMAL/
    PNEUMONIA/
    COVID/
```

> Training uses an **80/20 split from `dataset/train`** for train/validation. The optional `dataset/val` folder is not required by the default training script. Each class needs at least one image in `train/` and `test/`.

### Train

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\train_model.py
```

**Architecture:** EfficientNetB0 (ImageNet weights), frozen head training, then fine-tuning of top layers. Softmax over **NORMAL / PNEUMONIA / COVID**. Images are preprocessed with `efficientnet.preprocess_input` at **224×224** RGB.

| Artifact | Location |
|----------|----------|
| Best weights | `backend/model/chest_xray_model.h5` |
| Training curves | `backend/model/training_history.png` |

```powershell
# Optional: class weights / custom epochs
python model\train_model.py --use-class-weights
python model\train_model.py --epochs 20 --fine-tune-epochs 10
```

### Evaluate

```powershell
python model\evaluate_model.py
python model\evaluate_thresholds.py
python model\debug_model_predictions.py
```

Prediction uses **argmax over softmax** (NORMAL / PNEUMONIA / COVID). `PREDICTION_THRESHOLD` is unused for the new 3-class model.

---

## API overview

Base URL: `http://localhost:8000`  
Interactive OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)

Most endpoints require `Authorization: Bearer <access_token>` after login.

| Area | Examples |
|------|----------|
| **Health** | `GET /health` |
| **Auth** | `POST /auth/register`, `/login`, `/refresh`, `/logout`, `/me`, email verify & password reset, `/auth/sso/...` |
| **Dashboard** | `GET /dashboard/doctor-stats`, `/dashboard/patient-stats` |
| **Patients** | CRUD under `/patients`, invitations, `POST /patients/{id}/predict` |
| **Invitations** | `GET/POST /patient-invitations/accept/{token}` |
| **Scans** | `GET /scans`, `/scans/{id}`, `/scans/{id}/report`, notes, `/scans/{id}/ai-chat` |
| **Patient portal** | `GET /my/scans`, `/my/scans/{id}`, report, notes, AI chat |
| **Health assistant** | `POST /health-assistant/chat`, conversations, knowledge articles |

### Analyze a patient X-ray

```bash
curl -X POST "http://localhost:8000/patients/1/predict" \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@chest_xray.jpeg"
```

> `POST /predict` is **deprecated**. Doctors must analyze via `POST /patients/{patient_id}/predict` after selecting an accepted patient.

---

## Model evaluation

Metrics depend on your dataset, training run, and **decision threshold**. Reproduce on your machine:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python model\evaluate_model.py --threshold 0.90
python model\evaluate_thresholds.py
```

Scripts report **accuracy**, **precision**, **recall**, **F1**, and a **confusion matrix** on `dataset/test`.

| Threshold | Typical effect |
|-----------|----------------|
| 0.50 | Higher recall; more Normal cases flagged as Pneumonia |
| 0.80 | Balanced trade-off for screening |
| 0.90 | Stricter Pneumonia calls; fewer false positives (default in `.env`) |

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flows |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Extended development guide |
| [dataset/README.md](dataset/README.md) | Dataset layout and Kaggle import |
| [backend/README.md](backend/README.md) | API and backend setup |
| [frontend/README.md](frontend/README.md) | Frontend development |

---

## Disclaimer

CareVision AI is intended for **research, education, and decision-support** unless independently validated for regulated clinical use. Model output is **not a final diagnosis**. The health assistant explains saved reports only and must not be treated as clinical advice. When using real patient data, comply with **HIPAA**, **GDPR**, and applicable local regulations.

---

## License

License to be specified by the project maintainers.
