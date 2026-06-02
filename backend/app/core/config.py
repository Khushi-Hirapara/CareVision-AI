"""
Application settings loaded from the repository root `.env` file.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any, List

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/app/core/config.py → CareVision-AI/ (repo root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
ENV_FILE = PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="CareVision AI", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    debug: bool = Field(default=True, alias="DEBUG")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    # Backend API
    backend_host: str = Field(default="0.0.0.0", alias="BACKEND_HOST")
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")

    # CORS (frontend on localhost)
    cors_origins: str = Field(
        default="http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173",
        alias="CORS_ORIGINS",
    )

    # JWT authentication
    jwt_secret_key: str = Field(
        default="change-me-to-a-long-random-string",
        alias="JWT_SECRET_KEY",
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=60,
        alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    @model_validator(mode="before")
    @classmethod
    def map_legacy_jwt_env(cls, data: Any) -> Any:
        """Accept SECRET_KEY / ALGORITHM from older .env files."""
        if not isinstance(data, dict):
            return data
        merged = dict(data)
        if not merged.get("JWT_SECRET_KEY"):
            legacy = merged.get("SECRET_KEY")
            if legacy:
                merged["JWT_SECRET_KEY"] = legacy
        if not merged.get("JWT_ALGORITHM"):
            legacy = merged.get("ALGORITHM")
            if legacy:
                merged["JWT_ALGORITHM"] = legacy
        return merged

    # Database
    database_url: str = Field(
        default="postgresql+psycopg2://postgres:pass123@localhost:5432/carevision",
        alias="DATABASE_URL",
    )

    # Uploads & reports
    upload_dir: str = Field(default="./backend/uploads", alias="UPLOAD_DIR")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")
    allowed_image_extensions: str = Field(
        default="jpg,jpeg,png",
        alias="ALLOWED_IMAGE_EXTENSIONS",
    )
    reports_dir: str = Field(default="./backend/reports", alias="REPORTS_DIR")

    # Model inference
    model_path: str = Field(
        default="./backend/model/chest_xray_model.h5",
        alias="MODEL_PATH",
    )
    model_input_size: int = Field(default=224, alias="MODEL_INPUT_SIZE")
    prediction_threshold: float = Field(
        default=0.9,
        alias="PREDICTION_THRESHOLD",
        description="Sigmoid threshold: pneumonia_prob >= value => PNEUMONIA (else NORMAL).",
    )
    model_confidence_threshold: float = Field(
        default=0.5,
        alias="MODEL_CONFIDENCE_THRESHOLD",
        description="Deprecated: use PREDICTION_THRESHOLD for inference decisions.",
    )
    enable_grad_cam: bool = Field(default=True, alias="ENABLE_GRAD_CAM")
    grad_cam_layer_name: str | None = Field(
        default=None,
        alias="GRAD_CAM_LAYER_NAME",
        description="Optional Keras layer name for Grad-CAM (e.g. top_conv on EfficientNet).",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def strip_cors_origins(cls, value: str) -> str:
        if isinstance(value, str):
            return value
        return ",".join(value)

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def allowed_extensions_list(self) -> List[str]:
        return [
            ext.strip().lower()
            for ext in self.allowed_image_extensions.split(",")
            if ext.strip()
        ]

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path

    @property
    def reports_path(self) -> Path:
        path = Path(self.reports_dir)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path

    @property
    def resolved_model_path(self) -> Path:
        path = Path(self.model_path)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
