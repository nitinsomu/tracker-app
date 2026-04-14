import { getDb } from './schema';
import type { Category } from '../types';

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: number; name: string }>(
    'SELECT * FROM categories ORDER BY name ASC'
  );
  return rows;
}

export async function createCategory(name: string): Promise<Category> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO categories (name) VALUES (?)',
    [name.trim().toLowerCase()]
  );
  return { id: result.lastInsertRowId, name: name.trim().toLowerCase() };
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
}
