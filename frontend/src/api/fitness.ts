import { api } from "./client";
import type { FitnessLog, FitnessLogCreate, FitnessLogUpdate, FitnessStats } from "../types";

export const fitnessApi = {
  list: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.get<FitnessLog[]>(`/fitness/?${params}`);
  },
  get: (id: number) => api.get<FitnessLog>(`/fitness/${id}`),
  create: (data: FitnessLogCreate) => api.post<FitnessLog>("/fitness/", data),
  update: (id: number, data: FitnessLogUpdate) => api.patch<FitnessLog>(`/fitness/${id}`, data),
  delete: (id: number) => api.delete(`/fitness/${id}`),
  stats: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    return api.get<FitnessStats>(`/fitness/stats?${params}`);
  },
};
