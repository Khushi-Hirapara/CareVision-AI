"""Role-based patient management schema changes."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_roles_and_patients"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sa.String(length=32), server_default="doctor", nullable=False),
    )

    op.create_table(
        "patients",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("age", sa.Integer(), nullable=False),
        sa.Column("gender", sa.String(length=32), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["doctor_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_patients_doctor_id"), "patients", ["doctor_id"], unique=False)
    op.create_index(op.f("ix_patients_user_id"), "patients", ["user_id"], unique=False)

    op.add_column("scans", sa.Column("patient_id", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_scans_patient_id"), "scans", ["patient_id"], unique=False)
    op.create_foreign_key(
        "fk_scans_patient_id_patients",
        "scans",
        "patients",
        ["patient_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    op.drop_constraint("fk_scans_patient_id_patients", "scans", type_="foreignkey")
    op.drop_index(op.f("ix_scans_patient_id"), table_name="scans")
    op.drop_column("scans", "patient_id")

    op.drop_index(op.f("ix_patients_user_id"), table_name="patients")
    op.drop_index(op.f("ix_patients_doctor_id"), table_name="patients")
    op.drop_table("patients")

    op.drop_column("users", "role")
