from app.core.config import Settings
from app.database import check_database_connection
from app.schemas.health import HealthResponse


def get_health_status(settings: Settings) -> HealthResponse:
    db_ok = check_database_connection()
    return HealthResponse(
        status="healthy",
        app_name=settings.app_name,
        environment=settings.app_env,
        database="connected" if db_ok else "disconnected",
    )
