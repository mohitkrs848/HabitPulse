import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, FAB, Menu, Searchbar, Text, useTheme } from 'react-native-paper';
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
  const [category, setCategory] = useState('All');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const today = toDateKey(new Date());
  const categories = useMemo(() => ['All', ...new Set(data.habits.map((habit) => habit.category))], [data.habits]);
  const visible = useMemo(
    () => selectHabits(data.habits, filter, query, today).filter((habit) => category === 'All' || habit.category === category),
    [data.habits, filter, query, today, category],
  );
  const statusCount = (value: HabitFilter) =>
    selectHabits(data.habits, value, query, today).filter((habit) => category === 'All' || habit.category === category).length;
  const categoryCount = (value: string) =>
    selectHabits(data.habits, filter, query, today).filter((habit) => value === 'All' || habit.category === value).length;
  const empty = query.trim()
    ? { title: 'No matches.', body: `Nothing matches “${query.trim()}”. Search covers habit names, categories, and descriptions — or clear the search.` }
    : category !== 'All'
      ? { title: 'Nothing in this view.', body: `No ${category} habits with the ${filters.find((item) => item.value === filter)?.label.toLowerCase()} filter. Choose All categories to see everything.` }
      : filter === 'archived'
        ? { title: 'No archived habits.', body: 'Archived habits stay safe here — tap Archive on any habit card to move one. Nothing is ever deleted.' }
        : filter === 'favorites'
          ? { title: 'No starred habits yet.', body: 'Tap the star on any habit to keep it near the top of your list.' }
          : filter === 'completed'
            ? { title: 'Nothing done today yet.', body: 'Check a habit off from the Today tab and it appears here.' }
            : filter === 'missed'
              ? { title: 'Nothing missed.', body: 'Habits that are due today but not checked off appear here.' }
              : { title: 'Nothing in this view.', body: 'Create a habit to fill this space.' };

  return (
    <Screen>
      <View style={{ gap: 4 }}>
        <Text variant="headlineMedium" style={{ fontWeight: '800' }}>Habit library</Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Keep your active rituals close.</Text>
      </View>
      <View style={{ gap: 10 }}>
        <Searchbar placeholder="Search habits or categories" value={query} onChangeText={setQuery} accessibilityLabel="Search habits" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          {filters.map((item) => {
            const selected = filter === item.value;
            const count = statusCount(item.value);
            return (
              <Chip
                key={item.value}
                compact
                mode="outlined"
                selected={selected}
                showSelectedCheck={false}
                style={selected ? { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary } : undefined}
                textStyle={selected ? { color: theme.colors.primary, fontWeight: '700', fontSize: 12 } : { fontSize: 12 }}
                onPress={() => setFilter(item.value)}
              >{`${item.label} (${count})`}</Chip>
            );
          })}
        </ScrollView>
        <View style={styles.metaRow}>
          <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{visible.length} {visible.length === 1 ? 'HABIT' : 'HABITS'}</Text>
          {categories.length > 1 && (
            <Menu
              visible={categoryMenuOpen}
              onDismiss={() => setCategoryMenuOpen(false)}
              anchor={<Button compact mode={category === 'All' ? 'outlined' : 'contained-tonal'} icon="tag-multiple-outline" onPress={() => setCategoryMenuOpen(true)}>{category === 'All' ? 'All categories' : category}</Button>}
            >
              {categories.map((item) => (
                <Menu.Item key={item} onPress={() => { setCategory(item); setCategoryMenuOpen(false); }} title={`${item} (${categoryCount(item)})`} leadingIcon={category === item ? 'check' : undefined} />
              ))}
            </Menu>
          )}
        </View>
      </View>
      {visible.length ? visible.map((habit) => <HabitCard habit={habit} key={habit.id} />) : (
        <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
          <Text variant="headlineSmall">{empty.title}</Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>{empty.body}</Text>
        </View>
      )}
      <FAB icon="plus" label="New habit" style={{ alignSelf: 'flex-end' }} onPress={() => router.push('/habit/edit')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pills: { gap: 7, paddingVertical: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
