# Mobile App

React Native (Expo) app for tracking fitness, expenses, and journaling. **Fully local-first** — all data stored on-device with SQLite, no backend required.

## Stack

- **Expo SDK 54** + React Native 0.81
- **TypeScript** strict mode
- **expo-router** — file-based navigation (Stack + Tabs)
- **expo-sqlite** — local SQLite database (WAL mode)
- **expo-notifications** — daily reminders
- Custom SVG-based charts (no charting library)

## Run

### Prerequisites

- Node.js 18+
- Android Studio with SDK and emulator
- `ANDROID_HOME` and `platform-tools` in system PATH (see `README.md`)

### Dev (live reload)

```bash
cd mobile
npm install --legacy-peer-deps
npx expo run:android
```

### Release APK

```bash
cd mobile
npx expo prebuild --platform android --clean
# Recreate local.properties if needed (see README.md)
cd android
.\gradlew assembleRelease
```

Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
app/                     # expo-router screens
├── _layout.tsx          # Root shell: DB init, Stack navigation
├── index.tsx            # Redirects to (tabs)
├── settings.tsx         # Backup/restore + notification settings
└── (tabs)/
    ├── _layout.tsx      # Tab bar + settings button header
    ├── fitness.tsx
    ├── expenses.tsx
    └── journal.tsx
components/
├── ui/                  # Card, StatCard, ConfirmModal, DatePickerField, MonthPicker
├── fitness/             # FitnessForm, WeightChart, ActivityCalendar
├── expenses/            # ExpenseForm, SpendTrendChart, CategoryBarChart
└── journal/             # JournalForm, JournalCard
db/
├── schema.ts            # Table creation + singleton DB init
├── fitness.ts           # Fitness CRUD + stats aggregation
├── expenses.ts          # Expense CRUD
├── journal.ts           # Journal CRUD
└── categories.ts        # Category CRUD
services/
├── backup.ts            # Export/import JSON to device filesystem
└── notifications.ts     # Daily reminder scheduling
types/index.ts           # All TypeScript interfaces
constants/colors.ts      # Indigo-gray color palette
```

## Key Patterns

**DB singleton**: `getDb()` in `db/schema.ts` returns a singleton promise. Root `_layout.tsx` calls `initDatabase()` eagerly — tables exist before any screen mounts.

**CRUD modules**: Each entity has `list*()`, `create*()`, `update*()`, `delete*()` functions. Fitness has a `parseRow()` helper to deserialize JSON arrays from SQLite.

**State**: Local `useState` per screen. Data loaded in `useEffect` on mount. Pull-to-refresh: `setRefreshing(true)` → `load()` → `setRefreshing(false)`.

**Forms**: Each domain has a `*Form` component. Props: `onSubmit`, `initialValue`, `onCancel`. Uses `DatePickerField` for dates.

**Styling**: `StyleSheet.create()` only — no Tailwind. Colors centralized in `constants/colors.ts`.

**Backup**: SQLite → JSON export via `expo-file-system` + `expo-sharing`. Import clears all tables then bulk-inserts via exclusive transaction.

## Database Schema

```sql
categories       (id PK, name TEXT UNIQUE)
fitness_logs     (id PK, date TEXT UNIQUE, activities TEXT DEFAULT '[]', body_weight_kg REAL, created_at)
expenses         (id PK, date TEXT, amount REAL, category TEXT, description TEXT, created_at)
journal_entries  (id PK, date TEXT, content TEXT, created_at)
```

All date columns are indexed. Activities stored as JSON strings.

## Common Tasks

**Add a screen**: Create `app/myscreen.tsx`, add `Stack.Screen` in parent `_layout.tsx`.

**Add a DB table**:
1. Add `CREATE TABLE` to `db/schema.ts`
2. Create `db/mytable.ts` with CRUD functions
3. Add types to `types/index.ts`
4. Update `services/backup.ts` export/import

## Known Issues

| Issue | Fix |
|-------|-----|
| `SDK location not found` | Recreate `android/local.properties` |
| `adb not recognized` | Add `platform-tools` to system PATH |
| App crashes on release build | Ensure `newArchEnabled: false` in `app.json` |
| Concurrent DB queries crash (Android) | Query sequentially or use `withExclusiveTransactionAsync()` |

## Notes

- No test suite — test on device/emulator before submitting
- Keep all types strict; avoid `any`
- `--legacy-peer-deps` required on install due to peer dep conflicts in Expo v54
