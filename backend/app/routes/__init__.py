from fastapi import APIRouter

from app.routes.health import router as health_router
from app.routes.predict import router as predict_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(predict_router, tags=["predict"])

__all__ = ["api_router", "health_router", "predict_router"]
