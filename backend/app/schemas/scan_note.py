from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScanNoteCreate(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=10000)


class ScanNoteUpdate(BaseModel):
    note_text: str = Field(..., min_length=1, max_length=10000)


class ScanNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    scan_id: int
    doctor_id: int
    note_text: str
    created_at: datetime
    updated_at: datetime


class ScanNoteListResponse(BaseModel):
    items: list[ScanNoteResponse]
