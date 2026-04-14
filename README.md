# Tracker App

A personal productivity tracker for fitness, expenses, and journaling.

Two versions exist in this repo:
- **Web** (`frontend/` + `backend/`) — React + FastAPI + PostgreSQL, runs in a browser
- **Mobile** (`mobile/`) — React Native (Expo), runs on Android/iOS, fully local (no server needed)

---

## Project Structure

```
tracker-app/
├── frontend/       # React + TypeScript + Tailwind (web UI)
├── backend/        # FastAPI + PostgreSQL (web API)
├── mobile/         # Expo React Native app (standalone, no backend)
└── docker-compose.yml
```

---

## Running the web app

Requires Docker.

```bash
docker-compose up --build
```

| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:8000 |
| Postgres | localhost:5434        |

See [backend/README.md](backend/README.md) for backend-only setup.

---

## Running the mobile app

See [mobile/README.md](mobile/README.md) for full instructions.

Quick start (requires Node.js):

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --clear
```

Scan the QR code with the **Expo Go** app on your phone.

---

## Migrating data from web → mobile

If you have existing data in Postgres, export it for the mobile app:

```bash
# Make sure Docker is running first
pip install psycopg2-binary
python export_to_mobile.py
```

This writes `tracker_backup.json`. Transfer it to your phone and use **Settings → Import backup** in the mobile app.
