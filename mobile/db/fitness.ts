import { getDb } from './schema';
import type {
  FitnessLog,
  FitnessLogCreate,
  FitnessLogUpdate,
  FitnessStats,
  WeightPoint,
  ActivityCount,
} from '../types';

function parseRow(row: Record<string, unknown>): FitnessLog {
  return {
    id: row.id as number,
    date: row.date as string,
    activities: JSON.parse((row.activities as string) || '[]'),
    body_weight_kg: Number(row.body_weight_kg),
    created_at: row.created_at as string,
  };
}

export async function listLogs(): Promise<FitnessLog[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM fitness_logs ORDER BY date DESC'
  );
  return rows.map(parseRow);
}

export async function createLog(data: FitnessLogCreate): Promise<FitnessLog> {
  const db = await getDb();
  const result = await db.runAsync(
    'INSERT INTO fitness_logs (date, activities, body_weight_kg) VALUES (?, ?, ?)',
    [data.date, JSON.stringify(data.activities), data.body_weight_kg]
  );
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM fitness_logs WHERE id = ?',
    [result.lastInsertRowId]
  );
  return parseRow(row!);
}

export async function updateLog(id: number, data: FitnessLogUpdate): Promise<FitnessLog> {
  const db = await getDb();
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (data.date !== undefined) { fields.push('date = ?'); params.push(data.date); }
  if (data.activities !== undefined) { fields.push('activities = ?'); params.push(JSON.stringify(data.activities)); }
  if (data.body_weight_kg !== undefined) { fields.push('body_weight_kg = ?'); params.push(data.body_weight_kg); }

  if (fields.length > 0) {
    await db.runAsync(
      `UPDATE fitness_logs SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );
  }

  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM fitness_logs WHERE id = ?',
    [id]
  );
  return parseRow(row!);
}

export async function deleteLog(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM fitness_logs WHERE id = ?', [id]);
}

export async function getFitnessStats(preloadedLogs?: FitnessLog[]): Promise<FitnessStats> {
  const rows = preloadedLogs ?? await listLogs();

  const weightTrend: WeightPoint[] = rows
    .map((r) => ({ date: r.date, body_weight_kg: r.body_weight_kg }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const activityMap: Record<string, number> = {};
  let restDays = 0;

  for (const r of rows) {
    if (r.activities.length === 0) {
      restDays++;
    } else {
      for (const a of r.activities) {
        activityMap[a] = (activityMap[a] || 0) + 1;
      }
    }
  }

  const activity_counts: ActivityCount[] = Object.entries(activityMap)
    .map(([activity, count]) => ({ activity, count }))
    .sort((a, b) => b.count - a.count);

  return {
    weight_trend: weightTrend,
    activity_counts,
    total_days_logged: rows.length,
    rest_days: restDays,
    active_days: rows.length - restDays,
  };
}
