import pytest
from pydantic import ValidationError

from app.schemas.patient import AcceptInvitationBody


def test_accept_invitation_passwords_must_match() -> None:
    with pytest.raises(ValidationError) as exc_info:
        AcceptInvitationBody(
            name="John Doe",
            password="password123",
            confirm_password="different",
        )
    errors = exc_info.value.errors()
    assert any("password" in str(e.get("msg", "")).lower() for e in errors)


def test_accept_invitation_valid_body() -> None:
    body = AcceptInvitationBody(
        name="John Doe",
        password="password123",
        confirm_password="password123",
    )
    assert body.name == "John Doe"
