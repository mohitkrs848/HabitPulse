import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import { toDateKey } from '../../src/domain/dates';
import { getHabitStats, isCompleteOn } from '../../src/domain/habitRules';
import HabitCard from '../../src/components/HabitCard';
import ProgressRing from '../../src/components/ProgressRing';
import Screen from '../../src/components/Screen';
import { quoteOfDay } from '../../src/domain/quotes';
import { useHabitStore } from '../../src/hooks/useHabitStore';

const messages = ['Small steps become a life you love.', 'A little consistency goes a long way.', 'Make today count, one ritual at a time.', 'You showed up. That matters.'];

export default function TodayScreen() {
  const theme = useTheme();
  const { data, ready, error } = useHabitStore();
  const today = toDateKey(new Date());
  const habits = useMemo(() => data.habits.filter((habit) => !habit.archived).sort((a, b) => Number(b.favorite) - Number(a.favorite)), [data.habits]);
  const completed = habits.filter((habit) => isCompleteOn(habit, today)).length;
  const progress = habits.length ? Math.round((completed / habits.length) * 100) : 0;
  const streak = habits.reduce((max, habit) => Math.max(max, getHabitStats(habit, today).currentStreak), 0);
  const dayIndex = Number(today.slice(-2)) % messages.length;
  const dateText = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text variant="labelMedium" style={{ color: theme.colors.primary, fontWeight: '800', letterSpacing: 1 }}>{dateText.toUpperCase()}</Text>
          <Text variant="headlineMedium" style={styles.heading}>{quoteOfDay(today)}</Text>
        </View>
        <IconButton icon="cog-outline" size={23} accessibilityLabel="Open settings" onPress={() => router.push('/settings')} />
      </View>

      {error && <Card mode="contained"><Card.Content><Text>{error}</Text></Card.Content></Card>}

      <Card mode="contained" style={[styles.hero, { backgroundColor: theme.colors.primaryContainer }]}>
        <Card.Content style={styles.heroContent}>
          <View style={styles.heroCopy}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>YOUR DAILY RHYTHM</Text>
            <Text variant="headlineSmall" style={[styles.heroNumber, { color: theme.colors.onPrimaryContainer }]}>{completed}<Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}> / {habits.length}</Text></Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>{progress === 100 && habits.length ? 'Every promise kept. Lovely.' : messages[dayIndex]}</Text>
          </View>
          <ProgressRing progress={progress} completed={completed} total={habits.length} />
        </Card.Content>
        <View style={styles.heroFooter}>
          <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>✦  Best current streak</Text>
          <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '800' }}>{streak} {streak === 1 ? 'day' : 'days'}</Text>
        </View>
      </Card>

      <View style={styles.sectionHeader}>
        <View><Text variant="titleLarge" style={styles.sectionTitle}>Your habits</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{ready ? `${habits.length} active ${habits.length === 1 ? 'habit' : 'habits'}` : 'Loading your library…'}</Text></View>
        <Button compact onPress={() => router.push('/habits')}>See all</Button>
      </View>

      {habits.length ? habits.slice(0, 4).map((habit) => <HabitCard habit={habit} key={habit.id} showActions={false} />) : (
        <Card mode="outlined" style={styles.empty}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="headlineSmall">A clear little beginning.</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>Create one habit you can return to tomorrow. Your data stays on this device.</Text>
            <Button mode="contained" icon="plus" accessibilityLabel="Create a habit" onPress={() => router.push('/habit/edit')}>Create a habit</Button>
          </Card.Content>
        </Card>
      )}

      {habits.length ? <Button mode="outlined" icon="plus" accessibilityLabel="Add habit" onPress={() => router.push('/habit/edit')}>Add habit</Button> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({ header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heading: { fontWeight: '800', marginTop: 4 }, hero: { borderRadius: 22 }, heroContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroCopy: { flex: 1, gap: 7 }, heroNumber: { fontWeight: '800', fontSize: 36 }, heroFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(20,50,25,0.18)', marginHorizontal: 16, paddingTop: 12, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 }, sectionTitle: { fontWeight: '800' }, empty: { borderRadius: 20 }, emptyContent: { alignItems: 'center', gap: 14, paddingVertical: 26 } });
