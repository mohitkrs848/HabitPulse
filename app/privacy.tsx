import { View } from 'react-native';
import { Card, List, Text, useTheme } from 'react-native-paper';
import Screen from '../src/components/Screen';

export default function PrivacyScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <Text variant="headlineMedium" style={{ fontWeight: '800' }}>Your data, your device.</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>HabitPulse is designed to work without an account, a connection, or a data trail.</Text>
      <Card mode="contained"><Card.Content style={{ gap: 6 }}>
        <List.Item title="No login required." left={(props) => <List.Icon {...props} icon="account-off-outline" />} />
        <List.Item title="No personal data collected." left={(props) => <List.Icon {...props} icon="shield-lock-outline" />} />
        <List.Item title="No cloud sync." left={(props) => <List.Icon {...props} icon="cloud-off-outline" />} />
        <List.Item title="All data remains on your device." left={(props) => <List.Icon {...props} icon="cellphone-lock" />} />
      </Card.Content></Card>
      <View style={{ gap: 8 }}><Text variant="titleMedium" style={{ fontWeight: '700' }}>What this means</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 23 }}>Habits, notes, reminders, and appearance settings are stored locally. Local notifications are scheduled by Android on your device. Exported backup files leave the app only when you choose a destination in Android&apos;s share sheet.</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>You can remove records in the app or clear app storage from Android settings. There is no account to delete.</Text></View>
    </Screen>
  );
}
