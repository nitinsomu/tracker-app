import { api } from "./client";
import type { Expense, ExpenseCreate, ExpenseStats, ExpenseUpdate } from "../types";

export const expenseApi = {
  list: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.get<Expense[]>(`/expenses/?${params}`);
  },
  get: (id: number) => api.get<Expense>(`/expenses/${id}`),
  create: (data: ExpenseCreate) => api.post<Expense>("/expenses/", data),
  update: (id: number, data: ExpenseUpdate) => api.patch<Expense>(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
  stats: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.get<ExpenseStats>(`/expenses/stats?${params}`);
  },
};
