from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., examples=["healthy"])
    app_name: str
    environment: str
    database: str = Field(
        ...,
        description="Database connectivity: connected | disconnected",
    )
