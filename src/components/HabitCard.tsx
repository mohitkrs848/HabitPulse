import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text, useTheme } from 'react-native-paper';
import { getHabitStats, isCompleteOn } from '../domain/habitRules';
import { toDateKey } from '../domain/dates';
import type { Habit } from '../domain/models';
import { useHabitStore } from '../hooks/useHabitStore';

export default function HabitCard({ habit, showActions = true }: { habit: Habit; showActions?: boolean }) {
  const theme = useTheme();
  const { toggleCompletion, toggleFavorite, setArchived, deleteHabit, duplicateHabit } = useHabitStore();
  const today = toDateKey(new Date());
  const complete = isCompleteOn(habit, today);
  const stats = getHabitStats(habit, today);
  const confirmDelete = () => Alert.alert('Delete habit?', `Delete ${habit.name} and its local history?`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { void deleteHabit(habit.id); } },
  ]);
  const frequencyLabel = habit.frequency.type === 'daily'
    ? 'Every day'
    : habit.frequency.type === 'weekly'
      ? `${habit.frequency.target}× this week`
      : habit.frequency.type === 'interval'
        ? `Every ${habit.frequency.everyDays} days`
        : habit.frequency.days.map((day) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]).join(' · ');

  return (
    <Card mode="contained" style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${habit.name}`} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })} style={styles.main}>
        <View style={[styles.iconBox, { backgroundColor: `${habit.color}25` }]}>
          <MaterialCommunityIcons name={habit.icon as never} size={23} color={habit.color} />
        </View>
        <View style={styles.info}>
          <View style={styles.titleLine}>
            <Text variant="titleSmall" numberOfLines={1} style={styles.name}>{habit.name}</Text>
            {habit.favorite && <MaterialCommunityIcons name="star" size={15} color="#C28E25" />}
          </View>
          <Text variant="bodySmall" numberOfLines={1} style={{ color: theme.colors.onSurfaceVariant }}>{habit.category} · {frequencyLabel}</Text>
          <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
            {stats.currentStreak > 0 ? `♨ ${stats.currentStreak} day streak` : 'Start a new streak today'} · {stats.totalCompletions} total
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        {showActions && (
          <>
            <IconButton icon={habit.favorite ? 'star' : 'star-outline'} size={20} accessibilityLabel={habit.favorite ? 'Remove favorite' : 'Add favorite'} onPress={() => toggleFavorite(habit.id)} />
            <IconButton icon="dots-vertical" size={20} accessibilityLabel={`More actions for ${habit.name}`} onPress={() => router.push({ pathname: '/habit/[id]', params: { id: habit.id } })} />
          </>
        )}
        <IconButton disabled={habit.archived} icon={complete ? 'check-circle' : 'checkbox-blank-circle-outline'} iconColor={complete ? theme.colors.primary : theme.colors.outline} onPress={() => toggleCompletion(habit.id)} accessibilityLabel={`${complete ? 'Undo' : 'Complete'} ${habit.name} today`} />
      </View>
      {showActions && <View style={styles.quickActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${habit.name}`} onPress={() => router.push({ pathname: '/habit/edit', params: { id: habit.id } })}><Text variant="labelSmall" style={{ color: theme.colors.primary }}>Edit</Text></Pressable>
        <Text style={{ color: theme.colors.outlineVariant }}>·</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${habit.archived ? 'Restore' : 'Archive'} ${habit.name}`} onPress={() => void setArchived(habit.id, !habit.archived)}><Text variant="labelSmall" style={{ color: theme.colors.primary }}>{habit.archived ? 'Restore' : 'Archive'}</Text></Pressable>
        <Text style={{ color: theme.colors.outlineVariant }}>·</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Duplicate ${habit.name}`} onPress={() => duplicateHabit(habit.id)}><Text variant="labelSmall" style={{ color: theme.colors.primary }}>Duplicate</Text></Pressable>
        <Text style={{ color: theme.colors.outlineVariant }}>·</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${habit.name}`} onPress={confirmDelete}><Text variant="labelSmall" style={{ color: theme.colors.error }}>Delete</Text></Pressable>
      </View>}
    </Card>
  );
}

const styles = StyleSheet.create({ card: { borderRadius: 16, padding: 12, gap: 4 }, main: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }, iconBox: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, info: { flex: 1, minWidth: 0 }, titleLine: { flexDirection: 'row', alignItems: 'center', gap: 5 }, name: { fontWeight: '700', flexShrink: 1 }, actions: { position: 'absolute', right: 5, top: 7, flexDirection: 'row', alignItems: 'center' }, quickActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 10, paddingLeft: 58 } });
