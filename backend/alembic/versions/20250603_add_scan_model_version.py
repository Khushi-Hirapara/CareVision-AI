"""Add model_version column to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_scan_model_version"
down_revision: Union[str, None] = "20250603_add_scan_notes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column("model_version", sa.String(length=64), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("scans", "model_version")
