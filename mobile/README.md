# Tracker — Mobile App

React Native (Expo) mobile app for tracking fitness, expenses, and journaling.

- Runs on **Android**
- **Fully local** — no server, no internet required, data stored on-device with SQLite
- **Backup/restore** via JSON export to Google Drive / iCloud

---

## Stack

| Concern       | Library                              |
|---------------|--------------------------------------|
| Framework     | Expo SDK 54 + React Native 0.81      |
| Language      | TypeScript                           |
| Navigation    | expo-router v6 (file-based)          |
| Database      | expo-sqlite v16 (local SQLite)       |
| Charts        | react-native-svg (custom SVG charts) |
| Notifications | expo-notifications (local/scheduled) |
| Backup        | expo-file-system + expo-sharing      |

---

## Requirements

- Node.js 18+
- Android Studio (for SDK and emulator)
- `ANDROID_HOME` environment variable set to `C:\Users\<you>\AppData\Local\Android\Sdk`
- `C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools` added to system `Path`

> Set both in **System Properties → Environment Variables → System variables**, then restart your terminal.

---

## Development (live reload)

Phone must be connected via USB with **USB debugging** enabled.

```powershell
cd mobile
npm install --legacy-peer-deps
npx expo run:android
```

This builds a debug APK, installs it on your phone, and starts Metro. JS changes reload instantly without rebuilding.

---

## Building a standalone release APK

A release APK runs standalone — no PC or Metro needed after install.

### 1. Generate native Android project

Only needed the first time, or when `app.json` changes or native libraries are added/removed.

```powershell
cd mobile
npx expo prebuild --platform android --clean
```

After prebuild, recreate `local.properties` (PowerShell):

```powershell
[System.IO.File]::WriteAllText(
  'C:/Users/<you>/Desktop/Projects/tracker-app/mobile/android/local.properties',
  "sdk.dir=C\:/Users/<you>/AppData/Local/Android/Sdk`n",
  [System.Text.Encoding]::ASCII
)
```

Replace `<you>` with your Windows username.

### 2. Build the APK

```powershell
cd mobile/android
.\gradlew assembleRelease
```

Output: `mobile/android/app/build/outputs/apk/release/app-release.apk`

Build takes ~8-10 minutes on first run. Subsequent builds are faster (~1-2 min) if only JS changed.

### 3. Install on phone (USB connected)

```powershell
& "C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r mobile/android/app/build/outputs/apk/release/app-release.apk
```

Or send the APK to your phone via WhatsApp/email and tap to install (enable **Install from unknown sources** if prompted).

---

## Project structure

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout — DB init, navigation shell
│   ├── settings.tsx         # Backup/restore + notification settings
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab bar
│       ├── fitness.tsx      # Fitness screen
│       ├── expenses.tsx     # Expenses screen
│       └── journal.tsx      # Journal screen
├── components/
│   ├── ui/                  # Shared: Card, StatCard, ConfirmModal, DatePickerField, MonthPicker
│   ├── fitness/             # FitnessForm, WeightChart, ActivityCalendar
│   ├── expenses/            # ExpenseForm, SpendTrendChart, CategoryBarChart
│   └── journal/             # JournalForm, JournalCard
├── db/
│   ├── schema.ts            # SQLite table creation + DB init
│   ├── fitness.ts           # Fitness CRUD + stats
│   ├── expenses.ts          # Expense CRUD
│   ├── journal.ts           # Journal CRUD
│   └── categories.ts        # Category CRUD
├── services/
│   ├── backup.ts            # Export/import JSON backup
│   └── notifications.ts     # Schedule daily reminder
├── types/index.ts           # TypeScript interfaces
└── constants/colors.ts      # Colour palette
```

---

## Backup and restore

### Export
Settings (gear icon) → **Export backup (JSON)** → save to Google Drive / iCloud

### Import
Settings → **Import backup** → pick the `.json` file

The backup is a plain JSON file containing all 4 tables. Keep a copy after each session.

### Migrating from the web app

If you have existing data in Postgres, run from the project root:

```bash
pip install psycopg2-binary
python export_to_mobile.py
```

Then import `tracker_backup.json` via Settings → Import backup.

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `SDK location not found` | Recreate `local.properties` — see step 1 above |
| `adb not recognized` | Add `platform-tools` to system Path, restart terminal |
| `EBUSY: resource busy or locked` during prebuild | `Get-Process java \| Stop-Process -Force`, then retry |
| App crashes on release build | Ensure `newArchEnabled: false` in `app.json` |
| `Cannot find module 'babel-preset-expo'` | `npm install babel-preset-expo@~54.0.10 --save-dev --legacy-peer-deps` |
| QR code not connecting | Phone and laptop must be on same WiFi |
