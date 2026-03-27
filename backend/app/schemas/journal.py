from datetime import date, datetime

from pydantic import BaseModel


class JournalEntryCreate(BaseModel):
    date: date
    content: str


class JournalEntryUpdate(BaseModel):
    date: date | None = None
    content: str | None = None


class JournalEntryOut(BaseModel):
    id: int
    date: date
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
