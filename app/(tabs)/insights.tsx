import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import Screen from '../../src/components/Screen';
import { fromDateKey, shiftDateKey, toDateKey } from '../../src/domain/dates';
import { getHabitStats, isCompleteOn } from '../../src/domain/habitRules';
import { useHabitStore } from '../../src/hooks/useHabitStore';

export default function InsightsScreen() {
  const theme = useTheme();
  const { data } = useHabitStore();
  const today = toDateKey(new Date());
  const active = data.habits.filter((habit) => !habit.archived);
  const week = Array.from({ length: 7 }, (_, index) => shiftDateKey(today, index - 6));
  const month = Array.from({ length: 30 }, (_, index) => shiftDateKey(today, index - 29));
  const daily = week.map((date) => active.filter((habit) => isCompleteOn(habit, date)).length);
  const weeklyPercent = active.length ? Math.round(daily.reduce((sum, count) => sum + count, 0) / (active.length * 7) * 100) : 0;
  const monthlyPercent = active.length ? Math.round(month.reduce((sum, date) => sum + active.filter((habit) => isCompleteOn(habit, date)).length, 0) / (active.length * month.length) * 100) : 0;
  const successAverage = active.length ? Math.round(active.reduce((sum, habit) => sum + getHabitStats(habit, today).completionPercent, 0) / active.length) : 0;
  const total = data.habits.reduce((sum, habit) => sum + habit.completions.length, 0);
  const longest = data.habits.reduce((max, habit) => Math.max(max, getHabitStats(habit, today).longestStreak), 0);
  const points = daily.map((count, index) => `${16 + index * 45},${106 - (active.length ? count / active.length : 0) * 84}`).join(' ');
  const monthCells = Array.from({ length: 35 }, (_, index) => shiftDateKey(today, index - 34));

  const badges = [
    { icon: '🌱', name: 'First habit', caption: 'Create a habit', value: Math.min(active.length + data.habits.filter((h) => h.archived).length, 1), target: 1 },
    { icon: '🔥', name: '7 day streak', caption: 'Keep a streak alive', value: Math.min(longest, 7), target: 7 },
    { icon: '🏅', name: '30 day streak', caption: 'Thirty days of showing up', value: Math.min(longest, 30), target: 30 },
    { icon: '💯', name: '100 completions', caption: 'Complete one hundred habits', value: Math.min(total, 100), target: 100 },
    { icon: '✨', name: 'Consistency champion', caption: 'Reach 80% success on 3 habits', value: Math.min(active.filter((habit) => getHabitStats(habit, today).completionPercent >= 80).length, 3), target: 3 },
  ];

  return (
    <Screen>
      <View style={{ gap: 4 }}><Text variant="headlineMedium" style={{ fontWeight: '800' }}>Your patterns</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>A private look at the days you showed up.</Text></View>
      {!active.length ? (
        <Card mode="outlined"><Card.Content style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}><Text variant="headlineSmall">Your story starts with a habit.</Text><Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>Complete habits to see patterns, streaks, and milestones here.</Text></Card.Content></Card>
      ) : <>
        <View style={styles.metrics}>
          <Metric label="TODAY" value={`${daily[6]}/${active.length}`} themeColor={theme.colors.primary} />
          <Metric label="THIS WEEK" value={`${weeklyPercent}%`} themeColor={theme.colors.secondary} />
          <Metric label="THIS MONTH" value={`${monthlyPercent}%`} themeColor={theme.colors.tertiary} />
        </View>
        <Card mode="contained"><Card.Content style={{ gap: 12 }}>
          <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Daily performance</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Completed habits · last 7 days</Text></View>
          <View style={{ alignItems: 'center' }}><Svg width={330} height={124} viewBox="0 0 300 124"><Polyline points={points} fill="none" stroke={theme.colors.primary} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round"/>{daily.map((count, index) => <Circle key={week[index]} cx={16 + index * 45} cy={106 - (active.length ? count / active.length : 0) * 84} r={4} fill={theme.colors.primary}/>)}</Svg></View>
          <View style={styles.axis}>{week.map((date) => <Text key={date} variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(fromDateKey(date))}</Text>)}</View>
        </Card.Content></Card>
        <Card mode="contained"><Card.Content style={{ gap: 12 }}>
          <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Weekly performance</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>A simple count of completed habits each day</Text></View>
          <View style={{ height: 112, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', gap: 8, paddingTop: 8 }}>
            {daily.map((count, index) => <View key={week[index]} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: 6 }}><Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{count}</Text><View style={{ width: '72%', minHeight: 5, height: `${active.length ? Math.max(5, count / active.length * 78) : 5}%`, borderRadius: 7, backgroundColor: theme.colors.secondary }} /><Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>{new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(fromDateKey(week[index]))}</Text></View>)}
          </View>
        </Card.Content></Card>
        <Card mode="outlined"><Card.Content style={{ gap: 12 }}>
          <View><Text variant="titleMedium" style={{ fontWeight: '700' }}>Month at a glance</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Each tile is a local calendar day</Text></View>
          <View style={styles.heatmap}>{monthCells.map((date) => {
            const done = active.filter((habit) => isCompleteOn(habit, date)).length;
            const intensity = active.length ? done / active.length : 0;
            return <View key={date} accessibilityLabel={`${date}: ${done} habits complete`} style={{ width: 28, height: 28, borderRadius: 7, backgroundColor: intensity ? `${theme.colors.primary}${intensity > 0.66 ? 'EE' : intensity > 0.33 ? '9A' : '48'}` : theme.colors.surfaceVariant }} />;
          })}</View>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Overall habit success: {successAverage}% · {total} total completions</Text>
        </Card.Content></Card>
        <View style={{ gap: 10 }}><Text variant="titleLarge" style={{ fontWeight: '800' }}>Milestones</Text>{badges.map((badge) => {
          const unlocked = badge.value >= badge.target;
          return <Card key={badge.name} mode="contained"><Card.Content style={styles.badge}>
            <Text style={{ fontSize: 27, opacity: unlocked ? 1 : 0.5 }}>{badge.icon}</Text>
            <View style={{ flex: 1, gap: 4 }}><Text variant="titleSmall" style={{ fontWeight: '700' }}>{badge.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{badge.caption}</Text><ProgressBar progress={badge.value / badge.target} color={unlocked ? theme.colors.primary : theme.colors.tertiary} /></View>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>{badge.value}/{badge.target}</Text>
          </Card.Content></Card>;
        })}</View>
        <View style={{ gap: 8 }}><Text variant="titleLarge" style={{ fontWeight: '800' }}>By habit</Text>{active.map((habit) => {
          const stats = getHabitStats(habit, today);
          return <Card key={habit.id} mode="outlined"><Card.Content style={styles.habitStats}><View style={{ flex: 1 }}><Text variant="titleSmall" style={{ fontWeight: '700' }}>{habit.name}</Text><Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{stats.currentStreak} current · {stats.longestStreak} best · {stats.totalCompletions} done</Text></View><Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>{stats.completionPercent}%</Text></Card.Content></Card>;
        })}</View>
      </>}
    </Screen>
  );
}

function Metric({ label, value, themeColor }: { label: string; value: string; themeColor: string }) {
  return <Card mode="contained" style={{ flex: 1 }}><Card.Content style={{ gap: 4 }}><Text variant="labelSmall" style={{ color: themeColor, fontWeight: '800' }}>{label}</Text><Text variant="headlineSmall" style={{ fontWeight: '800' }}>{value}</Text></Card.Content></Card>;
}

const styles = StyleSheet.create({ metrics: { flexDirection: 'row', gap: 8 }, axis: { flexDirection: 'row', justifyContent: 'space-around' }, heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, badge: { flexDirection: 'row', gap: 12, alignItems: 'center' }, habitStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 } });
