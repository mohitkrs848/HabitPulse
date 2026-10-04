export type ThemePreference = 'system' | 'light' | 'dark';

export type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; target: number }
  | { type: 'weekdays'; days: number[] }
  | { type: 'interval'; everyDays: number };

export type HabitCompletion = {
  date: string;
  note?: string;
};

export type Habit = {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  startDate: string;
  archived: boolean;
  favorite: boolean;
  completions: HabitCompletion[];
  notesByDate?: Record<string, string>;
  reminderTimes: string[];
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  theme: ThemePreference;
  customCategories: string[];
};

export type HabitPulseData = {
  schemaVersion: 2;
  habits: Habit[];
  settings: AppSettings;
};

export type HabitFilter = 'active' | 'archived' | 'completed' | 'missed' | 'favorites';

export type HabitStats = {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  completionPercent: number;
};

export const DEFAULT_CATEGORIES = [
  'Health',
  'Fitness',
  'Learning',
  'Reading',
  'Coding',
  'Meditation',
  'Finance',
  'Productivity',
];

export const HABIT_COLORS = ['#63966B', '#E08E55', '#547E9B', '#BE6C69', '#8C76A6', '#D0A63F'];
export const HABIT_ICONS = ['water', 'book-open-page-variant', 'dumbbell', 'meditation', 'code-tags', 'walk', 'food-apple', 'cash-multiple', 'leaf', 'pencil'];

export const createEmptyData = (): HabitPulseData => ({
  schemaVersion: 2,
  habits: [],
  settings: { theme: 'system', customCategories: [] },
});
