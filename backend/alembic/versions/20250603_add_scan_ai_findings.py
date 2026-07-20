"""Add ai_findings column to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_add_scan_ai_findings"
down_revision: Union[str, None] = "20250603_add_scan_severity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NORMAL_FINDINGS = (
    "AI analysis does not show obvious pneumonia-like opacity patterns in this chest X-ray."
)
_MILD_FINDINGS = (
    "AI analysis detected mild pneumonia-like opacity patterns. "
    "Findings may require clinical correlation."
)
_MODERATE_FINDINGS = (
    "AI analysis detected moderate pneumonia-like opacity patterns with noticeable "
    "abnormal lung opacity."
)
_SEVERE_FINDINGS = (
    "AI analysis detected strong pneumonia-like opacity patterns with high model confidence."
)


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column("ai_findings", sa.Text(), nullable=False, server_default=_NORMAL_FINDINGS),
    )
    op.execute(
        f"""
        UPDATE scans
        SET ai_findings = CASE
            WHEN LOWER(prediction) IN ('normal') THEN '{_NORMAL_FINDINGS}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Mild' THEN '{_MILD_FINDINGS}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Moderate' THEN '{_MODERATE_FINDINGS}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Severe' THEN '{_SEVERE_FINDINGS}'
            WHEN LOWER(prediction) IN ('pneumonia') THEN '{_MILD_FINDINGS}'
            ELSE '{_NORMAL_FINDINGS}'
        END
        """
    )


def downgrade() -> None:
    op.drop_column("scans", "ai_findings")
