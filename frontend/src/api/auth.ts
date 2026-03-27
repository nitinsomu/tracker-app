import { api } from "./client";
import type { Token, User } from "../types";

export const authApi = {
  register: (email: string, username: string, password: string) =>
    api.post<User>("/auth/register", { email, username, password }),
  login: (email: string, password: string) =>
    api.post<Token>("/auth/login", { email, password }),
  me: () => api.get<User>("/auth/me"),
};
