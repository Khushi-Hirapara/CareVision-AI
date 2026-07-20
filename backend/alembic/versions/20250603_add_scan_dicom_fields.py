"""Add original_path and dicom_metadata columns to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_scan_dicom"
down_revision: Union[str, None] = "20250603_scan_observed_regions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column("original_path", sa.String(length=512), nullable=True),
    )
    op.add_column(
        "scans",
        sa.Column("dicom_metadata", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("scans", "dicom_metadata")
    op.drop_column("scans", "original_path")
