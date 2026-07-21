"""Add Google and Microsoft identity subjects to users."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250721_sso_identities"
down_revision: Union[str, None] = "20250721_auth_tokens"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("google_subject", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("microsoft_subject", sa.String(length=255), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_google_subject",
        "users",
        ["google_subject"],
    )
    op.create_unique_constraint(
        "uq_users_microsoft_subject",
        "users",
        ["microsoft_subject"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "uq_users_microsoft_subject",
        "users",
        type_="unique",
    )
    op.drop_constraint(
        "uq_users_google_subject",
        "users",
        type_="unique",
    )
    op.drop_column("users", "microsoft_subject")
    op.drop_column("users", "google_subject")
