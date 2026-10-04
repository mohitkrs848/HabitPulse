import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Chip, FAB, Searchbar, Text, useTheme } from 'react-native-paper';
import HabitCard from '../../src/components/HabitCard';
import Screen from '../../src/components/Screen';
import { toDateKey } from '../../src/domain/dates';
import { selectHabits } from '../../src/domain/habitSelectors';
import type { HabitFilter } from '../../src/domain/models';
import { useHabitStore } from '../../src/hooks/useHabitStore';

const filters: { value: HabitFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'favorites', label: 'Starred' },
  { value: 'completed', label: 'Done today' },
  { value: 'missed', label: 'Missed' },
  { value: 'archived', label: 'Archived' },
];

export default function HabitsScreen() {
  const theme = useTheme();
  const { data } = useHabitStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<HabitFilter>('active');
  const today = toDateKey(new Date());
  const visible = useMemo(() => selectHabits(data.habits, filter, query, today), [data.habits, filter, query, today]);

  return (
    <Screen>
      <View style={{ gap: 4 }}><Text variant="headlineMedium" style={{ fontWeight: '800' }}>Habit library</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Keep your active rituals close.</Text></View>
      <Searchbar placeholder="Search habits or categories" value={query} onChangeText={setQuery} accessibilityLabel="Search habits" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
        {filters.map((item) => <Chip key={item.value} selected={filter === item.value} onPress={() => setFilter(item.value)}>{item.label}</Chip>)}
      </ScrollView>
      <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{visible.length} HABITS</Text>
      {visible.length ? visible.map((habit) => <HabitCard habit={habit} key={habit.id} />) : (
        <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
          <Text variant="headlineSmall">Nothing in this view.</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>Try another filter or create a habit for this part of your day.</Text>
        </View>
      )}
      <FAB icon="plus" label="New habit" style={{ alignSelf: 'flex-end' }} onPress={() => router.push('/habit/edit')} />
    </Screen>
  );
}
