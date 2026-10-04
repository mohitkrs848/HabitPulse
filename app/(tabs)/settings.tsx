import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { Button, Card, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { File } from 'expo-file-system';
import Screen from '../../src/components/Screen';
import { exportCsv, exportJson } from '../../src/services/backup';
import { useHabitStore } from '../../src/hooks/useHabitStore';

export default function SettingsScreen() {
  const theme = useTheme();
  const { data, setTheme, addCategory, replaceData, error } = useHabitStore();
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);

  const runExport = async (format: 'json' | 'csv') => {
    setBusy(true);
    try {
      if (format === 'json') await exportJson(data);
      else await exportCsv(data);
    } catch {
      Alert.alert('Could not export', 'The backup could not be shared from this device.');
    } finally {
      setBusy(false);
    }
  };

  const importBackup = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Use the native app', 'Choose a local JSON backup from the Android or iOS app.');
      return;
    }
    try {
      const result = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/json'] });
      if (result.canceled || Array.isArray(result.result)) return;
      const contents = await result.result.text();
      const imported = JSON.parse(contents) as unknown;
      Alert.alert('Replace local data?', 'Importing this backup replaces the current habits and settings.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Replace data', style: 'destructive', onPress: () => { void replaceData(imported).then(() => Alert.alert('Backup restored', 'Your local HabitPulse data has been restored.')).catch((reason: Error) => Alert.alert('Backup not imported', reason.message)); } },
      ]);
    } catch (reason) {
      if (reason instanceof Error && reason.message.toLowerCase().includes('cancel')) return;
      Alert.alert('Could not read backup', 'Choose a valid HabitPulse JSON backup.');
    }
  };

  return (
    <Screen>
      <View style={{ gap: 4 }}><Text variant="headlineMedium" style={{ fontWeight: '800' }}>Settings</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Your preferences stay on this device.</Text></View>
      {error && <Card mode="contained"><Card.Content><Text>{error}</Text></Card.Content></Card>}
      <Card mode="contained"><Card.Content style={{ gap: 14 }}>
        <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Appearance</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Choose a palette or follow Android.</Text></View>
        <SegmentedButtons value={data.settings.theme} onValueChange={(value) => setTheme(value as 'system' | 'light' | 'dark')} buttons={[{ value: 'system', label: 'System', icon: 'theme-light-dark' }, { value: 'light', label: 'Light', icon: 'white-balance-sunny' }, { value: 'dark', label: 'Dark', icon: 'moon-waning-crescent' }]} />
      </Card.Content></Card>
      <Card mode="outlined"><Card.Content style={{ gap: 11 }}>
        <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Your categories</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Add a category to the habit editor.</Text></View>
        <View style={{ flexDirection: 'row', gap: 8 }}><TextInput mode="outlined" label="New category" value={category} onChangeText={setCategory} style={{ flex: 1 }} /><Button mode="contained-tonal" onPress={() => { addCategory(category); setCategory(''); }}>Add</Button></View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{data.settings.customCategories.length ? data.settings.customCategories.join(' · ') : 'Health · Fitness · Learning · Reading · Coding · Meditation · Finance · Productivity'}</Text>
      </Card.Content></Card>
      <Card mode="contained"><Card.Content style={{ gap: 8 }}>
        <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Backup & restore</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Create a local file or restore a previous JSON backup.</Text></View>
        <Button mode="outlined" icon="code-json" loading={busy} onPress={() => void runExport('json')}>Export JSON backup</Button>
        <Button mode="outlined" icon="file-delimited-outline" loading={busy} onPress={() => void runExport('csv')}>Export completions as CSV</Button>
        <Button mode="outlined" icon="backup-restore" onPress={() => void importBackup()}>Import JSON backup</Button>
      </Card.Content></Card>
      <Card mode="outlined"><Card.Content style={{ gap: 8 }}>
        <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Reminders</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Set one or more local reminder times inside each habit.</Text></View>
        <Button mode="text" icon="bell-outline" onPress={() => router.push('/habits')}>Manage habit reminders</Button>
      </Card.Content></Card>
      <Card mode="outlined"><Card.Content style={{ gap: 8 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700' }}>Privacy</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>No login. No ads. No analytics. No cloud dependency.</Text>
        <Button mode="text" icon="shield-lock-outline" onPress={() => router.push('/privacy')}>Read privacy information</Button>
      </Card.Content></Card>
      <Text variant="labelSmall" style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>HABITPULSE · PRIVATE BY DESIGN · VERSION 1.0</Text>
    </Screen>
  );
}
