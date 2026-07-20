"""Add scan_notes table for doctor notes on scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_scan_notes"
down_revision: Union[str, None] = "20250603_add_roles_and_patients"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scan_notes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("scan_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("note_text", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["scan_id"], ["scans.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scan_notes_doctor_id"), "scan_notes", ["doctor_id"], unique=False)
    op.create_index(op.f("ix_scan_notes_scan_id"), "scan_notes", ["scan_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_scan_notes_scan_id"), table_name="scan_notes")
    op.drop_index(op.f("ix_scan_notes_doctor_id"), table_name="scan_notes")
    op.drop_table("scan_notes")
