from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel


class FitnessLogCreate(BaseModel):
    date: date
    activities: List[str]
    body_weight_kg: float


class FitnessLogUpdate(BaseModel):
    date: Optional[date] = None
    activities: Optional[List[str]] = None
    body_weight_kg: Optional[float] = None


class FitnessLogOut(BaseModel):
    id: int
    date: date
    activities: list[str]
    body_weight_kg: float
    created_at: datetime

    model_config = {"from_attributes": True}


class WeightPoint(BaseModel):
    date: date
    body_weight_kg: float


class ActivityCount(BaseModel):
    activity: str
    count: int


class FitnessStats(BaseModel):
    weight_trend: list[WeightPoint]
    activity_counts: list[ActivityCount]
    total_days_logged: int
    rest_days: int
    active_days: int
