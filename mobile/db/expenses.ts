import { getDb } from './schema';
import type { Expense, ExpenseCreate, ExpenseUpdate } from '../types';

function parseRow(row: Record<string, unknown>): Expense {
  return {
    id: row.id as number,
    date: row.date as string,
    amount: Number(row.amount),
    category: row.category as string,
    description: (row.description as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM expenses ORDER BY date DESC, id DESC'
  );
  return rows.map(parseRow);
}

export async function createExpense(data: ExpenseCreate): Promise<Expense> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO expenses (date, amount, category, description) VALUES (?, ?, ?, ?)',
    [data.date, data.amount, data.category, data.description ?? null]
  );
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM expenses WHERE id = ?',
    [result.lastInsertRowId]
  );
  return parseRow(row!);
}

export async function updateExpense(id: number, data: ExpenseUpdate): Promise<Expense> {
  const db = await getDb();
  const fields: string[] = [];
  const params: (string | number | null)[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }
  if (data.amount !== undefined) { fields.push('amount = ?'); params.push(data.amount); }
  if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category); }
  if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description ?? null); }

  if (fields.length > 0) {
    await db.runAsync(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM expenses WHERE id = ?',
    [id]
  );
  return parseRow(row!);
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}
