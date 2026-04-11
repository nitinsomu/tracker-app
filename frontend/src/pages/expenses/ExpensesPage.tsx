import { useEffect, useMemo, useState } from "react";
import { categoryApi } from "../../api/category";
import { expenseApi } from "../../api/expense";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import type { Category, Expense, ExpenseCreate } from "../../types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function toYearMonth(dateStr: string) {
  return dateStr.slice(0, 7);
}

function monthLabel(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
}

function fmt(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [error, setError] = useState("");

  const lastUpdated = useMemo(() => {
    if (!expenses.length) return null;
    const latest = expenses.reduce((a, b) =>
      new Date(a.created_at) > new Date(b.created_at) ? a : b
    );
    return new Date(latest.created_at);
  }, [expenses]);

  const currentMonth = toYearMonth(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [trendView, setTrendView] = useState<"total" | "category">("total");
  const [trendCategory, setTrendCategory] = useState("");

  async function load() {
    try {
      const [e, c] = await Promise.all([expenseApi.list(), categoryApi.list()]);
      setExpenses(e);
      setCategories(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setCategoryError("");
    try {
      await categoryApi.create(newCategoryName.trim());
      setNewCategoryName("");
      setShowNewCategory(false);
      setCategories(await categoryApi.list());
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : "Failed to create");
    }
  }

  // split income vs spend
  const incomeRows = useMemo(() => expenses.filter((e) => e.category === "income"), [expenses]);
  const spendRows  = useMemo(() => expenses.filter((e) => e.category !== "income"), [expenses]);

  // top-line stats
  const currentMonthSpend = useMemo(() =>
    spendRows
      .filter((e) => toYearMonth(e.date) === currentMonth)
      .reduce((s, e) => s + parseFloat(e.amount), 0),
    [spendRows, currentMonth]
  );

  const currentMonthIncome = useMemo(() =>
    incomeRows
      .filter((e) => toYearMonth(e.date) === currentMonth)
      .reduce((s, e) => s + parseFloat(e.amount), 0),
    [incomeRows, currentMonth]
  );

  const avgMonthlySpend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    spendRows.forEach((e) => {
      const ym = toYearMonth(e.date);
      byMonth[ym] = (byMonth[ym] || 0) + parseFloat(e.amount);
    });
    const months = Object.values(byMonth);
    return months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;
  }, [spendRows]);

  // monthly trend (spend only, chronological)
  const monthlyTrend = useMemo(() => {
    const byMonth: Record<string, number> = {};
    spendRows.forEach((e) => {
      const ym = toYearMonth(e.date);
      byMonth[ym] = (byMonth[ym] || 0) + parseFloat(e.amount);
    });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, total]) => {
        const [y, m] = ym.split("-").map(Number);
        const label = new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" });
        return { label, total: Math.round(total) };
      });
  }, [spendRows]);

  // unique spend categories across all time
  const spendCategories = useMemo(() =>
    Array.from(new Set(spendRows.map((e) => e.category))).sort(),
    [spendRows]
  );

  // category-wise monthly trend
  const categoryTrend = useMemo(() => {
    if (!trendCategory) return [];
    const byMonth: Record<string, number> = {};
    spendRows
      .filter((e) => e.category === trendCategory)
      .forEach((e) => {
        const ym = toYearMonth(e.date);
        byMonth[ym] = (byMonth[ym] || 0) + parseFloat(e.amount);
      });
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([ym, total]) => {
        const [y, m] = ym.split("-").map(Number);
        const label = new Date(y, m - 1, 1).toLocaleString("default", { month: "short", year: "2-digit" });
        return { label, total: Math.round(total) };
      });
  }, [spendRows, trendCategory]);

  // month options
  const monthOptions = useMemo(() => {
    const set = new Set(expenses.map((e) => toYearMonth(e.date)));
    set.add(currentMonth);
    return Array.from(set).sort().reverse();
  }, [expenses, currentMonth]);

  // selected month data
  const monthSpendRows = useMemo(() =>
    spendRows.filter((e) => toYearMonth(e.date) === selectedMonth),
    [spendRows, selectedMonth]
  );

  const monthTotal = useMemo(() =>
    monthSpendRows.reduce((s, e) => s + parseFloat(e.amount), 0),
    [monthSpendRows]
  );

  const categoryTotals = useMemo(() => {
    const bycat: Record<string, number> = {};
    monthSpendRows.forEach((e) => {
      bycat[e.category] = (bycat[e.category] || 0) + parseFloat(e.amount);
    });
    return Object.entries(bycat)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthSpendRows]);

  const dailyRows = useMemo(() => {
    const byDay: Record<string, Expense[]> = {};
    monthSpendRows.forEach((e) => {
      byDay[e.date] = [...(byDay[e.date] || []), e];
    });
    return Object.entries(byDay)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
        total: items.reduce((s, e) => s + parseFloat(e.amount), 0),
      }));
  }, [monthSpendRows]);

  async function handleCreate(data: ExpenseCreate) {
    await expenseApi.create(data);
    setShowForm(false);
    load();
  }

  async function handleUpdate(data: ExpenseCreate) {
    if (!editing) return;
    await expenseApi.update(editing.id, data);
    setEditing(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this expense?")) return;
    await expenseApi.delete(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          {lastUpdated && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last updated{" "}
              {lastUpdated.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowNewCategory(true); setShowForm(false); }}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
          >
            + Category
          </button>
          <button
            onClick={() => { setShowForm(true); setShowNewCategory(false); }}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            + Add
          </button>
        </div>
      </div>

      {showNewCategory && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">New Category</h2>
          <form onSubmit={handleCreateCategory} className="flex gap-3 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. subscriptions"
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {categoryError && <p className="text-xs text-red-600 mt-1">{categoryError}</p>}
            </div>
            <button type="submit" className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
              Save
            </button>
            <button type="button" onClick={() => { setShowNewCategory(false); setCategoryError(""); }} className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </form>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{error}</p>}

      {(showForm || editing) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editing ? "Edit Expense" : "New Expense"}
          </h2>
          <ExpenseForm
            initial={editing ?? undefined}
            categories={categories}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">This month's spend</p>
          <p className="text-3xl font-semibold text-gray-900">{fmt(currentMonthSpend)}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">Avg monthly spend</p>
          <p className="text-3xl font-semibold text-gray-900">{fmt(Math.round(avgMonthlySpend))}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">This month's income</p>
          <p className="text-3xl font-semibold text-green-600">{fmt(currentMonthIncome)}</p>
        </div>
      </div>

      {/* Monthly spend trend */}
      {monthlyTrend.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-base font-medium text-gray-700">Monthly spend trend</h2>
            <div className="ml-auto flex items-center gap-2">
              <div className="flex rounded-md border border-gray-200 overflow-hidden text-sm">
                <button
                  onClick={() => setTrendView("total")}
                  className={`px-3 py-1.5 transition-colors ${trendView === "total" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  Total
                </button>
                <button
                  onClick={() => { setTrendView("category"); if (!trendCategory && spendCategories.length) setTrendCategory(spendCategories[0]); }}
                  className={`px-3 py-1.5 transition-colors ${trendView === "category" ? "bg-indigo-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  By category
                </button>
              </div>
              {trendView === "category" && (
                <select
                  value={trendCategory}
                  onChange={(e) => setTrendCategory(e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {spendCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={trendView === "total" ? monthlyTrend : categoryTrend}
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmt(v)} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Month selector + breakdown */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-medium text-gray-700">Monthly breakdown</h2>
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

        {categoryTotals.length === 0 ? (
          <p className="text-sm text-gray-400">No expenses for this month.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryTotals} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <span className="text-sm font-medium text-gray-700">Total</span>
              <span className="text-lg font-semibold text-gray-900">{fmt(monthTotal)}</span>
            </div>

            <div className="divide-y divide-gray-100">
              {categoryTotals.map(({ category, total }) => (
                <div key={category} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-700 capitalize">{category}</span>
                  <span className="text-sm font-medium text-gray-900">{fmt(total)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-600">Day-wise breakdown</h3>
              {dailyRows.map(({ date, items, total }) => (
                <div key={date}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{fmt(total)}</span>
                  </div>
                  <div className="divide-y divide-gray-50 pl-3 border-l-2 border-indigo-100">
                    {items.map((e) => (
                      <div key={e.id} className="flex items-center justify-between py-1.5 group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-indigo-400 capitalize shrink-0">{e.category}</span>
                          {e.description && (
                            <span className="text-xs text-gray-500 truncate">{e.description}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <span className="text-xs font-medium text-gray-800">{fmt(parseFloat(e.amount))}</span>
                          <button onClick={() => setEditing(e)} className="text-xs text-indigo-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Edit</button>
                          <button onClick={() => handleDelete(e.id)} className="text-xs text-red-400 hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
