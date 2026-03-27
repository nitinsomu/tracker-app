import { useEffect, useState } from "react";
import { journalApi } from "../../api/journal";
import JournalForm from "../../components/journal/JournalForm";
import type { JournalEntry, JournalEntryCreate } from "../../types";

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  async function load() {
    try {
      setEntries(await journalApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(data: JournalEntryCreate) {
    await journalApi.create(data);
    setShowForm(false);
    load();
  }

  async function handleUpdate(data: JournalEntryCreate) {
    if (!editing) return;
    await journalApi.update(editing.id, data);
    setEditing(null);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this entry?")) return;
    await journalApi.delete(id);
    load();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await journalApi.exportDocx();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "journal.docx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Journal</h1>
        <div className="flex gap-2">
          {entries.length > 0 && (
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {exporting ? "Exporting…" : "Export .docx"}
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
          >
            + New entry
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-md p-3">{error}</p>}

      {(showForm || editing) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editing ? "Edit entry" : "New entry"}
          </h2>
          <JournalForm
            initial={editing ?? undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        {entries.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-sm text-gray-500">
            No entries yet. Write your first one!
          </div>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{entry.date}</p>
                <p className="text-sm text-gray-500 truncate max-w-md">
                  {entry.content.slice(0, 100)}
                  {entry.content.length > 100 ? "…" : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(entry);
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(entry.id);
                  }}
                  className="text-sm text-red-500 hover:underline"
                >
                  Delete
                </button>
                <span className="text-gray-400 text-xs">{expanded === entry.id ? "▲" : "▼"}</span>
              </div>
            </div>
            {expanded === entry.id && (
              <div className="px-6 pb-5 border-t border-gray-100">
                <p className="text-sm text-gray-700 whitespace-pre-wrap pt-4">{entry.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
