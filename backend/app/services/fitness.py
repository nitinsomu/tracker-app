from collections import Counter
from datetime import date

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.fitness import FitnessLog
from app.schemas.fitness import ActivityCount, FitnessLogCreate, FitnessLogUpdate, FitnessStats, WeightPoint


async def get_logs(db: AsyncSession, user_id: int, start: date | None, end: date | None) -> list[FitnessLog]:
    stmt = select(FitnessLog).where(FitnessLog.user_id == user_id)
    if start:
        stmt = stmt.where(FitnessLog.date >= start)
    if end:
        stmt = stmt.where(FitnessLog.date <= end)
    stmt = stmt.order_by(FitnessLog.date.desc())
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_log(db: AsyncSession, user_id: int, log_id: int) -> FitnessLog | None:
    result = await db.execute(
        select(FitnessLog).where(FitnessLog.id == log_id, FitnessLog.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_log(db: AsyncSession, user_id: int, data: FitnessLogCreate) -> FitnessLog:
    log = FitnessLog(user_id=user_id, **data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    return log


async def update_log(db: AsyncSession, log: FitnessLog, data: FitnessLogUpdate) -> FitnessLog:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(log, field, value)
    await db.commit()
    await db.refresh(log)
    return log


async def delete_log(db: AsyncSession, log: FitnessLog) -> None:
    await db.delete(log)
    await db.commit()


async def get_stats(db: AsyncSession, user_id: int, start: date | None, end: date | None) -> FitnessStats:
    logs = await get_logs(db, user_id, start, end)
    weight_trend = [WeightPoint(date=l.date, body_weight_kg=l.body_weight_kg) for l in logs]
    all_activities: list[str] = []
    rest_days = 0
    for l in logs:
        if l.activities:
            all_activities.extend(l.activities)
        else:
            rest_days += 1
    counts = Counter(all_activities)
    activity_counts = [ActivityCount(activity=a, count=c) for a, c in counts.most_common()]
    return FitnessStats(
        weight_trend=sorted(weight_trend, key=lambda w: w.date),
        activity_counts=activity_counts,
        total_days_logged=len(logs),
        rest_days=rest_days,
        active_days=len(logs) - rest_days,
    )
