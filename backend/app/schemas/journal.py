from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class JournalEntryCreate(BaseModel):
    date: date
    content: str


class JournalEntryUpdate(BaseModel):
    date: Optional[date] = None
    content: Optional[str] = None


class JournalEntryOut(BaseModel):
    id: int
    date: date
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
