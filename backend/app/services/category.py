from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.schemas.category import CategoryCreate


async def get_categories(db: AsyncSession, user_id: int) -> list[Category]:
    result = await db.execute(
        select(Category).where(Category.user_id == user_id).order_by(Category.name)
    )
    return list(result.scalars().all())


async def create_category(db: AsyncSession, user_id: int, data: CategoryCreate) -> Category:
    category = Category(user_id=user_id, name=data.name.strip().lower())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category
