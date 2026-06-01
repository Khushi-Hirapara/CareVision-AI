# CareVision AI

**Deep learning–based chest X-ray analysis for pneumonia detection** with AI-assisted diagnostic insights, confidence scoring, Grad-CAM visual explanations, scan history, and PDF reports.

---

## Overview

CareVision AI helps clinicians and researchers analyze chest X-ray images using a trained convolutional neural network. The system classifies studies for pneumonia indicators, surfaces model confidence, explains predictions with **Grad-CAM** heatmaps, stores **scan history** in PostgreSQL, and generates downloadable **PDF reports**.

> **Status:** Project scaffolding and documentation are in place. Application code for `backend/`, `frontend/`, and `model/` will be added in subsequent development phases.

---

## Features

| Feature | Description |
|---------|-------------|
| **Pneumonia detection** | Binary (extensible) classification from chest X-ray images |
| **Confidence scores** | Probability-based scores for model transparency |
| **AI-assisted insights** | Structured diagnostic hints to support review (not a replacement for clinical judgment) |
| **Grad-CAM explanations** | Visual attribution maps highlighting influential image regions |
| **Scan history** | Persistent record of analyses via PostgreSQL |
| **PDF reports** | Exportable summaries for documentation or research |

---

## Repository Structure

```
CareVision-AI/
├── backend/      # REST API, auth, uploads, inference orchestration, PDF generation
├── frontend/     # Web UI for upload, results, explainability, and history
├── model/        # Training, evaluation, inference, and Grad-CAM utilities
├── dataset/      # Raw and processed X-ray data (not committed to Git)
├── docs/         # Architecture and development documentation
├── .env.example  # Environment variable template
├── .gitignore
└── README.md
```

---

## Documentation

| Document | Contents |
|----------|----------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System design, components, data flows, security notes |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Prerequisites, PostgreSQL, Python/Node setup, local workflow |

---

## Quick Start (Local Development)

### 1. Prerequisites

- Python 3.10+
- Node.js 18+ (LTS)
- PostgreSQL 14+
- Git

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for optional GPU/CUDA and Docker notes.

### 2. Environment configuration

```bash
# Clone the repository
git clone <repository-url>
cd CareVision-AI

# Create local environment file (Windows PowerShell)
Copy-Item .env.example .env
# macOS / Linux: cp .env.example .env
```

Edit `.env` with your database credentials, `SECRET_KEY`, and API URLs. See [.env.example](./.env.example) for all variables.

### 3. Database

Create a PostgreSQL database and user, then set `DATABASE_URL` in `.env`. Detailed steps are in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md#2-postgresql-setup).

### 4. Dataset & model

- Place chest X-ray data under `dataset/` (see `.gitignore`; raw data is not versioned).
- Train or place model weights at the path defined by `MODEL_PATH` once training scripts exist under `model/`.

### 5. Run services (when implemented)

```bash
# Python virtual environment (from project root)
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
# source .venv/bin/activate      # macOS / Linux

# Backend & frontend commands will be documented in each directory
# once application code is added.
```

---

## Architecture (Summary)

```
User → frontend/ → backend/ → model/ (TensorFlow inference + Grad-CAM)
                      ↓
                 PostgreSQL (scan history, metadata)
```

Full diagrams, sequence flows, and extension points: **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

---

## Technology Stack

| Layer | Planned technology |
|-------|-------------------|
| ML | TensorFlow / Keras |
| API | Python |
| Database | PostgreSQL |
| Client | Node.js (e.g. React + Vite) |
| Explainability | Grad-CAM |

---

## Configuration

All environment-specific settings use a root `.env` file derived from [.env.example](./.env.example). Never commit secrets or production credentials.

---

## Disclaimer

CareVision AI is intended for **research, education, and decision-support demonstrations** unless explicitly validated and deployed under appropriate clinical regulations. Predictions must not be used as the sole basis for medical decisions. Ensure compliance with HIPAA, GDPR, or local regulations when handling real patient data.

---

## License

License to be specified by the project maintainers.

---

## Contributing

Contribution guidelines will be added when the codebase is open for pull requests. Until then, refer to [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for the intended local workflow.
