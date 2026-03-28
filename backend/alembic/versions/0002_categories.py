"""categories

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-29 00:00:00.000000
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(50), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_category_user_name"),
    )
    op.create_index(op.f("ix_categories_id"), "categories", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_categories_id"), table_name="categories")
    op.drop_table("categories")
