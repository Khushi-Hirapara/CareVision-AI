from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class HealthChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)
    scan_id: int = Field(..., ge=1)
    conversation_id: Optional[int] = Field(default=None, ge=1)


class HealthChatCard(BaseModel):
    type: Literal[
        "prediction",
        "confidence",
        "severity",
        "recommendation",
        "doctor_notes",
        "comparison",
        "emergency",
        "disclaimer",
    ]
    data: dict[str, Any]


class HealthChatResponse(BaseModel):
    conversation_id: int
    user_message_id: int
    assistant_message_id: int
    answer: str
    is_emergency: bool = False
    cards: list[HealthChatCard] = Field(default_factory=list)
    disclaimer: str


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender: str
    message: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatConversationSummary(BaseModel):
    id: int
    user_id: int
    scan_id: Optional[int]
    created_at: datetime
    message_count: int = 0
    preview: Optional[str] = None

    model_config = {"from_attributes": True}


class ChatConversationDetail(BaseModel):
    id: int
    user_id: int
    scan_id: Optional[int]
    created_at: datetime
    messages: list[ChatMessageResponse]


class ChatConversationListResponse(BaseModel):
    items: list[ChatConversationSummary]
    total: int


class KnowledgeTopicResponse(BaseModel):
    id: str
    topic: str
    title: str
    summary: str


class KnowledgeArticleResponse(BaseModel):
    id: str
    topic: str
    title: str
    summary: str
    content: str


class KnowledgeListResponse(BaseModel):
    items: list[KnowledgeTopicResponse]
