from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, expense, fitness, journal
from app.services.reminder import send_reminder_email


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = AsyncIOScheduler()
    scheduler.add_job(
        send_reminder_email,
        trigger="cron",
        hour=settings.REMINDER_HOUR,
        minute=0,
    )
    scheduler.start()
    yield
    scheduler.shutdown()


app = FastAPI(title="Tracker API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(fitness.router, prefix="/api")
app.include_router(expense.router, prefix="/api")
app.include_router(journal.router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
