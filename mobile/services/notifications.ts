import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const IDENTIFIER = 'daily-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Reminder',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  await cancelReminder();

  const granted = await requestPermissions();
  if (!granted) throw new Error('Notification permission was denied. Enable it in Settings to use reminders.');

  await Notifications.scheduleNotificationAsync({
    identifier: IDENTIFIER,
    content: {
      title: 'Tracker reminder',
      body: "Don't forget to log your fitness, expenses, and journal today!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDENTIFIER);
}

export async function isReminderScheduled(): Promise<boolean> {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  return all.some((n) => n.identifier === IDENTIFIER);
}
