# Tracker — Mobile App

React Native (Expo) mobile app for tracking fitness, expenses, and journaling.

- Runs on **Android and iOS**
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

## Development — Expo Go

The fastest way to run the app during development. No build required.

**Requirements:** Node.js 18+, [Expo Go](https://expo.dev/go) installed on your phone.

```bash
cd mobile
npm install --legacy-peer-deps
npx expo start --clear
```

Scan the QR code with Expo Go. Your phone and laptop must be on the same WiFi network.

If they are on different networks:
```bash
npx expo start --tunnel
```

> **Note:** `expo-notifications` is partially restricted in Expo Go. All other features (fitness, expenses, journal, backup) work fully.

---

## Building a standalone APK — EAS Build

EAS Build compiles the app in Expo's cloud. No Android Studio needed.

### One-time setup

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account (create one free at expo.dev)
eas login

# Link this project to your account (already configured — skip if eas.json exists)
eas init
```

### Build an APK (Android)

```bash
cd mobile
eas build --platform android --profile preview
```

- Build takes ~10-15 minutes on Expo's servers
- When complete, you'll get a download link for the `.apk` file
- Download it to your Android phone and tap to install
  - You may need to enable **Install from unknown sources** in Android settings

### Build profiles

| Profile       | Output  | Use case                                      |
|---------------|---------|-----------------------------------------------|
| `preview`     | `.apk`  | Install directly on your phone, share with others |
| `development` | `.apk`  | Dev build with full debugger (replaces Expo Go) |
| `production`  | `.aab`  | Play Store submission                         |

```bash
# Development build (full native module support, replaces Expo Go)
eas build --platform android --profile development

# Production build (for Play Store)
eas build --platform android --profile production
```

### iOS build

Requires an Apple Developer account ($99/year) and a Mac (or EAS cloud signing).

```bash
eas build --platform ios --profile preview
```

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

The backup format is a plain JSON file containing all 4 tables. Keep a copy after each session.

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
| `Cannot find module 'babel-preset-expo'` | `npm install babel-preset-expo@~54.0.10 --save-dev --legacy-peer-deps` |
| `Cannot find module 'react-native-worklets/plugin'` | `npx expo install react-native-worklets-core` |
| SQLite `ensureDatabasePathExistsAsync` error | Clear Expo Go app data on Android: Settings → Apps → Expo Go → Storage → Clear Data |
| QR code not connecting | Ensure phone and laptop are on the same WiFi, or use `npx expo start --tunnel` |
