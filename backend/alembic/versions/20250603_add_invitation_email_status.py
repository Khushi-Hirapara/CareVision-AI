"""Add email delivery tracking to patient_invitations."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_inv_email_status"
down_revision: Union[str, None] = "20250603_add_patient_invitations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "patient_invitations",
        sa.Column("email_status", sa.String(length=32), nullable=True),
    )
    op.add_column(
        "patient_invitations",
        sa.Column("email_error_log", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("patient_invitations", "email_error_log")
    op.drop_column("patient_invitations", "email_status")
