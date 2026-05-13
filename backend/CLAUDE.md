# Backend

FastAPI + PostgreSQL API for the tracker app. Multi-user with JWT auth.

> The mobile app uses local SQLite and does **not** depend on this backend.

## Run

### With Docker (recommended)

```bash
# from project root
docker-compose up --build
```

API at `http://localhost:8000` — docs at `http://localhost:8000/docs`

### Local dev

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # fill in DB credentials
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

## Stack

| | |
|---|---|
| Framework | FastAPI 0.111 |
| Server | Uvicorn (ASGI) |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 async |
| Auth | JWT via python-jose |
| Passwords | bcrypt via passlib |
| Migrations | Alembic |
| Email | aiosmtplib (Gmail SMTP) |
| Scheduling | APScheduler |

## Project Structure

```
app/
├── main.py          # App init, lifespan, middleware, router includes
├── config.py        # Pydantic BaseSettings (reads .env)
├── database.py      # Async engine + session factory
├── deps.py          # get_db(), get_current_user() dependencies
├── models/          # SQLAlchemy ORM models
├── schemas/         # Pydantic request/response models
├── routers/         # FastAPI APIRouter per feature
└── services/        # All DB queries and business logic
alembic/             # Migration scripts
scripts/             # Seed data + create_user CLI helpers
```

## Key Patterns

**Authentication**: JWT in `Authorization: Bearer <token>` header. Tokens expire in 7 days. `get_current_user()` dependency validates and injects `User` into route handlers.

**User isolation**: Every service query filters by `user_id`. Never trust client-provided user IDs.

**Service layer**: All DB operations live in `app/services/`. Routers call services — never execute queries directly in routers.

**Cascading deletes**: Deleting a user removes all their data.

**Date filtering**: All list endpoints accept optional `?start=YYYY-MM-DD&end=YYYY-MM-DD`.

**CORS**: Only `http://localhost:5173` allowed. Update `main.py` for production.

## Environment Variables

```env
# Required
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trackerdb
SECRET_KEY=long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080   # 7 days

# Optional — email reminders
GMAIL_ADDRESS=you@gmail.com
GMAIL_APP_PASSWORD=app-password     # NOT your Gmail password
REMINDER_EMAIL=recipient@gmail.com
REMINDER_HOUR=21                    # 0–23
```

## API Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/health` | No | Health check |
| POST | `/api/auth/register` | No | email, username, password |
| POST | `/api/auth/login` | No | returns JWT |
| GET | `/api/auth/me` | Yes | current user |
| GET/POST | `/api/fitness` | Yes | list / create |
| GET | `/api/fitness/stats` | Yes | weight trend, activity counts |
| GET/PATCH/DELETE | `/api/fitness/{id}` | Yes | |
| GET/POST | `/api/expenses` | Yes | |
| GET | `/api/expenses/stats` | Yes | totals, by category, daily avg |
| GET/PATCH/DELETE | `/api/expenses/{id}` | Yes | |
| GET/POST | `/api/journal` | Yes | |
| GET | `/api/journal/export` | Yes | downloads .docx |
| GET/PATCH/DELETE | `/api/journal/{id}` | Yes | |
| GET/POST | `/api/categories` | Yes | user-scoped, unique by name |

## Migrations

```bash
alembic upgrade head                              # apply all
alembic revision --autogenerate -m "description" # after model changes
alembic downgrade -1                              # revert last
```

## Adding a New Feature

1. `app/models/newfeature.py` — SQLAlchemy model
2. `app/schemas/newfeature.py` — Pydantic schemas
3. `app/services/newfeature.py` — DB logic
4. `app/routers/newfeature.py` — APIRouter endpoints
5. Include router in `app/main.py`
6. `alembic revision --autogenerate -m "add newfeature"`

## Notes

- No soft deletes — removals are permanent
- No pagination — all list endpoints return full results
- `echo=True` in `database.py` enables SQL query logging for debugging
- Email reminders are optional; scheduler skips gracefully if credentials missing
