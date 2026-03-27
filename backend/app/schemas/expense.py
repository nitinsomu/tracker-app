from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    date: date
    amount: Decimal
    category: str
    description: str | None = None


class ExpenseUpdate(BaseModel):
    date: date | None = None
    amount: Decimal | None = None
    category: str | None = None
    description: str | None = None


class ExpenseOut(BaseModel):
    id: int
    date: date
    amount: Decimal
    category: str
    description: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class ExpenseStats(BaseModel):
    total_spent: Decimal
    by_category: list[CategoryTotal]
    daily_average: Decimal
