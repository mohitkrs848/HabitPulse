import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { toDateKey } from '../domain/dates';
import type { Habit, HabitPulseData, ThemePreference } from '../domain/models';
import { createEmptyData } from '../domain/models';
import { loadData, saveData, validateImportedData } from '../services/storage';
import { syncHabitReminders } from '../services/reminders';

const StoreContext = createContext<{
  data: HabitPulseData;
  ready: boolean;
  error: string | null;
  createHabit: (values: HabitDraft) => Promise<void>;
  updateHabit: (id: string, values: HabitDraft) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  duplicateHabit: (id: string) => void;
  setArchived: (id: string, archived: boolean) => Promise<void>;
  toggleFavorite: (id: string) => void;
  toggleCompletion: (id: string, date?: string) => void;
  setCompletionNote: (id: string, date: string, note: string) => void;
  setTheme: (theme: ThemePreference) => void;
  addCategory: (name: string) => void;
  replaceData: (value: unknown) => Promise<void>;
  setTourCompleted: (done:boolean) => void;
} | null>(null);

export type HabitDraft = Omit<Habit, 'id' | 'completions' | 'createdAt' | 'updatedAt'>;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export function HabitStoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<HabitPulseData>(createEmptyData);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData().then((loaded) => {
      setData(loaded);
      setReady(true);
    }).catch(() => {
      setError('Local data could not be read. The app will start with an empty library.');
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) void saveData(data).catch(() => setError('Changes could not be saved on this device.'));
  }, [data, ready]);

  const writeHabit = async (habit: Habit) => {
    setData((current) => ({ ...current, habits: current.habits.some((item) => item.id === habit.id)
      ? current.habits.map((item) => item.id === habit.id ? habit : item)
      : [...current.habits, habit] }));
    try {
      await syncHabitReminders(habit);
      setError(null);
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : 'Notification permission may be disabled.';
      setError(`Habit saved, but a reminder could not be scheduled. ${detail}`);
    }
  };

  const createHabit = async (values: HabitDraft) => {
    const now = new Date().toISOString();
    await writeHabit({ ...values, id: uid(), completions: [], createdAt: now, updatedAt: now });
  };

  const updateHabit = async (id: string, values: HabitDraft) => {
    const existing = data.habits.find((habit) => habit.id === id);
    if (!existing) return;
    await writeHabit({ ...existing, ...values, updatedAt: new Date().toISOString() });
  };

  const deleteHabit = async (id: string) => {
    const existing = data.habits.find((habit) => habit.id === id);
    if (existing) await syncHabitReminders({ ...existing, archived: true, reminderTimes: [] }).catch(() => undefined);
    setData((current) => ({ ...current, habits: current.habits.filter((habit) => habit.id !== id) }));
  };

  const setArchived = async (id: string, archived: boolean) => {
    const habit = data.habits.find((item) => item.id === id);
    if (!habit) return;
    await writeHabit({ ...habit, archived, updatedAt: new Date().toISOString() });
  };

  const duplicateHabit = (id: string) => {
    const original = data.habits.find((habit) => habit.id === id);
    if (!original) return;
    const now = new Date().toISOString();
    const clone: Habit = { ...original, id: uid(), name: `${original.name} copy`, favorite: false, completions: [], reminderTimes: [], createdAt: now, updatedAt: now };
    setData((current) => ({ ...current, habits: [...current.habits, clone] }));
  };

  const toggleFavorite = (id: string) => {
    setData((current) => ({ ...current, habits: current.habits.map((habit) => habit.id === id ? { ...habit, favorite: !habit.favorite, updatedAt: new Date().toISOString() } : habit) }));
  };

  const toggleCompletion = (id: string, date = toDateKey(new Date())) => {
    setData((current) => ({ ...current, habits: current.habits.map((habit) => {
      if (habit.id !== id) return habit;
      const existing = habit.completions.find((entry) => entry.date === date);
      const completions = existing ? habit.completions.filter((entry) => entry.date !== date) : [...habit.completions, { date }];
      return { ...habit, completions: completions.sort((a, b) => a.date.localeCompare(b.date)), updatedAt: new Date().toISOString() };
    }) }));
  };

  const setCompletionNote = (id: string, date: string, note: string) => {
    setData((current) => ({ ...current, habits: current.habits.map((habit) => {
      if (habit.id !== id) return habit;
      const notesByDate = { ...habit.notesByDate };
      if (note.trim()) notesByDate[date] = note.trim();
      else delete notesByDate[date];
      return { ...habit, notesByDate };
    }) }));
  };

  const setTheme = (theme: ThemePreference) => setData((current) => ({ ...current, settings: { ...current.settings, theme } }));
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((current) => ({ ...current, settings: { ...current.settings, customCategories: [...new Set([...current.settings.customCategories, trimmed])] } }));
  };
  const replaceData = async (value: unknown) => {
    const imported = validateImportedData(value);
    await AsyncStorage.setItem('habitpulse.data.v2', JSON.stringify(imported));
    setData(imported);
  };

  const setTourCompleted = (tourCompleted: boolean) => 
    setData((current) => ({...current, settings: { ...current.settings, tourCompleted}}));

  const value = { data, ready, error, createHabit, updateHabit, deleteHabit, duplicateHabit, setArchived, toggleFavorite, toggleCompletion, setCompletionNote, setTheme, addCategory, replaceData, setTourCompleted };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export const useHabitStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useHabitStore must be used inside HabitStoreProvider');
  return value;
};
