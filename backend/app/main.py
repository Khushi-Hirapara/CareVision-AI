"""
CareVision AI — FastAPI application entry point.

Run from backend/:
    uvicorn app.main:app --reload
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Ensure upload and report directories exist on startup."""
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    (settings.upload_path / "heatmaps").mkdir(parents=True, exist_ok=True)
    settings.reports_path.mkdir(parents=True, exist_ok=True)
    yield


def create_app() -> FastAPI:
    logging.basicConfig(
        level=logging.DEBUG if settings.debug else logging.INFO,
        format="%(levelname)s %(name)s: %(message)s",
    )

    application = FastAPI(
        title=settings.app_name,
        description="Chest X-ray pneumonia analysis API for CareVision AI.",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    # CORS for local frontend (Next.js on localhost:3000)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    application.include_router(api_router)

    application.mount(
        "/uploads",
        StaticFiles(directory=settings.upload_path),
        name="uploads",
    )

    return application


app = create_app()
