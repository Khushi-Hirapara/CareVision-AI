from fastapi import APIRouter

from app.routes.auth import router as auth_router
from app.routes.health import router as health_router
from app.routes.predict import router as predict_router
from app.routes.scans import router as scans_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router)
api_router.include_router(predict_router, tags=["predict"])
api_router.include_router(scans_router)

__all__ = [
    "api_router",
    "auth_router",
    "health_router",
    "predict_router",
    "scans_router",
]
