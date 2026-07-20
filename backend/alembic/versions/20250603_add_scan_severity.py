"""Add severity column to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_scan_severity"
down_revision: Union[str, None] = "20250603_add_scan_model_version"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column("severity", sa.String(length=32), nullable=False, server_default="None"),
    )
    op.execute(
        """
        UPDATE scans
        SET severity = CASE
            WHEN LOWER(prediction) IN ('normal') THEN 'None'
            WHEN LOWER(prediction) IN ('pneumonia') AND confidence < 0.7 THEN 'Mild'
            WHEN LOWER(prediction) IN ('pneumonia') AND confidence >= 0.7 AND confidence < 0.9 THEN 'Moderate'
            WHEN LOWER(prediction) IN ('pneumonia') AND confidence >= 0.9 THEN 'Severe'
            ELSE 'None'
        END
        """
    )


def downgrade() -> None:
    op.drop_column("scans", "severity")
