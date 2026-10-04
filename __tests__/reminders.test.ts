import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { syncHabitReminders } from '../src/services/reminders';
import type { Habit } from '../src/domain/models';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(null),
  getPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('scheduled-reminder'),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone', expoGoConfig: null },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

const sampleHabit: Habit = {
  id: 'habit-a',
  name: 'Drink water',
  description: '',
  category: 'Health',
  color: '#63966B',
  icon: 'water',
  frequency: { type: 'daily' },
  startDate: '2026-06-01',
  archived: false,
  favorite: false,
  completions: [],
  reminderTimes: ['08:15', '20:30'],
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('on-device reminders', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'android' });
    Object.defineProperty(Constants, 'executionEnvironment', { configurable: true, value: 'standalone' });
    Object.defineProperty(Constants, 'expoGoConfig', { configurable: true, value: null });
    jest.clearAllMocks();
  });

  it('does not load native notifications for ordinary habit saves in Android Expo Go', async () => {
    Object.defineProperty(Constants, 'executionEnvironment', { configurable: true, value: 'storeClient' });
    Object.defineProperty(Constants, 'expoGoConfig', { configurable: true, value: {} });

    await expect(syncHabitReminders({ ...sampleHabit, reminderTimes: [] })).resolves.toBeUndefined();
    expect(Notifications.getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
  });

  it('explains that configured reminders need a development build in Android Expo Go', async () => {
    Object.defineProperty(Constants, 'executionEnvironment', { configurable: true, value: 'storeClient' });
    Object.defineProperty(Constants, 'expoGoConfig', { configurable: true, value: {} });

    await expect(syncHabitReminders(sampleHabit)).rejects.toThrow('require a HabitPulse development build');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules one local repeating notification for each configured time', async () => {
    Object.defineProperty(Constants, 'executionEnvironment', { configurable: true, value: 'standalone' });
    Object.defineProperty(Constants, 'expoGoConfig', { configurable: true, value: null });
    await syncHabitReminders(sampleHabit);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, expect.objectContaining({
      content: expect.objectContaining({ title: 'A moment for Drink water', data: { habitId: 'habit-a' } }),
      trigger: expect.objectContaining({ type: 'daily', hour: 8, minute: 15 }),
    }));
  });

  it('cancels previous reminders and skips scheduling for archived habits', async () => {
    Object.defineProperty(Constants, 'executionEnvironment', { configurable: true, value: 'standalone' });
    Object.defineProperty(Constants, 'expoGoConfig', { configurable: true, value: null });
    jest.mocked(Notifications.getAllScheduledNotificationsAsync).mockResolvedValueOnce([
      { identifier: 'old-reminder', content: { data: { habitId: 'habit-a' } } },
    ] as never);

    await syncHabitReminders({ ...sampleHabit, archived: true });

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('old-reminder');
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
