export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Fitness
export interface FitnessLog {
  id: number;
  date: string;
  activities: string[];
  body_weight_kg: number;
  created_at: string;
}

export interface FitnessLogCreate {
  date: string;
  activities: string[];
  body_weight_kg: number;
}

export interface FitnessLogUpdate {
  date?: string;
  activities?: string[];
  body_weight_kg?: number;
}

export interface WeightPoint {
  date: string;
  body_weight_kg: number;
}

export interface ActivityCount {
  activity: string;
  count: number;
}

export interface FitnessStats {
  weight_trend: WeightPoint[];
  activity_counts: ActivityCount[];
  total_days_logged: number;
  rest_days: number;
  active_days: number;
}

// Categories
export interface Category {
  id: number;
  name: string;
}

// Expenses
export interface Expense {
  id: number;
  date: string;
  amount: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface ExpenseCreate {
  date: string;
  amount: number;
  category: string;
  description?: string;
}

export interface ExpenseUpdate {
  date?: string;
  amount?: number;
  category?: string;
  description?: string;
}

export interface CategoryTotal {
  category: string;
  total: string;
}

export interface ExpenseStats {
  total_spent: string;
  by_category: CategoryTotal[];
  daily_average: string;
}

// Journal
export interface JournalEntry {
  id: number;
  date: string;
  content: string;
  created_at: string;
}

export interface JournalEntryCreate {
  date: string;
  content: string;
}

export interface JournalEntryUpdate {
  date?: string;
  content?: string;
}
