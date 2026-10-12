"""add_rated_speed_mpm

Revision ID: 0e995fe3deb2
Revises: a5ba7fce40ba
Create Date: 2026-10-11 03:14:07.266250

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0e995fe3deb2'
down_revision: Union[str, None] = 'a5ba7fce40ba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('machines', sa.Column('rated_speed_mpm', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('machines', 'rated_speed_mpm')
