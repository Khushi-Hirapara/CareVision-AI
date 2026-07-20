from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


class PatientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    age: int | None = Field(default=None, ge=0, le=150)
    gender: str | None = Field(default=None, min_length=1, max_length=32)
    phone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = None


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    age: int | None = Field(default=None, ge=0, le=150)
    gender: str | None = Field(default=None, min_length=1, max_length=32)
    phone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = None


class PatientResponse(PatientBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    user_id: int | None
    created_at: datetime


class PatientListResponse(BaseModel):
    items: list[PatientResponse]
    total: int


class CreateInvitationRequest(BaseModel):
    patient_email: EmailStr
    patient_name: str | None = Field(default=None, max_length=255)


class PatientInvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    doctor_id: int
    patient_name: str | None
    email: str
    status: str
    created_at: datetime
    expires_at: datetime
    accepted_at: datetime | None = None
    email_status: str | None = None
    email_error_log: str | None = None


class InvitationStatusGroup(BaseModel):
    items: list[PatientInvitationResponse]
    total: int


class PatientInvitationsGroupedResponse(BaseModel):
    pending: InvitationStatusGroup
    accepted: InvitationStatusGroup
    expired: InvitationStatusGroup
    cancelled: InvitationStatusGroup


class CreateInvitationResponse(BaseModel):
    message: str
    invitation: PatientInvitationResponse


class ResendInvitationResponse(BaseModel):
    message: str
    invitation: PatientInvitationResponse


class CancelInvitationResponse(BaseModel):
    message: str
    invitation: PatientInvitationResponse


class InvitationAcceptPreviewResponse(BaseModel):
    email: str
    patient_name: str | None
    doctor_name: str
    status: str
    expires_at: datetime


class AcceptInvitationBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    @model_validator(mode="after")
    def passwords_match(self) -> "AcceptInvitationBody":
        if self.password != self.confirm_password:
            raise ValueError("password and confirm_password must match.")
        return self


class AcceptInvitationResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
