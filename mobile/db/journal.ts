import { getDb } from './schema';
import type { JournalEntry, JournalEntryCreate, JournalEntryUpdate } from '../types';

function parseRow(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as number,
    date: row.date as string,
    content: row.content as string,
    created_at: row.created_at as string,
  };
}

export async function listEntries(): Promise<JournalEntry[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM journal_entries ORDER BY date DESC, id DESC'
  );
  return rows.map(parseRow);
}

export async function createEntry(data: JournalEntryCreate): Promise<JournalEntry> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO journal_entries (date, content) VALUES (?, ?)',
    [data.date, data.content]
  );
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM journal_entries WHERE id = ?',
    [result.lastInsertRowId]
  );
  return parseRow(row!);
}

export async function updateEntry(id: number, data: JournalEntryUpdate): Promise<JournalEntry> {
  const db = await getDb();
  const fields: string[] = [];
  const params: string[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }
  if (data.content !== undefined) { fields.push('content = ?'); params.push(data.content); }

  if (fields.length > 0) {
    await db.runAsync(
      `UPDATE journal_entries SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM journal_entries WHERE id = ?',
    [id]
  );
  return parseRow(row!);
}

export async function deleteEntry(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM journal_entries WHERE id = ?', [id]);
}
