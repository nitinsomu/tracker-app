# Backend

FastAPI + PostgreSQL API for the web version of the tracker app.

> The mobile app does not use this backend — it stores data locally on the device using SQLite.

---

## Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Framework  | FastAPI (Python)               |
| Database   | PostgreSQL 15                 |
| ORM        | SQLAlchemy 2.0 (async)        |
| Auth       | JWT (python-jose)             |
| Migrations | Alembic                       |
| Server     | Uvicorn                       |

---

## Running with Docker (recommended)

From the project root:

```bash
docker-compose up --build
```

The API will be available at **http://localhost:8000**.

Interactive API docs: **http://localhost:8000/docs**

---

## Running locally (without Docker)

**Requirements:** Python 3.11+, PostgreSQL running locally.

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env          # then edit with your DB credentials

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --port 8000
```

---

## Environment variables

Create a `.env` file in `backend/` with the following:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/trackerdb
SECRET_KEY=your-long-random-secret-key

# Optional — email reminders
GMAIL_ADDRESS=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
REMINDER_EMAIL=recipient@gmail.com
REMINDER_HOUR=21
```

---

## API Endpoints

| Method | Path                        | Description              |
|--------|-----------------------------|--------------------------|
| POST   | `/api/auth/register`        | Create account           |
| POST   | `/api/auth/login`           | Get JWT token            |
| GET    | `/api/auth/me`              | Current user info        |
| GET    | `/api/fitness/`             | List fitness logs        |
| POST   | `/api/fitness/`             | Create fitness log       |
| GET    | `/api/fitness/stats`        | Weight trend + activity counts |
| PATCH  | `/api/fitness/{id}`         | Update log               |
| DELETE | `/api/fitness/{id}`         | Delete log               |
| GET    | `/api/expenses/`            | List expenses            |
| POST   | `/api/expenses/`            | Create expense           |
| GET    | `/api/expenses/stats`       | Monthly totals + averages |
| PATCH  | `/api/expenses/{id}`        | Update expense           |
| DELETE | `/api/expenses/{id}`        | Delete expense           |
| GET    | `/api/journal/`             | List journal entries     |
| POST   | `/api/journal/`             | Create entry             |
| GET    | `/api/journal/export`       | Export entries as .docx  |
| PATCH  | `/api/journal/{id}`         | Update entry             |
| DELETE | `/api/journal/{id}`         | Delete entry             |
| GET    | `/api/categories/`          | List categories          |
| POST   | `/api/categories/`          | Create category          |

---

## Database migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "description"

# Roll back one migration
alembic downgrade -1
```
