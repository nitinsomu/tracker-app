import { useState } from "react";
import type { FitnessLog, FitnessLogCreate } from "../../types";

interface Props {
  initial?: FitnessLog;
  onSubmit: (data: FitnessLogCreate) => Promise<void>;
  onCancel: () => void;
}

export default function FitnessForm({ initial, onSubmit, onCancel }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(initial?.date ?? today);
  const [weight, setWeight] = useState(String(initial?.body_weight_kg ?? ""));
  const [activities, setActivities] = useState(initial?.activities.join(", ") ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        date,
        body_weight_kg: parseFloat(weight),
        activities: activities
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{error}</p>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Activities <span className="text-gray-400 font-normal">(comma-separated, leave empty for rest day)</span>
        </label>
        <input
          type="text"
          value={activities}
          onChange={(e) => setActivities(e.target.value)}
          placeholder="Running, Push-ups"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
