# Tracker App

Personal productivity tracker for fitness, expenses, and journaling. Two independent versions in one repo:

| Version | Directories | Description |
|---------|------------|-------------|
| **Web** | `frontend/` + `backend/` | React SPA + FastAPI + PostgreSQL |
| **Mobile** | `mobile/` | Expo React Native, fully local (SQLite, no server) |

The mobile app and web app share no code and have no runtime dependency on each other.

## Quick Start

### Web (Docker)

```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Postgres | localhost:5432 |

### Mobile (Android)

```bash
cd mobile
npm install --legacy-peer-deps
npx expo run:android
```

See `mobile/CLAUDE.md` for full setup (requires Android Studio + PATH config).

## Repo Structure

```
tracker-app/
├── frontend/           # React 18 + Vite + Tailwind (web UI)
├── backend/            # FastAPI + PostgreSQL (web API)
├── mobile/             # Expo SDK 54 + React Native (Android/iOS)
├── docker-compose.yml  # Orchestrates frontend + backend + postgres
└── export_to_mobile.py # One-off script: copies web data to mobile format
```

## Features (both versions)

- **Fitness** — log daily workouts and body weight, view trends and activity calendar
- **Expenses** — track spending by category, monthly summaries, income vs spend split
- **Journal** — write daily entries; export to `.docx` (web) or JSON backup (mobile)

## Tech at a Glance

| Layer | Web | Mobile |
|-------|-----|--------|
| UI | React 18 + Tailwind | React Native + StyleSheet |
| Routing | React Router 6 | expo-router |
| State | React Context (auth) | Local useState |
| Data | FastAPI REST API | SQLite via expo-sqlite |
| Auth | JWT (Bearer token) | None (single-user, local) |
| Charts | Recharts | Custom SVG |

## Sub-project Docs

- [`frontend/CLAUDE.md`](frontend/CLAUDE.md) — frontend dev guide
- [`backend/CLAUDE.md`](backend/CLAUDE.md) — backend dev guide
- [`mobile/CLAUDE.md`](mobile/CLAUDE.md) — mobile dev guide

## Notes

- `export_to_mobile.py` is a utility script for migrating web data into the mobile SQLite format — not part of normal workflow.
- Web and mobile use the same feature set and similar domain models but are completely independent codebases.
- The mobile app intentionally has no backend dependency — all data lives on-device.
