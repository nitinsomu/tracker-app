from datetime import date, datetime

from pydantic import BaseModel


class FitnessLogCreate(BaseModel):
    date: date
    activities: list[str]
    body_weight_kg: float


class FitnessLogUpdate(BaseModel):
    date: date | None = None
    activities: list[str] | None = None
    body_weight_kg: float | None = None


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
