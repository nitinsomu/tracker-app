import { useEffect, useMemo, useState } from "react";
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
} from "recharts";

function toYearMonth(dateStr: string) {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function ActivityCalendar({
  year,
  month,
  logs,
}: {
  year: number;
  month: number;
  logs: FitnessLog[];
}) {
  const [hoveredActivity, setHoveredActivity] = useState<string | null>(null);

  const logByDate = useMemo(() => {
    const map: Record<string, FitnessLog> = {};
    logs.forEach((l) => { map[l.date] = l; });
    return map;
  }, [logs]);

  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      l.activities.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDow = new Date(year, month - 1, 1).getDay(); // 0=Sun

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDow });

  function dayClass(day: number) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const log = logByDate[dateStr];

    if (!log) return "bg-gray-50 text-gray-300";

    if (log.activities.length === 0) {
      // rest day
      if (hoveredActivity) return "bg-gray-100 text-gray-400";
      return "bg-amber-100 text-amber-700 font-medium";
    }

    if (hoveredActivity) {
      return log.activities.includes(hoveredActivity)
        ? "bg-indigo-500 text-white font-medium"
        : "bg-gray-100 text-gray-400";
    }

    return "bg-indigo-100 text-indigo-700 font-medium";
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
      {/* Activity chips */}
      {activityCounts.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
            Hover an activity to highlight days
          </p>
          <div className="flex flex-wrap gap-2">
            {activityCounts.map(([activity, count]) => (
              <button
                key={activity}
                onMouseEnter={() => setHoveredActivity(activity)}
                onMouseLeave={() => setHoveredActivity(null)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  hoveredActivity === activity
                    ? "bg-indigo-500 text-white border-indigo-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                }`}
              >
                {activity} <span className="font-semibold">{count}×</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activityCounts.length === 0 && (
        <p className="text-sm text-gray-400">No activities logged this month.</p>
      )}

      {/* Calendar grid */}
      <div>
        <div className="grid grid-cols-7 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => <div key={`b${i}`} />)}
          {days.map((day) => (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-colors ${dayClass(day)}`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-indigo-100 inline-block" /> Active
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Rest
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-50 border border-gray-200 inline-block" /> No log
        </span>
      </div>
    </div>
  );
}

export default function FitnessPage() {
  const [logs, setLogs] = useState<FitnessLog[]>([]);
  const [stats, setStats] = useState<FitnessStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FitnessLog | null>(null);
  const [error, setError] = useState("");

  const currentMonth = toYearMonth(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  async function load() {
    try {
      const [l, s] = await Promise.all([fitnessApi.list(), fitnessApi.stats()]);
      setLogs(l);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => { load(); }, []);

  const monthOptions = useMemo(() => {
    const set = new Set(logs.map((l) => toYearMonth(l.date)));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [logs, currentMonth]);

  const monthLogs = useMemo(
    () => logs.filter((l) => toYearMonth(l.date) === selectedMonth),
    [logs, selectedMonth]
  );

  const [year, month] = selectedMonth.split("-").map(Number);

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
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* All-time stats */}
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

      {/* Weight trend */}
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

      {/* Month selector + calendar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-gray-700">Activity calendar</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="ml-auto text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {monthOptions.map((ym) => (
              <option key={ym} value={ym}>{monthLabel(ym)}</option>
            ))}
          </select>
        </div>

        <ActivityCalendar year={year} month={month} logs={monthLogs} />
      </div>

    </div>
  );
}
