import AsyncStorage from '@react-native-async-storage/async-storage';
import { createEmptyData, HABIT_ICONS, type Habit, type HabitPulseData } from '../domain/models';
import { fromDateKey, toDateKey } from '../domain/dates';

const STORAGE_KEY = 'habitpulse.data.v2';
const LEGACY_KEY = 'habitpulse.v1';
const LEGACY_ICON_MAP: Record<string, string> = {
  '💧': 'water',
  '📚': 'book-open-page-variant',
  '🧘': 'meditation',
  '🚶': 'walk',
  '🥗': 'food-apple',
  '✍️': 'pencil',
  '🌱': 'leaf',
  '💤': 'leaf',
};

const normalizeIcon = (icon: string): string => {
  const normalized = LEGACY_ICON_MAP[icon] ?? icon;
  return (HABIT_ICONS as readonly string[]).includes(normalized) ? normalized : 'leaf';
};

const isFrequency = (value: unknown): value is Habit['frequency'] => {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;
  const frequency = value as Record<string, unknown>;
  if (frequency.type === 'daily') return true;
  if (frequency.type === 'weekly') return Number.isInteger(frequency.target) && Number(frequency.target) >= 1 && Number(frequency.target) <= 7;
  if (frequency.type === 'weekdays') return Array.isArray(frequency.days) && frequency.days.length > 0 && frequency.days.every((day) => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6);
  if (frequency.type === 'interval') return Number.isInteger(frequency.everyDays) && Number(frequency.everyDays) >= 2 && Number(frequency.everyDays) <= 365;
  return false;
};

const isDateKey = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return toDateKey(fromDateKey(value)) === value;
};

const migrateLegacy = (value: unknown): HabitPulseData => {
  const empty = createEmptyData();
  if (!value || typeof value !== 'object') return empty;
  const legacy = value as { habits?: Record<string, unknown>[]; darkMode?: boolean };
  if (!Array.isArray(legacy.habits)) return empty;
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    habits: legacy.habits.flatMap((item): Habit[] => {
      if (typeof item.name !== 'string') return [];
      const oldCompletions = Array.isArray(item.completions) ? item.completions : [];
      return [{
        id: typeof item.id === 'string' ? item.id : `migrated-${Math.random().toString(36).slice(2)}`,
        name: item.name,
        description: '',
        category: 'Productivity',
        color: typeof item.color === 'string' ? item.color : '#63966B',
        icon: normalizeIcon(typeof item.icon === 'string' ? item.icon : 'leaf'),
        frequency: { type: 'daily' },
        startDate: oldCompletions.find((date) => typeof date === 'string') ?? toDateKey(new Date()),
        archived: false,
        favorite: false,
        completions: oldCompletions.flatMap((date) => typeof date === 'string' ? [{ date }] : []),
        reminderTimes: [],
        createdAt: now,
        updatedAt: now,
      }];
    }),
    settings: { theme: legacy.darkMode ? 'dark' : 'system', customCategories: [] },
  };
};

export const loadData = async (): Promise<HabitPulseData> => {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored) as HabitPulseData;
    if (parsed.schemaVersion === 2 && Array.isArray(parsed.habits) && parsed.settings) {
      const normalized = { ...parsed, habits: parsed.habits.map((habit) => ({ ...habit, icon: normalizeIcon(habit.icon) })) };
      if (normalized.habits.some((habit, index) => habit.icon !== parsed.habits[index].icon)) await saveData(normalized);
      return normalized;
    }
  }
  const legacy = await AsyncStorage.getItem(LEGACY_KEY);
  if (legacy) {
    const migrated = migrateLegacy(JSON.parse(legacy));
    await saveData(migrated);
    return migrated;
  }
  return createEmptyData();
};

export const saveData = (data: HabitPulseData): Promise<void> =>
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

export const validateImportedData = (value: unknown): HabitPulseData => {
  if (!value || typeof value !== 'object') throw new Error('Backup must be a JSON object.');
  const candidate = value as Partial<HabitPulseData>;
  if (!Array.isArray(candidate.habits)) throw new Error('Backup does not contain a habits list.');
  const habits = candidate.habits.map((habit) => {
    if (!habit || typeof habit !== 'object' || typeof habit.id !== 'string' || !habit.id || typeof habit.name !== 'string' || !habit.name.trim() ||
      typeof habit.description !== 'string' || typeof habit.category !== 'string' || typeof habit.color !== 'string' || typeof habit.icon !== 'string' ||
      !isFrequency(habit.frequency) || !isDateKey(habit.startDate) || typeof habit.archived !== 'boolean' || typeof habit.favorite !== 'boolean' ||
      !Array.isArray(habit.completions) || !habit.completions.every((completion) => Boolean(completion && typeof completion === 'object' && isDateKey(completion.date) && (completion.note === undefined || typeof completion.note === 'string'))) ||
      !Array.isArray(habit.reminderTimes) || !habit.reminderTimes.every((time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time)) ||
      (habit.notesByDate !== undefined && (!habit.notesByDate || typeof habit.notesByDate !== 'object' || Object.entries(habit.notesByDate).some(([date, note]) => !isDateKey(date) || typeof note !== 'string')))) {
      throw new Error('Backup contains unsupported habit records.');
    }
    const completionsByDate = new Map<string, (typeof habit.completions)[number]>();
    for (const completion of habit.completions) completionsByDate.set(completion.date, completion);
    return {
      ...habit,
      icon: normalizeIcon(habit.icon),
      completions: [...completionsByDate.values()].sort((first, second) => first.date.localeCompare(second.date)),
    } as Habit;
  });
  return {
    schemaVersion: 2,
    habits,
    settings: {
      theme: candidate.settings?.theme === 'light' || candidate.settings?.theme === 'dark' ? candidate.settings.theme : 'system',
      customCategories: Array.isArray(candidate.settings?.customCategories)
        ? candidate.settings.customCategories.filter((category): category is string => typeof category === 'string')
        : [],
    },
  };
};
