import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HabitDetailScreen from '../app/habit/[id]';
import { toDateKey } from '../src/domain/dates';
import { HabitStoreProvider } from '../src/hooks/useHabitStore';
import { syncHabitReminders } from '../src/services/reminders';
import { habitLightTheme } from '../src/theme/paperTheme';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) },
  useLocalSearchParams: () => ({ id: 'water' }),
}));

jest.mock('../src/services/reminders', () => ({ syncHabitReminders: jest.fn().mockResolvedValue(undefined) }));

const Wrapper = ({ children }: React.PropsWithChildren) => (
  <SafeAreaProvider>
    <HabitStoreProvider>
      <PaperProvider theme={habitLightTheme}>{children}</PaperProvider>
    </HabitStoreProvider>
  </SafeAreaProvider>
);

const seedHabit = () => AsyncStorage.setItem('habitpulse.data.v2', JSON.stringify({
  schemaVersion: 2,
  settings: { theme: 'system', customCategories: [], tourCompleted: true },
  habits: [{
    id: 'water',
    name: 'Drink water',
    description: 'Eight glasses',
    category: 'Health',
    color: '#63966B',
    icon: 'water',
    frequency: { type: 'hourly', everyHours: 2 },
    startDate: toDateKey(new Date()),
    archived: false,
    favorite: false,
    completions: [],
    reminderTimes: [],
    createdAt: '2026-06-01T08:00:00.000Z',
    updatedAt: '2026-06-01T08:00:00.000Z',
  }],
}));

const stored = async () => JSON.parse((await AsyncStorage.getItem('habitpulse.data.v2')) ?? '{}');

describe('habit detail screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    await seedHabit();
  });

  it('renders the habit with its schedule and stats', async () => {
    await render(<HabitDetailScreen />, { wrapper: Wrapper });

    expect(await screen.findByText('Drink water')).toBeTruthy();
    expect(screen.getByText('Health · hourly')).toBeTruthy();
    expect(screen.getByText('CURRENT STREAK')).toBeTruthy();
    expect(screen.getByText('Eight glasses')).toBeTruthy();
  });

  it('marks today complete and persists the completion', async () => {
    await render(<HabitDetailScreen />, { wrapper: Wrapper });

    await fireEvent.press(await screen.findByText('Mark complete'));

    expect(await screen.findByText('Undo today')).toBeTruthy();
    await waitFor(async () => {
      expect((await stored()).habits[0].completions.map((entry: { date: string }) => entry.date)).toEqual([toDateKey(new Date())]);
    });
  });

  it('saves a daily note without creating a completion', async () => {
    await render(<HabitDetailScreen />, { wrapper: Wrapper });

    await fireEvent.changeText(await screen.findByLabelText('Daily note'), 'Two glasses before lunch');
    await fireEvent.press(screen.getByText('Save note'));

    await waitFor(async () => {
      const habit = (await stored()).habits[0];
      expect(habit.notesByDate?.[toDateKey(new Date())]).toBe('Two glasses before lunch');
      expect(habit.completions).toEqual([]);
    });
  });

  it('archives the habit, cancels reminders, and navigates back', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<HabitDetailScreen />, { wrapper: Wrapper });

    await fireEvent.press(await screen.findByText('Archive'));

    await waitFor(async () => {
      expect((await stored()).habits[0].archived).toBe(true);
    });
    expect(jest.mocked(syncHabitReminders)).toHaveBeenCalledWith(expect.objectContaining({ archived: true }));
    expect(router.back).toHaveBeenCalled();
  });

  it('deletes the habit after the destructive confirmation', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _message, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });
    await render(<HabitDetailScreen />, { wrapper: Wrapper });

    await act(async () => {
      fireEvent.press(await screen.findByText('Delete'));
    });

    expect(alert).toHaveBeenCalledWith('Delete habit?', expect.stringContaining('Drink water'), expect.any(Array));
    await waitFor(async () => {
      expect((await stored()).habits).toEqual([]);
    });
  });
});