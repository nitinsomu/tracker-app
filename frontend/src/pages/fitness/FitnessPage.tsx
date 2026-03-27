import { useEffect, useState } from "react";
import { fitnessApi } from "../../api/fitness";
import FitnessForm from "../../components/fitness/FitnessForm";
import type { FitnessLog, FitnessLogCreate, FitnessStats } from "../../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function FitnessPage() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [stats, setStats] = useState<FitnessStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FitnessLog | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [l, s] = await Promise.all([fitnessApi.list(), fitnessApi.stats()]);
      setLogs(l);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(data: FitnessLogCreate) {
    await fitnessApi.create(data);
    setShowForm(false);
    load();
  }

  async function handleUpdate(data: FitnessLogCreate) {
    if (!editing) return;
    await fitnessApi.update(editing.id, data);
    setEditing(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this log?")) return;
    await fitnessApi.delete(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Fitness</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
        >
          + Log
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{error}</p>}

      {(showForm || editing) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editing ? "Edit Log" : "New Log"}
          </h2>
          <FitnessForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Days logged</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.total_days_logged}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Active days</p>
            <p className="text-3xl font-semibold text-green-600">{stats.active_days}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Rest days</p>
            <p className="text-3xl font-semibold text-amber-500">{stats.rest_days}</p>
          </div>
        </div>
      )}

      {stats && stats.weight_trend.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-medium text-gray-700 mb-4">Weight trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.weight_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="body_weight_kg" stroke="#6366f1" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats && stats.activity_counts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-medium text-gray-700 mb-4">Activity breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.activity_counts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="activity" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {logs.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No logs yet. Add your first one!</p>
        )}
        {logs.map((log) => (
          <div key={log.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{log.date}</p>
              <p className="text-sm text-gray-500">
                {log.activities.length > 0 ? log.activities.join(", ") : "Rest day"} ·{" "}
                {log.body_weight_kg} kg
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(log)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(log.id)}
                className="text-sm text-red-500 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
