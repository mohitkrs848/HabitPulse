import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HabitEditScreen from '../app/habit/edit';
import TodayScreen from '../app/(tabs)/today';
import { HabitStoreProvider, useHabitStore, type HabitDraft } from '../src/hooks/useHabitStore';
import { loadData, validateImportedData } from '../src/services/storage';
import { syncHabitReminders } from '../src/services/reminders';
import { habitLightTheme } from '../src/theme/paperTheme';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('../src/services/reminders', () => ({ syncHabitReminders: jest.fn().mockResolvedValue(undefined) }));

const Wrapper = ({ children }: React.PropsWithChildren) => (
  <SafeAreaProvider>
    <HabitStoreProvider>
      <PaperProvider theme={habitLightTheme}>{children}</PaperProvider>
    </HabitStoreProvider>
  </SafeAreaProvider>
);

describe('HabitPulse mobile workflows', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('shows a useful first-run empty state with a create action', async () => {
    await render(<TodayScreen />, { wrapper: Wrapper });

    expect(await screen.findByText('A clear little beginning.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create a habit' })).toBeTruthy();
  });

  it('creates an offline habit from the editor and persists its fields', async () => {
    await render(<HabitEditScreen />, { wrapper: Wrapper });
    await fireEvent.changeText(screen.getByLabelText('Habit name'), 'Read before bed');
    await fireEvent.changeText(screen.getByLabelText('Description (optional)'), 'A few pages without a screen');
    await fireEvent.press(screen.getByRole('button', { name: 'Create habit' }));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem('habitpulse.data.v2');
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? '{}').habits).toEqual(expect.arrayContaining([
        expect.objectContaining({ name: 'Read before bed', description: 'A few pages without a screen', frequency: { type: 'daily' }, completions: [] }),
      ]));
    });
  });

  it('keeps a habit saved and explains when Android reminders need a development build', async () => {
    jest.mocked(syncHabitReminders).mockRejectedValueOnce(new Error('Local reminders require a HabitPulse development build on Android.'));
    const store = await renderHook(() => useHabitStore(), { wrapper: Wrapper });
    const draft: HabitDraft = { name: 'Stretch', description: '', category: 'Health', color: '#63966B', icon: 'meditation', frequency: { type: 'daily' }, startDate: '2026-06-01', archived: false, favorite: false, reminderTimes: ['08:00'] };

    await act(async () => store.result.current.createHabit(draft));

    expect(store.result.current.data.habits[0].name).toBe('Stretch');
    expect(store.result.current.error).toContain('development build on Android');
  });

  it('migrates the prototype local data without a network dependency', async () => {
    await AsyncStorage.setItem('habitpulse.v1', JSON.stringify({
      darkMode: true,
      habits: [{ id: 'old-water', name: 'Drink water', icon: '💧', color: '#B8E66A', completions: ['2026-06-01'] }],
    }));
    const migrated = await loadData();

    expect(migrated.settings.theme).toBe('dark');
    expect(migrated.habits[0]).toMatchObject({ id: 'old-water', name: 'Drink water', icon: 'water', frequency: { type: 'daily' }, completions: [{ date: '2026-06-01' }] });
    expect(await AsyncStorage.getItem('habitpulse.data.v2')).not.toBeNull();
  });

  it('keeps daily notes separate from completion records', async () => {
    const store = await renderHook(() => useHabitStore(), { wrapper: Wrapper });
    const draft: HabitDraft = { name: 'Read', description: '', category: 'Learning', color: '#63966B', icon: 'book-open-page-variant', frequency: { type: 'daily' }, startDate: '2026-06-01', archived: false, favorite: false, reminderTimes: [] };
    await act(async () => store.result.current.createHabit(draft));
    const habitId = store.result.current.data.habits[0].id;
    await act(async () => store.result.current.setCompletionNote(habitId, '2026-06-01', 'Read twenty pages'));

    expect(store.result.current.data.habits[0].completions).toEqual([]);
    expect(store.result.current.data.habits[0].notesByDate).toEqual({ '2026-06-01': 'Read twenty pages' });
  });

  it('archives, restores, and duplicates without copying completion history', async () => {
    const store = await renderHook(() => useHabitStore(), { wrapper: Wrapper });
    const draft: HabitDraft = { name: 'Walk', description: '', category: 'Fitness', color: '#63966B', icon: 'walk', frequency: { type: 'daily' }, startDate: '2026-06-01', archived: false, favorite: true, reminderTimes: [] };
    await act(async () => store.result.current.createHabit(draft));
    const habitId = store.result.current.data.habits[0].id;
    await act(async () => store.result.current.toggleCompletion(habitId, '2026-06-01'));
    await act(async () => store.result.current.setArchived(habitId, true));
    expect(store.result.current.data.habits[0].archived).toBe(true);
    await act(async () => store.result.current.setArchived(habitId, false));
    await act(async () => store.result.current.duplicateHabit(habitId));

    expect(store.result.current.data.habits).toHaveLength(2);
    expect(store.result.current.data.habits[1]).toMatchObject({ name: 'Walk copy', favorite: false, completions: [], reminderTimes: [] });
    expect(store.result.current.data.habits[0].completions).toHaveLength(1);
  });

  it('validates imported backups and removes duplicate completion dates', () => {
    const backup = validateImportedData({
      habits: [{ id: 'x', name: 'Walk', description: '', category: 'Health', color: '#63966B', icon: 'walk', frequency: { type: 'daily' }, startDate: '2026-06-01', archived: false, favorite: false, completions: [{ date: '2026-06-01' }, { date: '2026-06-01' }], reminderTimes: [], createdAt: '2026-06-01', updatedAt: '2026-06-01' }],
    });
    expect(backup.habits[0].completions).toHaveLength(1);
    expect(() => validateImportedData({ habits: [{ id: 'bad', name: 'Bad', frequency: { type: 'weekly', target: 99 }, completions: [] }] })).toThrow('unsupported habit records');
  });

  it('repairs old emoji icons already present in v2 storage', async () => {
    await AsyncStorage.setItem('habitpulse.data.v2', JSON.stringify({
      schemaVersion: 2,
      settings: { theme: 'system', customCategories: [] },
      habits: [{ id: 'water', name: 'Drink water', icon: '💧', frequency: { type: 'daily' }, completions: [] }],
    }));
    const loaded = await loadData();

    expect(loaded.habits[0].icon).toBe('water');
    expect(JSON.parse((await AsyncStorage.getItem('habitpulse.data.v2')) ?? '{}').habits[0].icon).toBe('water');
  });
});
