# CareVision AI — Backend (FastAPI)

REST API for chest X-ray pneumonia screening. **Authentication is not enabled** in this version.

## Project structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application + CORS
│   ├── core/
│   │   └── config.py        # Settings (reads repo root .env)
│   ├── database.py          # SQLAlchemy engine & sessions
│   ├── models/              # ORM models
│   ├── schemas/             # Pydantic request/response models
│   ├── routes/              # API route modules
│   └── services/            # Business logic
├── model/                   # ML training & inference (optional)
├── scripts/
│   └── init_db.py
└── requirements.txt
```

## Prerequisites

- Python **3.10–3.13** (3.11 recommended; TensorFlow does not support 3.14)
- PostgreSQL 14+
- Root `.env` file (copy from `.env.example` in the **repository root**)

## Setup

```powershell
# From repository root
Copy-Item .env.example .env
# Edit .env: DATABASE_URL, CORS_ORIGINS, MODEL_PATH, etc.

cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m scripts.init_db
```

Configuration is read only from **`CareVision-AI/.env`** at the repo root (see `app/core/config.py`).

## Run

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

| URL | Description |
|-----|-------------|
| http://127.0.0.1:8000/health | Health check |
| http://127.0.0.1:8000/docs | OpenAPI (Swagger) |

## Core endpoint

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | API and database connectivity |

Additional routes (`/predict`, `/scans`, …) are registered when those modules are present.

## CORS

Set `CORS_ORIGINS` in the root `.env` (comma-separated). Defaults include `http://localhost:3000` and `http://127.0.0.1:3000` for the Next.js frontend.

## Python version note

If `pip install` fails on TensorFlow, recreate the venv with Python 3.11:

```powershell
py -3.11 -m venv .venv
```
