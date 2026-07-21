"""Quick smoke test for Health Assistant modules."""
from app.services.emergency_service import is_emergency_message
from app.services.knowledge_service import select_relevant_knowledge
from app.models.chat_conversation import ChatConversation
from app.models.chat_message import ChatMessage

assert is_emergency_message("I can't breathe") is True
assert is_emergency_message("Explain my report") is False
assert len(select_relevant_knowledge("What is pneumonia?")) >= 1
assert ChatConversation.__tablename__ == "chat_conversations"
assert ChatMessage.__tablename__ == "chat_messages"
print("health_assistant_smoke_ok")
