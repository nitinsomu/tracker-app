import { cacheDirectory, writeAsStringAsync, readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDb } from '../db/schema';

interface BackupData {
  version: number;
  exported_at: string;
  categories: { id: number; name: string }[];
  fitness_logs: {
    id: number;
    date: string;
    activities: string[]; // parsed array (not JSON string)
    body_weight_kg: number;
    created_at: string;
  }[];
  expenses: {
    id: number;
    date: string;
    amount: number;
    category: string;
    description: string | null;
    created_at: string;
  }[];
  journal_entries: {
    id: number;
    date: string;
    content: string;
    created_at: string;
  }[];
}

export async function exportBackup(): Promise<void> {
  const db = await getDb();

  // Sequential queries — concurrent getAllAsync on the same connection causes
  // NullPointerException in prepareAsync on Android (expo-sqlite v16).
  const categories = await db.getAllAsync<{ id: number; name: string }>(
    'SELECT * FROM categories ORDER BY id'
  );
  const fitnessRaw = await db.getAllAsync<{
    id: number; date: string; activities: string; body_weight_kg: number; created_at: string;
  }>('SELECT * FROM fitness_logs ORDER BY id');
  const expenses = await db.getAllAsync<{
    id: number; date: string; amount: number; category: string; description: string | null; created_at: string;
  }>('SELECT * FROM expenses ORDER BY id');
  const journal = await db.getAllAsync<{
    id: number; date: string; content: string; created_at: string;
  }>('SELECT * FROM journal_entries ORDER BY id');

  const backup: BackupData = {
    version: 1,
    exported_at: new Date().toISOString(),
    categories,
    fitness_logs: fitnessRaw.map((r) => ({
      ...r,
      activities: JSON.parse(r.activities || '[]'),
    })),
    expenses,
    journal_entries: journal,
  };

  const json = JSON.stringify(backup, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `tracker_backup_${dateStr}.json`;
  const fileUri = (cacheDirectory ?? '') + fileName;

  await writeAsStringAsync(fileUri, json, { encoding: EncodingType.UTF8 });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing is not available on this device');

  await Sharing.shareAsync(fileUri, {
    mimeType: 'application/json',
    dialogTitle: 'Save your tracker backup',
  });
}

export async function importBackup(): Promise<{ counts: Record<string, number> }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled) throw new Error('Import cancelled');

  const uri = result.assets[0].uri;
  const raw = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 });

  let data: BackupData;
  try {
    data = JSON.parse(raw) as BackupData;
  } catch {
    throw new Error('Invalid backup file — could not parse JSON');
  }

  if (data.version !== 1) throw new Error(`Unsupported backup version: ${data.version}`);
  if (!data.categories || !data.fitness_logs || !data.expenses || !data.journal_entries) {
    throw new Error('Backup file is missing required tables');
  }

  const db = await getDb();

  // withTransactionAsync causes NullPointerException on Android (expo-sqlite v16)
  // when many sequential runAsync calls are made inside the callback.
  // Use explicit BEGIN/COMMIT/ROLLBACK instead.
  try {
    await db.execAsync('BEGIN TRANSACTION');

    await db.execAsync('DELETE FROM categories');
    await db.execAsync('DELETE FROM fitness_logs');
    await db.execAsync('DELETE FROM expenses');
    await db.execAsync('DELETE FROM journal_entries');

    for (const c of data.categories) {
      await db.runAsync(
        'INSERT OR REPLACE INTO categories (id, name) VALUES (?, ?)',
        [c.id, c.name]
      );
    }
    for (const f of data.fitness_logs) {
      await db.runAsync(
        'INSERT OR REPLACE INTO fitness_logs (id, date, activities, body_weight_kg, created_at) VALUES (?, ?, ?, ?, ?)',
        [f.id, f.date, JSON.stringify(f.activities), f.body_weight_kg, f.created_at]
      );
    }
    for (const e of data.expenses) {
      await db.runAsync(
        'INSERT OR REPLACE INTO expenses (id, date, amount, category, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [e.id, e.date, e.amount, e.category, e.description ?? null, e.created_at]
      );
    }
    for (const j of data.journal_entries) {
      await db.runAsync(
        'INSERT OR REPLACE INTO journal_entries (id, date, content, created_at) VALUES (?, ?, ?, ?)',
        [j.id, j.date, j.content, j.created_at]
      );
    }

    await db.execAsync('COMMIT');
  } catch (err) {
    await db.execAsync('ROLLBACK');
    throw err;
  }

  return {
    counts: {
      categories: data.categories.length,
      fitness_logs: data.fitness_logs.length,
      expenses: data.expenses.length,
      journal_entries: data.journal_entries.length,
    },
  };
}
