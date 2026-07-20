"""Add follow_up_recommendation column to scans."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20250603_scan_follow_up"
down_revision: Union[str, None] = "20250603_add_scan_ai_findings"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_NORMAL = (
    "Continue routine health monitoring. Consult a healthcare professional if symptoms persist."
)
_MILD = (
    "Consult a healthcare professional for clinical correlation. "
    "Follow-up may be needed if symptoms continue."
)
_MODERATE = (
    "Medical consultation is recommended. A follow-up chest X-ray may be considered "
    "based on doctor''s advice."
)
_SEVERE = (
    "Urgent medical evaluation is recommended. Please consult a qualified healthcare "
    "professional as soon as possible."
)


def upgrade() -> None:
    op.add_column(
        "scans",
        sa.Column("follow_up_recommendation", sa.Text(), nullable=False, server_default=_NORMAL),
    )
    op.execute(
        f"""
        UPDATE scans
        SET follow_up_recommendation = CASE
            WHEN LOWER(prediction) IN ('normal') THEN '{_NORMAL}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Mild' THEN '{_MILD}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Moderate' THEN '{_MODERATE}'
            WHEN LOWER(prediction) IN ('pneumonia') AND severity = 'Severe' THEN '{_SEVERE}'
            WHEN LOWER(prediction) IN ('pneumonia') THEN '{_MILD}'
            ELSE '{_NORMAL}'
        END
        """
    )


def downgrade() -> None:
    op.drop_column("scans", "follow_up_recommendation")
