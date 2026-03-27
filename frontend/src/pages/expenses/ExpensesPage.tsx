import { useEffect, useState } from "react";
import { expenseApi } from "../../api/expense";
import ExpenseForm from "../../components/expenses/ExpenseForm";
import type { Expense, ExpenseCreate, ExpenseStats } from "../../types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const [e, s] = await Promise.all([expenseApi.list(), expenseApi.stats()]);
      setExpenses(e);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

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
        <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
        >
          + Add
        </button>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{error}</p>}

      {(showForm || editing) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editing ? "Edit Expense" : "New Expense"}
          </h2>
          <ExpenseForm
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
            <p className="text-sm text-gray-500">Total spent</p>
            <p className="text-3xl font-semibold text-gray-900">₹{stats.total_spent}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Daily average</p>
            <p className="text-3xl font-semibold text-gray-900">₹{stats.daily_average}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-sm text-gray-500">Categories</p>
            <p className="text-3xl font-semibold text-gray-900">{stats.by_category.length}</p>
          </div>
        </div>
      )}

      {stats && stats.by_category.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-medium text-gray-700 mb-4">By category</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.by_category}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {expenses.length === 0 && (
          <p className="p-6 text-sm text-gray-500">No expenses yet.</p>
        )}
        {expenses.map((exp) => (
          <div key={exp.id} className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                ₹{exp.amount} · {exp.category}
              </p>
              <p className="text-sm text-gray-500">
                {exp.date}
                {exp.description ? ` · ${exp.description}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(exp)}
                className="text-sm text-indigo-600 hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(exp.id)}
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
