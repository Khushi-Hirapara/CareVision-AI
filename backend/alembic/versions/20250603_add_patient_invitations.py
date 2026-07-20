"""Patient invitations table and nullable patient profile fields."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_patient_invitations"
down_revision: Union[str, None] = "20250603_scan_follow_up"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "patient_invitations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("patient_name", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("accepted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(
        op.f("ix_patient_invitations_doctor_id"),
        "patient_invitations",
        ["doctor_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_patient_invitations_email"),
        "patient_invitations",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_patient_invitations_status"),
        "patient_invitations",
        ["status"],
        unique=False,
    )
    op.create_index(
        op.f("ix_patient_invitations_token"),
        "patient_invitations",
        ["token"],
        unique=True,
    )

    op.alter_column("patients", "age", existing_type=sa.Integer(), nullable=True)
    op.alter_column("patients", "gender", existing_type=sa.String(length=32), nullable=True)
    op.alter_column("patients", "phone", existing_type=sa.String(length=32), nullable=True)


def downgrade() -> None:
    op.alter_column(
        "patients",
        "phone",
        existing_type=sa.String(length=32),
        nullable=False,
        server_default="",
    )
    op.alter_column(
        "patients",
        "gender",
        existing_type=sa.String(length=32),
        nullable=False,
        server_default="Not specified",
    )
    op.alter_column("patients", "age", existing_type=sa.Integer(), nullable=False)

    op.drop_index(op.f("ix_patient_invitations_token"), table_name="patient_invitations")
    op.drop_index(op.f("ix_patient_invitations_status"), table_name="patient_invitations")
    op.drop_index(op.f("ix_patient_invitations_email"), table_name="patient_invitations")
    op.drop_index(op.f("ix_patient_invitations_doctor_id"), table_name="patient_invitations")
    op.drop_table("patient_invitations")
