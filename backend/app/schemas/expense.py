from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class ExpenseCreate(BaseModel):
    date: date
    amount: Decimal
    category: str
    description: Optional[str] = None


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    amount: Optional[Decimal] = None
    category: Optional[str] = None
    description: Optional[str] = None


class ExpenseOut(BaseModel):
    id: int
    date: date
    amount: Decimal
    category: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class ExpenseStats(BaseModel):
    total_spent: Decimal
    by_category: list[CategoryTotal]
    daily_average: Decimal
