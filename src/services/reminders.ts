import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Habit } from '../domain/models';

const CHANNEL_ID = 'habit-reminders';
let notificationHandlerConfigured = false;

const isAndroidExpoGo = (): boolean => Platform.OS === 'android'
  && Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  && Constants.expoGoConfig !== null;

const getNotifications = async () => {
  // Keep Expo Go from evaluating the native module when the app bundle loads.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const notifications = require('expo-notifications') as typeof import('expo-notifications');
  if (!notificationHandlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }
  return notifications;
};

export const syncHabitReminders = async (habit: Habit): Promise<void> => {
  if (Platform.OS === 'web') return;
  if (isAndroidExpoGo()) {
    if (!habit.archived && habit.reminderTimes.length > 0) {
      throw new Error('Local reminders require a HabitPulse development build on Android. Your habit was saved; build the Android development app to schedule its reminders.');
    }
    return;
  }

  const Notifications = await getNotifications();
  const existing = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(existing
    .filter((notification) => notification.content.data?.habitId === habit.id)
    .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));

  if (habit.archived || habit.reminderTimes.length === 0) return;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 180],
      lightColor: '#63966B',
    });
  }

  const permission = await Notifications.getPermissionsAsync();
  const status = permission.granted ? permission : await Notifications.requestPermissionsAsync();
  if (!status.granted) throw new Error('Notification permission was not granted.');

  await Promise.all(habit.reminderTimes.map((time) => {
    const [hour, minute] = time.split(':').map(Number);
    return Notifications.scheduleNotificationAsync({
      content: {
        title: `A moment for ${habit.name}`,
        body: habit.description || 'Keep your rhythm going, one small step at a time.',
        data: { habitId: habit.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
    });
  }));
};
