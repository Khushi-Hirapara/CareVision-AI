"""Add observed_regions column to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_scan_observed_regions"
down_revision: Union[str, None] = "20250603_inv_email_status"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NORMAL = "No significant opacity regions identified"
_FALLBACK = "Abnormal lung opacity; see Grad-CAM for focal areas"


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column(
            "observed_regions",
            sa.Text(),
            nullable=False,
            server_default=_NORMAL,
        ),
    )
    op.execute(
        f"""
        UPDATE scans
        SET observed_regions = CASE
            WHEN LOWER(prediction) IN ('pneumonia') THEN '{_FALLBACK}'
            ELSE '{_NORMAL}'
        END
        """
    )


def downgrade() -> None:
    op.drop_column("scans", "observed_regions")
