from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr


class UserCreate(UserBase):
    """Internal user creation — role is set by service layer, not public signup."""

    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., max_length=32)

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str) -> str:
        from app.core.roles import VALID_ROLES

        normalized = value.strip().lower()
        if normalized not in VALID_ROLES:
            raise ValueError(f"role must be one of: {', '.join(sorted(VALID_ROLES))}")
        return normalized


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    created_at: datetime


class UserInDB(UserResponse):
    hashed_password: str
