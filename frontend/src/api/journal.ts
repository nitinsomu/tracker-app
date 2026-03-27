import { api } from "./client";
import type { JournalEntry, JournalEntryCreate, JournalEntryUpdate } from "../types";

export const journalApi = {
  list: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.get<JournalEntry[]>(`/journal/?${params}`);
  },
  get: (id: number) => api.get<JournalEntry>(`/journal/${id}`),
  create: (data: JournalEntryCreate) => api.post<JournalEntry>("/journal/", data),
  update: (id: number, data: JournalEntryUpdate) => api.patch<JournalEntry>(`/journal/${id}`, data),
  delete: (id: number) => api.delete(`/journal/${id}`),
  exportDocx: async (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.getBlob(`/journal/export?${params}`);
  },
};
