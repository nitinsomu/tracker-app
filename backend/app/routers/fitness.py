from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.fitness import FitnessLogCreate, FitnessLogOut, FitnessLogUpdate, FitnessStats
from app.services import fitness as svc

router = APIRouter(prefix="/fitness", tags=["fitness"])


@router.get("/", response_model=list[FitnessLogOut])
async def list_logs(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.get_logs(db, user.id, start, end)


@router.post("/", response_model=FitnessLogOut, status_code=status.HTTP_201_CREATED)
async def create_log(
    data: FitnessLogCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.create_log(db, user.id, data)


@router.get("/stats", response_model=FitnessStats)
async def stats(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.get_stats(db, user.id, start, end)


@router.get("/{log_id}", response_model=FitnessLogOut)
async def get_log(log_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    log = await svc.get_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return log


@router.patch("/{log_id}", response_model=FitnessLogOut)
async def update_log(
    log_id: int,
    data: FitnessLogUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    log = await svc.get_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    return await svc.update_log(db, log, data)


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(log_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    log = await svc.get_log(db, user.id, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Log not found")
    await svc.delete_log(db, log)
