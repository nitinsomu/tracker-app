from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseStats, ExpenseUpdate
from app.services import expense as svc

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseOut])
async def list_expenses(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.get_expenses(db, user.id, start, end)


@router.post("/", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.create_expense(db, user.id, data)


@router.get("/stats", response_model=ExpenseStats)
async def stats(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.get_stats(db, user.id, start, end)


@router.get("/{expense_id}", response_model=ExpenseOut)
async def get_expense(expense_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    expense = await svc.get_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


@router.patch("/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    expense = await svc.get_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return await svc.update_expense(db, expense, data)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(expense_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    expense = await svc.get_expense(db, user.id, expense_id)
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    await svc.delete_expense(db, expense)
