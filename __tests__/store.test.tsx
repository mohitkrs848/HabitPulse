import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitStoreProvider, useHabitStore, type HabitDraft } from '../src/hooks/useHabitStore';
import { syncHabitReminders } from '../src/services/reminders';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('../src/services/reminders', () => ({ syncHabitReminders: jest.fn().mockResolvedValue(undefined) }));

const Wrapper = ({ children }: React.PropsWithChildren) => (
  <SafeAreaProvider>
    <HabitStoreProvider>{children}</HabitStoreProvider>
  </SafeAreaProvider>
);

const draft = (overrides: Partial<HabitDraft> = {}): HabitDraft => ({
  name: 'Drink water',
  description: '',
  category: 'Health',
  color: '#63966B',
  icon: 'water',
  frequency: { type: 'daily' },
  startDate: '2026-06-01',
  archived: false,
  favorite: false,
  reminderTimes: [],
  ...overrides,
});

const stored = async () => JSON.parse((await AsyncStorage.getItem('habitpulse.data.v2')) ?? 'null');

const readyStore = async () => {
  const store = await renderHook(() => useHabitStore(), { wrapper: Wrapper });
  await waitFor(() => expect(store.result.current.ready).toBe(true));
  return store;
};

describe('habit store', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('becomes ready and reflects previously stored data', async () => {
    await AsyncStorage.setItem('habitpulse.data.v2', JSON.stringify({
      schemaVersion: 2,
      settings: { theme: 'dark', customCategories: ['Rituals'], tourCompleted: true },
      habits: [],
    }));

    const store = await readyStore();

    expect(store.result.current.data.settings).toMatchObject({ theme: 'dark', tourCompleted: true, customCategories: ['Rituals'] });
    expect(store.result.current.error).toBeNull();
  });

  it('starts empty with the tour pending when nothing is stored', async () => {
    const store = await readyStore();

    expect(store.result.current.data.habits).toEqual([]);
    expect(store.result.current.data.settings.tourCompleted).toBe(false);
  });

  it('creates a habit, persists it, and syncs its reminders', async () => {
    const store = await readyStore();

    await act(async () => store.result.current.createHabit(draft({ name: 'Stretch', reminderTimes: ['08:30'] })));

    expect(store.result.current.data.habits[0]).toMatchObject({ name: 'Stretch', reminderTimes: ['08:30'], completions: [] });
    expect(jest.mocked(syncHabitReminders)).toHaveBeenCalledWith(expect.objectContaining({ name: 'Stretch' }));
    expect((await stored()).habits).toHaveLength(1);
    expect(store.result.current.error).toBeNull();
  });

  it('surfaces a friendly error when reminder scheduling fails', async () => {
    jest.mocked(syncHabitReminders).mockRejectedValueOnce(new Error('Local reminders require a development build.'));
    const store = await readyStore();

    await act(async () => store.result.current.createHabit(draft({ reminderTimes: ['08:30'] })));

    expect(store.result.current.data.habits).toHaveLength(1);
    expect(store.result.current.error).toContain('development build');
  });

  it('updates habit fields through updateHabit', async () => {
    const store = await readyStore();
    await act(async () => store.result.current.createHabit(draft({ name: 'Read' })));
    const id = store.result.current.data.habits[0].id;

    await act(async () => store.result.current.updateHabit(id, draft({ name: 'Read 20 pages', reminderTimes: ['21:00'] })));

    expect(store.result.current.data.habits[0]).toMatchObject({ id, name: 'Read 20 pages', reminderTimes: ['21:00'] });
    expect((await stored()).habits[0].name).toBe('Read 20 pages');
  });

  it('ignores updates for unknown habit ids', async () => {
    const store = await readyStore();

    await act(async () => store.result.current.updateHabit('missing', draft({ name: 'Ghost' })));

    expect(store.result.current.data.habits).toEqual([]);
  });

  it('deletes a habit and cancels its scheduled reminders', async () => {
    const store = await readyStore();
    await act(async () => store.result.current.createHabit(draft({ reminderTimes: ['08:30'] })));
    const id = store.result.current.data.habits[0].id;

    await act(async () => store.result.current.deleteHabit(id));

    expect(store.result.current.data.habits).toEqual([]);
    expect((await stored()).habits).toEqual([]);
    expect(jest.mocked(syncHabitReminders)).toHaveBeenLastCalledWith(expect.objectContaining({ archived: true, reminderTimes: [] }));
  });

  it('duplicates a habit without copying completions or favorites', async () => {
    const store = await readyStore();
    await act(async () => store.result.current.createHabit(draft({ name: 'Walk', favorite: true })));
    const id = store.result.current.data.habits[0].id;
    await act(async () => store.result.current.toggleCompletion(id, '2026-06-02'));

    await act(async () => store.result.current.duplicateHabit(id));

    expect(store.result.current.data.habits.map((habit) => habit.name)).toEqual(['Walk', 'Walk copy']);
    expect(store.result.current.data.habits[1]).toMatchObject({ favorite: false, completions: [] });
    expect(store.result.current.data.habits[0].completions).toHaveLength(1);
  });

  it('toggles completions and favorites', async () => {
    const store = await readyStore();
    await act(async () => store.result.current.createHabit(draft()));
    const id = store.result.current.data.habits[0].id;

    await act(async () => store.result.current.toggleCompletion(id, '2026-06-02'));
    await act(async () => store.result.current.toggleFavorite(id));

    expect(store.result.current.data.habits[0].completions).toEqual([{ date: '2026-06-02' }]);
    expect(store.result.current.data.habits[0].favorite).toBe(true);

    await act(async () => store.result.current.toggleCompletion(id, '2026-06-02'));
    await act(async () => store.result.current.toggleFavorite(id));

    expect(store.result.current.data.habits[0].completions).toEqual([]);
    expect(store.result.current.data.habits[0].favorite).toBe(false);
  });

  it('keeps daily notes separate from completions', async () => {
    const store = await readyStore();
    await act(async () => store.result.current.createHabit(draft()));
    const id = store.result.current.data.habits[0].id;

    await act(async () => store.result.current.setCompletionNote(id, '2026-06-02', 'Felt easy'));

    expect(store.result.current.data.habits[0].notesByDate).toEqual({ '2026-06-02': 'Felt easy' });
    expect(store.result.current.data.habits[0].completions).toEqual([]);

    await act(async () => store.result.current.setCompletionNote(id, '2026-06-02', '   '));

    expect(store.result.current.data.habits[0].notesByDate).toEqual({});
  });

  it('updates the theme and deduplicates custom categories', async () => {
    const store = await readyStore();

    await act(async () => store.result.current.setTheme('dark'));
    await act(async () => store.result.current.addCategory('Rituals'));
    await act(async () => store.result.current.addCategory('Rituals'));
    await act(async () => store.result.current.addCategory('   '));

    expect(store.result.current.data.settings.theme).toBe('dark');
    expect(store.result.current.data.settings.customCategories).toEqual(['Rituals']);
    expect((await stored()).settings.customCategories).toEqual(['Rituals']);
  });

  it('persists the tour completion flag', async () => {
    const store = await readyStore();

    await act(async () => store.result.current.setTourCompleted(true));

    expect((await stored()).settings.tourCompleted).toBe(true);
  });

  it('replaces local data from a valid backup and rejects invalid ones', async () => {
    const store = await readyStore();
    const backup = {
      schemaVersion: 2,
      settings: { theme: 'light', customCategories: [], tourCompleted: true },
      habits: [{ id: 'restored', name: 'Restored walk', description: '', category: 'Fitness', color: '#63966B', icon: 'walk', frequency: { type: 'hourly', everyHours: 2 }, startDate: '2026-06-01', archived: false, favorite: false, completions: [], reminderTimes: [], createdAt: '2026-06-01T08:00:00.000Z', updatedAt: '2026-06-01T08:00:00.000Z' }],
    };

    await act(async () => { await expect(store.result.current.replaceData({ habits: 'nope' })).rejects.toThrow('habits list'); });
    expect(store.result.current.data.habits).toEqual([]);

    await act(async () => store.result.current.replaceData(backup));

    expect(store.result.current.data.habits[0]).toMatchObject({ id: 'restored', frequency: { type: 'hourly', everyHours: 2 } });
    expect((await stored()).habits[0].id).toBe('restored');
  });
});