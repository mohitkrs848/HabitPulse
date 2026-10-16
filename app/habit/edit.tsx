import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, IconButton, SegmentedButtons, Switch, Text, TextInput, useTheme } from 'react-native-paper';
import Screen from '../../src/components/Screen';
import TimeWheelPicker from '../../src/components/TimeWheelPicker';
import { toDateKey } from '../../src/domain/dates';
import { DEFAULT_CATEGORIES, HABIT_COLORS, HABIT_ICONS, type Habit, type HabitFrequency } from '../../src/domain/models';
import { useHabitStore, type HabitDraft } from '../../src/hooks/useHabitStore';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitEditScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, ready } = useHabitStore();
  const existing = data.habits.find((habit) => habit.id === id);
  if (id && !ready) return <Screen><Text>Loading habit…</Text></Screen>;
  if (id && !existing) return <Screen><Text variant="headlineSmall">Habit not found</Text><Button onPress={() => router.back()}>Go back</Button></Screen>;
  return <HabitEditor key={id ?? 'new'} existing={existing} />;
}

function HabitEditor({ existing }: { existing?: Habit }) {
  const theme = useTheme();
  const { data, createHabit, updateHabit } = useHabitStore();
  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'Health');
  const [color, setColor] = useState(existing?.color ?? HABIT_COLORS[0]);
  const [icon, setIcon] = useState(existing?.icon ?? HABIT_ICONS[0]);
  const [frequencyType, setFrequencyType] = useState<HabitFrequency['type']>(existing?.frequency.type ?? 'daily');
  const [target, setTarget] = useState(existing?.frequency.type === 'weekly' ? String(existing.frequency.target) : '3');
  const [interval, setInterval] = useState(existing?.frequency.type === 'interval' ? String(existing.frequency.everyDays) : '2');
  const [everyHours, setEveryHours] = useState(existing?.frequency.type === 'hourly' ? String(existing.frequency.everyHours) : '2');
  const [weekdays, setWeekdays] = useState<number[]>(existing?.frequency.type === 'weekdays' ? existing.frequency.days : [1, 3, 5]);
  const [startDate, setStartDate] = useState(existing?.startDate ?? toDateKey(new Date()));
  const [reminderInput, setReminderInput] = useState('09:00');
  const [reminderTimes, setReminderTimes] = useState<string[]>(existing?.reminderTimes ?? []);
  const [favorite, setFavorite] = useState(existing?.favorite ?? false);

  const categories = [...DEFAULT_CATEGORIES, ...data.settings.customCategories];
  const addReminder = () => {
    setReminderTimes((current) => [...new Set([...current, reminderInput])].sort());
  };

  const makeFrequency = (): HabitFrequency => {
    if (frequencyType === 'weekly') return { type: 'weekly', target: Math.max(1, Math.min(7, Number(target) || 1)) };
    if (frequencyType === 'weekdays') return { type: 'weekdays', days: weekdays.length ? weekdays : [new Date().getDay()] };
    if (frequencyType === 'interval') return { type: 'interval', everyDays: Math.max(2, Math.min(365, Number(interval) || 2)) };
    if (frequencyType === 'hourly') return { type: 'hourly', everyHours: Math.max(1, Math.min(24, Number(everyHours) || 1)) };
    return { type: 'daily' };
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Name your habit', 'A short, specific name makes it easier to return to.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      Alert.alert('Check the start date', 'Use the format YYYY-MM-DD.');
      return;
    }
    const draft: HabitDraft = { name: name.trim(), description: description.trim(), category, color, icon, frequency: makeFrequency(), startDate, archived: existing?.archived ?? false, favorite, reminderTimes };
    if (existing) await updateHabit(existing.id, draft);
    else await createHabit(draft);
    router.back();
  };

  return (
    <Screen>
      <View style={styles.head}><View><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{existing ? 'Shape this habit' : 'Start a habit'}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>Make the next step clear and realistic.</Text></View><IconButton icon="close" onPress={() => router.back()} accessibilityLabel="Close editor" /></View>
      <TextInput label="Habit name" accessibilityLabel="Habit name" value={name} onChangeText={setName} maxLength={64} mode="outlined" placeholder="e.g. Read ten pages" />
      <TextInput label="Description (optional)" accessibilityLabel="Description (optional)" value={description} onChangeText={setDescription} maxLength={180} mode="outlined" multiline numberOfLines={2} />
      <Text variant="titleSmall" style={styles.label}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {categories.map((item) => <Chip key={item} selected={category === item} onPress={() => setCategory(item)}>{item}</Chip>)}
      </ScrollView>
      <Text variant="titleSmall" style={styles.label}>FREQUENCY</Text>
      <SegmentedButtons value={frequencyType} onValueChange={(value) => setFrequencyType(value as typeof frequencyType)} buttons={[{ value: 'daily', label: 'Daily' }, { value: 'hourly', label: 'Hourly' }, { value: 'weekly', label: 'Weekly' }, { value: 'weekdays', label: 'Days' }, { value: 'interval', label: 'Interval' }]} />
      {frequencyType === 'weekly' && <TextInput label="Times per week" accessibilityLabel="Times per week" keyboardType="number-pad" value={target} onChangeText={setTarget} mode="outlined" />}
      {frequencyType === 'interval' && <TextInput label="Repeat every how many days?" accessibilityLabel="Repeat every how many days" keyboardType="number-pad" value={interval} onChangeText={setInterval} mode="outlined" />}
      {frequencyType === 'hourly' && <View style={styles.weekdays}>{['2', '3', '4', '6', '8'].map((value) => <Chip key={value} selected={everyHours === value} showSelectedCheck={false} onPress={() => setEveryHours(value)}>Every {value}h</Chip>)}</View>}
      {frequencyType === 'hourly' && <TextInput label="Or repeat every how many hours?" accessibilityLabel="Repeat every how many hours" keyboardType="number-pad" value={everyHours} onChangeText={setEveryHours} mode="outlined" />}
      {frequencyType === 'weekdays' && <View style={styles.weekdays}>{WEEKDAYS.map((day, index) => <Chip key={day} selected={weekdays.includes(index)} onPress={() => setWeekdays((current) => current.includes(index) ? current.filter((value) => value !== index) : [...current, index])}>{day}</Chip>)}</View>}
      <TextInput label="Start date" accessibilityLabel="Start date" value={startDate} onChangeText={setStartDate} mode="outlined" autoCapitalize="none" />
      <Text variant="titleSmall" style={styles.label}>COLOR</Text>
      <View style={styles.colors}>{HABIT_COLORS.map((item) => <IconButton key={item} icon={color === item ? 'check' : 'circle'} iconColor={item} containerColor={`${item}20`} size={22} onPress={() => setColor(item)} accessibilityLabel={`Choose color ${item}`} />)}</View>
      <Text variant="titleSmall" style={styles.label}>ICON</Text>
      <View style={styles.icons}>{HABIT_ICONS.map((item) => <Chip key={item} selected={icon === item} icon={item} onPress={() => setIcon(item)}>{item.replaceAll('-', ' ')}</Chip>)}</View>
      <View style={styles.favorite}><View><Text variant="titleSmall">Favorite habit</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Keep it near the top of your list.</Text></View><Switch value={favorite} onValueChange={setFavorite} accessibilityLabel="Favorite habit" /></View>
      <Text variant="titleSmall" style={styles.label}>LOCAL REMINDERS</Text>
      <View style={styles.reminderAdd}><TimeWheelPicker value={reminderInput} onChange={setReminderInput} /><Button mode="outlined" onPress={addReminder}>Add {reminderInput}</Button></View>
      <View style={styles.reminders}>{reminderTimes.map((time) => <Chip key={time} onClose={() => setReminderTimes((current) => current.filter((value) => value !== time))} icon="bell-outline">{time}</Chip>)}</View>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Reminders are scheduled on this device. Android may ask permission the first time.</Text>
      <Button mode="contained" icon="check" accessibilityLabel={existing ? 'Save habit changes' : 'Create habit'} onPress={() => void save()} style={{ marginTop: 4 }}>{existing ? 'Save changes' : 'Create habit'}</Button>
    </Screen>
  );
}

const styles = StyleSheet.create({ head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, label: { fontWeight: '800', letterSpacing: 0.6, marginTop: 2 }, weekdays: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 }, icons: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, favorite: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }, reminderAdd: { flexDirection: 'row', alignItems: 'center', gap: 9 }, reminders: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 } });
