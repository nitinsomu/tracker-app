import * as SQLite from 'expo-sqlite';

// Single promise shared across all callers. Guarantees tables exist before
// any query runs, even if multiple screens mount simultaneously.
let _ready: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndInit(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync('tracker.db');

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS categories (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fitness_logs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      date           TEXT NOT NULL UNIQUE,
      activities     TEXT NOT NULL DEFAULT '[]',
      body_weight_kg REAL NOT NULL,
      created_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_fitness_date ON fitness_logs(date);

    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      date        TEXT NOT NULL,
      amount      REAL NOT NULL,
      category    TEXT NOT NULL,
      description TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_expense_date ON expenses(date);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      date       TEXT NOT NULL,
      content    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_journal_date ON journal_entries(date);
  `);

  return db;
}

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_ready) {
    _ready = openAndInit();
  }
  return _ready;
}

// Called from _layout.tsx to eagerly warm up the DB before tabs load.
export async function initDatabase(): Promise<void> {
  await getDb();
}
