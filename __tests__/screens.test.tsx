import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text } from 'react-native';
import InsightsScreen from '../app/(tabs)/insights';
import SettingsScreen from '../app/(tabs)/settings';
import TourScreen from '../app/tour';
import { toDateKey } from '../src/domain/dates';
import { HabitStoreProvider, useHabitStore } from '../src/hooks/useHabitStore';
import { exportCsv, exportJson } from '../src/services/backup';
import { syncHabitReminders } from '../src/services/reminders';
import { habitLightTheme } from '../src/theme/paperTheme';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) },
  useLocalSearchParams: () => ({}),
}));

jest.mock('../src/services/reminders', () => ({ syncHabitReminders: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../src/services/backup', () => ({
  exportJson: jest.fn().mockResolvedValue(undefined),
  exportCsv: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { cache: '/cache' } }));

const Wrapper = ({ children }: React.PropsWithChildren) => (
  <SafeAreaProvider>
    <HabitStoreProvider>
      <PaperProvider theme={habitLightTheme}>{children}</PaperProvider>
    </HabitStoreProvider>
  </SafeAreaProvider>
);

const habitRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'water',
  name: 'Drink water',
  description: '',
  category: 'Health',
  color: '#63966B',
  icon: 'water',
  frequency: { type: 'daily' },
  startDate: toDateKey(new Date()),
  archived: false,
  favorite: false,
  completions: [],
  reminderTimes: [],
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-06-01T08:00:00.000Z',
  ...overrides,
});

const seed = async (habits: unknown[]) => AsyncStorage.setItem('habitpulse.data.v2', JSON.stringify({
  schemaVersion: 2,
  settings: { theme: 'system', customCategories: [], tourCompleted: true },
  habits,
}));

describe('insights screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('shows a first-run empty state', async () => {
    await render(<InsightsScreen />, { wrapper: Wrapper });

    expect(await screen.findByText('Your story starts with a habit.')).toBeTruthy();
  });

  it('summarizes metrics, milestones, and per-habit success', async () => {
    const today = toDateKey(new Date());
    await seed([habitRecord({ completions: [{ date: today }] })]);
    await render(<InsightsScreen />, { wrapper: Wrapper });

    // '1/1' appears in the TODAY metric and the First habit milestone label.
    expect(await screen.findAllByText('1/1')).toHaveLength(2);
    expect(screen.getByText('First habit')).toBeTruthy();
    expect(screen.getByText('Drink water')).toBeTruthy();
    expect(screen.getByText(/Overall habit success: 100%/)).toBeTruthy();
  });
});

describe('settings screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('persists a dark theme choice', async () => {
    await render(<SettingsScreen />, { wrapper: Wrapper });
    expect(await screen.findByText('HABITPULSE · PRIVATE BY DESIGN · VERSION 1.0')).toBeTruthy();

    await fireEvent.press(screen.getByText('Dark'));

    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem('habitpulse.data.v2')) ?? '{}');
      expect(stored.settings.theme).toBe('dark');
    });
  });

  it('adds a custom category for the habit editor', async () => {
    await render(<SettingsScreen />, { wrapper: Wrapper });

    await fireEvent.changeText(screen.getByLabelText('New category'), 'Rituals');
    await fireEvent.press(screen.getByText('Add'));

    expect(await screen.findByText('Rituals')).toBeTruthy();
    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem('habitpulse.data.v2')) ?? '{}');
      expect(stored.settings.customCategories).toEqual(['Rituals']);
    });
  });

  it('exports a JSON backup through the backup service', async () => {
    await render(<SettingsScreen />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('Export JSON backup'));

    await waitFor(() => expect(jest.mocked(exportJson)).toHaveBeenCalledWith(expect.objectContaining({ habits: [], schemaVersion: 2 })));
    expect(exportCsv).not.toHaveBeenCalled();
  });

  it('routes to reminders, tour, and privacy sections', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<SettingsScreen />, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('Manage habit reminders'));
    await fireEvent.press(screen.getByText('Take the tour'));
    await fireEvent.press(screen.getByText('Read privacy information'));

    expect(router.push).toHaveBeenCalledWith('/habits');
    expect(router.push).toHaveBeenCalledWith('/tour');
    expect(router.push).toHaveBeenCalledWith('/privacy');
  });
});

describe('tour screen', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  const TourProbe = () => {
    const { data } = useHabitStore();
    return <Text>{`TOUR:${data.settings.tourCompleted}`}</Text>;
  };

  it('skipping marks the tour complete and returns to today', async () => {
    const { router } = jest.requireMock('expo-router');
    await render(<><TourScreen /><TourProbe /></>, { wrapper: Wrapper });

    await fireEvent.press(screen.getByText('Skip'));

    expect(await screen.findByText('TOUR:true')).toBeTruthy();
    expect(router.replace).toHaveBeenCalledWith('/today');
  });
});