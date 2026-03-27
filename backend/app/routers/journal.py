from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.journal import JournalEntryCreate, JournalEntryOut, JournalEntryUpdate
from app.services import journal as svc

router = APIRouter(prefix="/journal", tags=["journal"])


@router.get("/", response_model=list[JournalEntryOut])
async def list_entries(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.get_entries(db, user.id, start, end)


@router.post("/", response_model=JournalEntryOut, status_code=status.HTTP_201_CREATED)
async def create_entry(
    data: JournalEntryCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await svc.create_entry(db, user.id, data)


@router.get("/export")
async def export_docx(
    start: date | None = None,
    end: date | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    entries = await svc.get_entries(db, user.id, start, end)
    docx_bytes = await svc.export_docx(entries)
    return Response(
        content=docx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=journal.docx"},
    )


@router.get("/{entry_id}", response_model=JournalEntryOut)
async def get_entry(entry_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    entry = await svc.get_entry(db, user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return entry


@router.patch("/{entry_id}", response_model=JournalEntryOut)
async def update_entry(
    entry_id: int,
    data: JournalEntryUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    entry = await svc.get_entry(db, user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    return await svc.update_entry(db, entry, data)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_entry(entry_id: int, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    entry = await svc.get_entry(db, user.id, entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entry not found")
    await svc.delete_entry(db, entry)
