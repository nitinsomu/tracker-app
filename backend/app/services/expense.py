from datetime import date
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.expense import Expense
from app.schemas.expense import CategoryTotal, ExpenseCreate, ExpenseStats, ExpenseUpdate


async def get_expenses(db: AsyncSession, user_id: int, start: date | None, end: date | None) -> list[Expense]:
    stmt = select(Expense).where(Expense.user_id == user_id)
    if start:
        stmt = stmt.where(Expense.date >= start)
    if end:
        stmt = stmt.where(Expense.date <= end)
    stmt = stmt.order_by(Expense.date.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_expense(db: AsyncSession, user_id: int, expense_id: int) -> Expense | None:
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id, Expense.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_expense(db: AsyncSession, user_id: int, data: ExpenseCreate) -> Expense:
    expense = Expense(user_id=user_id, **data.model_dump())
    db.add(expense)
    await db.commit()
    await db.refresh(expense)
    return expense


async def update_expense(db: AsyncSession, expense: Expense, data: ExpenseUpdate) -> Expense:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(expense, field, value)
    await db.commit()
    await db.refresh(expense)
    return expense


async def delete_expense(db: AsyncSession, expense: Expense) -> None:
    await db.delete(expense)
    await db.commit()


async def get_stats(db: AsyncSession, user_id: int, start: date | None, end: date | None) -> ExpenseStats:
    expenses = await get_expenses(db, user_id, start, end)
    total = sum((e.amount for e in expenses), Decimal(0))
    by_cat: dict[str, Decimal] = {}
    for e in expenses:
        by_cat[e.category] = by_cat.get(e.category, Decimal(0)) + e.amount
    by_category = [CategoryTotal(category=k, total=v) for k, v in sorted(by_cat.items(), key=lambda x: x[1], reverse=True)]
    unique_days = len({e.date for e in expenses})
    daily_avg = total / unique_days if unique_days else Decimal(0)
    return ExpenseStats(total_spent=total, by_category=by_category, daily_average=daily_avg.quantize(Decimal("0.01")))
