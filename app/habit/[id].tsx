import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import { Button, Card, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import Screen from '../../src/components/Screen';
import { shiftDateKey, toDateKey } from '../../src/domain/dates';
import { getHabitStats, isCompleteOn } from '../../src/domain/habitRules';
import { useHabitStore } from '../../src/hooks/useHabitStore';

export default function HabitDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, toggleCompletion, setCompletionNote, toggleFavorite, setArchived, duplicateHabit, deleteHabit } = useHabitStore();
  const habit = useMemo(() => data.habits.find((item) => item.id === id), [data.habits, id]);
  const today = toDateKey(new Date());
  const [note, setNote] = useState<string | null>(null);
  if (!habit) return <Screen><Text variant="headlineSmall">Habit not found</Text><Button onPress={() => router.back()}>Go back</Button></Screen>;
  const stats = getHabitStats(habit, today);
  const completion = habit.completions.find((item) => item.date === today);
  const history = Array.from({ length: 35 }, (_, index) => shiftDateKey(today, -34 + index)).reverse();

  const remove = () => Alert.alert('Delete habit?', `Delete ${habit.name} and its local history?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { void deleteHabit(habit.id); router.back(); } },
  ]);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <IconButton icon={habit.icon as never} mode="contained" containerColor={`${habit.color}28`} iconColor={habit.color} size={30} accessibilityLabel={`${habit.name} icon`} />
        <View style={{ flex: 1 }}><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{habit.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{habit.category} · {habit.frequency.type}</Text></View>
        <IconButton icon={habit.favorite ? 'star' : 'star-outline'} iconColor={habit.favorite ? '#C28E25' : undefined} onPress={() => toggleFavorite(habit.id)} accessibilityLabel="Toggle favorite" />
      </View>
      {habit.description ? <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>{habit.description}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Card mode="contained" style={{ flex: 1 }}><Card.Content><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{stats.currentStreak}</Text><Text variant="labelSmall">CURRENT STREAK</Text></Card.Content></Card>
        <Card mode="contained" style={{ flex: 1 }}><Card.Content><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{stats.longestStreak}</Text><Text variant="labelSmall">BEST STREAK</Text></Card.Content></Card>
        <Card mode="contained" style={{ flex: 1 }}><Card.Content><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{stats.completionPercent}%</Text><Text variant="labelSmall">SUCCESS</Text></Card.Content></Card>
      </View>
      <Card mode="contained"><Card.Content style={{ gap: 10 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700' }}>Today</Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{completion ? 'Completed today. Add a note to remember how it went.' : 'A small step counts. Completion is stored once per local day.'}</Text>
        <TextInput label="Daily note" accessibilityLabel="Daily note" mode="outlined" value={note ?? habit.notesByDate?.[today] ?? completion?.note ?? ''} onChangeText={setNote} multiline placeholder="What did you do?" />
        <Button mode="text" icon="content-save-outline" onPress={() => setCompletionNote(habit.id, today, note ?? habit.notesByDate?.[today] ?? completion?.note ?? '')}>Save note</Button>
        <Button disabled={habit.archived} mode={isCompleteOn(habit, today) ? 'outlined' : 'contained'} icon={isCompleteOn(habit, today) ? 'undo' : 'check'} onPress={() => toggleCompletion(habit.id)}>{isCompleteOn(habit, today) ? 'Undo today' : 'Mark complete'}</Button>
      </Card.Content></Card>
      <Card mode="outlined"><Card.Content style={{ gap: 12 }}>
        <Text variant="titleMedium" style={{ fontWeight: '700' }}>35-day history</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{history.map((date) => <View key={date} accessibilityLabel={`${date}${isCompleteOn(habit, date) ? ' completed' : ''}`} style={{ width: 29, height: 29, borderRadius: 8, backgroundColor: isCompleteOn(habit, date) ? habit.color : theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' }}><Text variant="labelSmall" style={{ fontSize: 8, color: isCompleteOn(habit, date) ? '#fff' : theme.colors.onSurfaceVariant }}>{Number(date.slice(-2))}</Text></View>)}</View>
        {habit.completions.slice(-8).reverse().map((item) => <View key={item.date} style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text variant="bodySmall">{item.date}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{habit.notesByDate?.[item.date] || item.note || 'Completed'}</Text></View>)}
      </Card.Content></Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Button mode="outlined" icon="pencil" onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}>Edit</Button>
        <Button mode="outlined" icon={habit.archived ? 'archive-arrow-up-outline' : 'archive-outline'} onPress={() => { void setArchived(habit.id, !habit.archived); router.back(); }}>{habit.archived ? 'Restore' : 'Archive'}</Button>
        <Button mode="outlined" icon="content-copy" onPress={() => duplicateHabit(habit.id)}>Duplicate</Button>
        <Button mode="outlined" textColor={theme.colors.error} icon="delete-outline" onPress={remove}>Delete</Button>
      </View>
    </Screen>
  );
}
