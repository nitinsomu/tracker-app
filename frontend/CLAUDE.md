# Frontend

React 18 SPA built with Vite + TypeScript + Tailwind CSS.

## Run

```bash
cd frontend
npm install
npm run dev       # dev server at localhost:5173, proxies /api → localhost:8000
npm run build     # production build to dist/
```

## Stack

- **React 18.3** + **Vite 5.2** — no Next.js, pure SPA
- **TypeScript 5.4** strict mode
- **React Router 6.23** for client-side routing
- **Tailwind CSS 3.4** — indigo accent scheme, no custom theme
- **Recharts 2.12** for charts
- **No external state library** — React Context for auth only

## Project Structure

```
src/
├── api/           # Fetch client that auto-injects Bearer token
├── components/    # Feature forms (Fitness, Expense, Journal) + Layout
├── context/       # AuthContext — login, logout, token stored in localStorage
├── pages/         # Feature pages + auth pages (Login, Register)
├── types/         # Shared TypeScript interfaces
├── App.tsx        # Router with PrivateRoute guard
└── main.tsx       # Entry point
```

## Key Patterns

- **API client** (`src/api/client.ts`): base fetch wrapper, auto-injects `Authorization: Bearer <token>`, handles 204 No Content, throws on error status.
- **Auth**: token persisted in `localStorage`, read on app load, applied to all requests.
- **Feature pages**: fetch data on mount, inline form for mutations, refetch after submit. No optimistic updates.
- **Forms**: plain `useState`, no validation library.

## Features

| Feature | What it does |
|---------|-------------|
| Fitness | Log weight + activities; weight trend chart; activity calendar |
| Expenses | Category tracking; income vs spend split; monthly trends; currency in ₹ |
| Journal | Date + content entries; collapsible list; export to `.docx` |

## API Endpoints

Backend must expose these (proxied via `/api`):

```
/auth/login  /auth/register  /auth/me
/fitness/    /fitness/stats
/expenses/   /expenses/stats  /categories/
/journal/    /journal/export
```

## Notes

- Vite proxy: `/api` → `http://localhost:8000` (see `vite.config.ts`)
- No environment variables required for local dev beyond the running backend
