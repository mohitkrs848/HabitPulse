import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  completions: string[];
};

type SavedData = {
  habits: Habit[];
  darkMode: boolean;
};

const STORAGE_KEY = 'habitpulse.v1';
const ICON_OPTIONS = ['💧', '📚', '🧘', '🚶', '🥗', '✍️', '🌱', '💤'];
const COLOR_OPTIONS = ['#B8E66A', '#F1A778', '#83C9BD', '#B3A4E8', '#F1C96A'];

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateOffset = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return localDateKey(date);
};

const starterHabits: Habit[] = [
  {
    id: 'water',
    name: 'Drink a glass of water',
    icon: '💧',
    color: COLOR_OPTIONS[0],
    completions: [-5, -4, -3, -2, -1, 0].map(dateOffset),
  },
  {
    id: 'reading',
    name: 'Read for 10 minutes',
    icon: '📚',
    color: COLOR_OPTIONS[1],
    completions: [-2, -1, 0].map(dateOffset),
  },
  {
    id: 'stretch',
    name: 'Morning stretch',
    icon: '🧘',
    color: COLOR_OPTIONS[2],
    completions: [-1].map(dateOffset),
  },
  {
    id: 'walk',
    name: 'Take a 20 minute walk',
    icon: '🚶',
    color: COLOR_OPTIONS[3],
    completions: [-3, -2, -1].map(dateOffset),
  },
];

const getStreak = (habit: Habit, today: string) => {
  const completed = new Set(habit.completions);
  let cursor = completed.has(today) ? 0 : -1;
  let streak = 0;

  while (completed.has(dateOffset(cursor))) {
    streak += 1;
    cursor -= 1;
  }

  return streak;
};

export default function App() {
  const [habits, setHabits] = useState<Habit[]>(starterHabits);
  const [darkMode, setDarkMode] = useState(false);
  const [ready, setReady] = useState(false);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitIcon, setNewHabitIcon] = useState(ICON_OPTIONS[0]);
  const [newHabitColor, setNewHabitColor] = useState(COLOR_OPTIONS[0]);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored) as SavedData;
          if (Array.isArray(data.habits)) setHabits(data.habits);
          if (typeof data.darkMode === 'boolean') setDarkMode(data.darkMode);
        }
      } catch {
        Alert.alert('Could not load saved habits', 'Your habits are still available for this session.');
      } finally {
        setReady(true);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!ready) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, darkMode } satisfies SavedData));
  }, [darkMode, habits, ready]);

  const today = localDateKey(new Date());
  const completedCount = habits.filter((habit) => habit.completions.includes(today)).length;
  const currentStreak = habits.reduce((longest, habit) => Math.max(longest, getStreak(habit, today)), 0);
  const allDone = habits.length > 0 && completedCount === habits.length;
  const palette = darkMode
    ? {
        background: '#111914',
        surface: '#1B251F',
        surfaceRaised: '#243129',
        text: '#F4F5EF',
        muted: '#A4AEA5',
        line: '#303B33',
        panel: '#253B30',
        accent: '#B8E66A',
        accentText: '#172217',
      }
    : {
        background: '#F4F5EF',
        surface: '#FFFFFF',
        surfaceRaised: '#E9EDE4',
        text: '#1B2921',
        muted: '#78847A',
        line: '#E3E7DE',
        panel: '#243B30',
        accent: '#B8E66A',
        accentText: '#172217',
      };

  const toggleHabit = (habitId: string) => {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== habitId) return habit;
        const isComplete = habit.completions.includes(today);
        return {
          ...habit,
          completions: isComplete
            ? habit.completions.filter((date) => date !== today)
            : [...habit.completions, today],
        };
      }),
    );
  };

  const openAddHabit = () => {
    setEditingHabitId(null);
    setNewHabitName('');
    setNewHabitIcon(ICON_OPTIONS[0]);
    setNewHabitColor(COLOR_OPTIONS[0]);
    setShowAddHabit(true);
  };

  const openEditHabit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setNewHabitName(habit.name);
    setNewHabitIcon(habit.icon);
    setNewHabitColor(habit.color);
    setShowAddHabit(true);
  };

  const saveHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;

    if (editingHabitId) {
      setHabits((current) =>
        current.map((habit) =>
          habit.id === editingHabitId
            ? { ...habit, name, icon: newHabitIcon, color: newHabitColor }
            : habit,
        ),
      );
    } else {
      setHabits((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name,
          icon: newHabitIcon,
          color: newHabitColor,
          completions: [],
        },
      ]);
    }

    setEditingHabitId(null);
    setNewHabitName('');
    setNewHabitIcon(ICON_OPTIONS[0]);
    setNewHabitColor(COLOR_OPTIONS[0]);
    setShowAddHabit(false);
  };

  const confirmDeleteHabit = (habit: Habit) => {
    Alert.alert('Delete habit?', `Remove "${habit.name}" and its streak history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setHabits((current) => current.filter((item) => item.id !== habit.id)),
      },
    ]);
  };

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date()).toUpperCase();

  return (
    <SafeAreaProvider>
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={styles.page}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: palette.accent }]}>
                <Text style={styles.brandMarkText}>H</Text>
              </View>
              <Text style={[styles.brandName, { color: palette.text }]}>habitpulse</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onPress={() => setDarkMode((value) => !value)}
                style={[styles.themeButton, { backgroundColor: palette.surfaceRaised }]}
              >
                <Text style={[styles.themeGlyph, { color: palette.text }]}>{darkMode ? '☼' : '☾'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add a habit"
                onPress={openAddHabit}
                style={[styles.addButton, { backgroundColor: palette.accent }]}
              >
                <Text style={styles.addButtonText}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={[styles.dateLabel, { color: palette.muted }]}>{dateLabel}</Text>
            <Text style={[styles.title, { color: palette.text }]}>Small steps,{ '\n' }big momentum.</Text>
            <Text style={[styles.subtitle, { color: palette.muted }]}>Show up for the life you want.</Text>
          </View>

          <View style={[styles.progressPanel, { backgroundColor: palette.panel }]}>
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.panelEyebrow}>TODAY&apos;S RHYTHM</Text>
                <Text style={styles.progressCount}>
                  {completedCount}<Text style={styles.progressTotal}> / {habits.length}</Text>
                </Text>
                <Text style={styles.panelCaption}>
                  {allDone ? 'Every promise kept. Beautiful work.' : 'habits checked in today'}
                </Text>
              </View>
              <View style={styles.streakBadge}>
                <Text style={styles.streakIcon}>✦</Text>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>DAY STREAK</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${habits.length ? (completedCount / habits.length) * 100 : 0}%` },
                ]}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: palette.text }]}>Your rituals</Text>
              <Text style={[styles.sectionMeta, { color: palette.muted }]}>
                {habits.length === 0 ? 'A fresh page starts here' : `${habits.length} daily ${habits.length === 1 ? 'habit' : 'habits'}`}
              </Text>
            </View>
            <Text style={[styles.sectionMeta, { color: palette.muted }]}>{completedCount} DONE</Text>
          </View>

          {habits.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: palette.surface, borderColor: palette.line }]}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={[styles.emptyTitle, { color: palette.text }]}>Make room for a good habit.</Text>
              <Text style={[styles.emptyText, { color: palette.muted }]}>Start with one small thing you can do today.</Text>
              <Pressable onPress={openAddHabit} style={[styles.emptyAction, { backgroundColor: palette.accent }]}>
                <Text style={styles.emptyActionText}>Create your first habit</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.habitList}>
              {habits.map((habit) => {
                const isComplete = habit.completions.includes(today);
                const streak = getStreak(habit, today);
                return (
                  <View
                    key={habit.id}
                    style={[
                      styles.habitRow,
                      { backgroundColor: palette.surface, borderColor: palette.line },
                      isComplete && styles.habitRowComplete,
                    ]}
                  >
                    <View style={[styles.habitIcon, { backgroundColor: `${habit.color}33` }]}>
                      <Text style={styles.habitEmoji}>{habit.icon}</Text>
                    </View>
                    <View style={styles.habitInfo}>
                      <Text numberOfLines={1} style={[styles.habitName, { color: palette.text }]}>{habit.name}</Text>
                      <Text style={[styles.habitStreak, { color: palette.muted }]}>
                        {streak > 0 ? `✦  ${streak} day${streak === 1 ? '' : 's'} in a row` : 'Your next streak starts today'}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${habit.name}`}
                      onPress={() => openEditHabit(habit)}
                      style={styles.rowActionButton}
                    >
                      <Text style={[styles.rowActionGlyph, { color: palette.muted }]}>✎</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${habit.name}`}
                      onPress={() => confirmDeleteHabit(habit)}
                      style={styles.rowActionButton}
                    >
                      <Text style={[styles.rowActionGlyph, { color: palette.muted }]}>×</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isComplete }}
                      accessibilityLabel={`${isComplete ? 'Mark incomplete' : 'Complete'} ${habit.name}`}
                      onPress={() => toggleHabit(habit.id)}
                      style={[
                        styles.checkButton,
                        { borderColor: isComplete ? palette.accent : palette.line },
                        isComplete && { backgroundColor: palette.accent },
                      ]}
                    >
                      <Text style={[styles.checkmark, { color: palette.accentText }]}>{isComplete ? '✓' : ''}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footerNote}>
            <Text style={[styles.footerGlyph, { color: palette.accentText, backgroundColor: palette.accent }]}>↗</Text>
            <Text style={[styles.footerText, { color: palette.muted }]}>Consistency is built one day at a time.</Text>
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={showAddHabit}
        onRequestClose={() => setShowAddHabit(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAddHabit(false)} />
          <View style={[styles.sheet, { backgroundColor: palette.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: palette.text }]}>{editingHabitId ? 'Edit your ritual' : 'A new ritual'}</Text>
                <Text style={[styles.sheetSubtitle, { color: palette.muted }]}>
                  {editingHabitId ? 'Keep the details that make it yours.' : 'Make it small enough to begin.'}
                </Text>
              </View>
              <Pressable onPress={() => setShowAddHabit(false)} style={[styles.closeButton, { backgroundColor: palette.surfaceRaised }]}>
                <Text style={[styles.closeGlyph, { color: palette.text }]}>×</Text>
              </Pressable>
            </View>
            <Text style={[styles.inputLabel, { color: palette.text }]}>HABIT NAME</Text>
            <TextInput
              autoFocus
              maxLength={48}
              onChangeText={setNewHabitName}
              onSubmitEditing={saveHabit}
              placeholder="e.g. Take a short walk"
              placeholderTextColor={palette.muted}
              returnKeyType="done"
              style={[styles.nameInput, { color: palette.text, backgroundColor: palette.surfaceRaised }]}
              value={newHabitName}
            />
            <Text style={[styles.inputLabel, { color: palette.text }]}>PICK A SYMBOL</Text>
            <View style={styles.optionRow}>
              {ICON_OPTIONS.map((icon) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${icon} symbol`}
                  key={icon}
                  onPress={() => setNewHabitIcon(icon)}
                  style={[
                    styles.iconOption,
                    { backgroundColor: palette.surfaceRaised },
                    newHabitIcon === icon && { backgroundColor: palette.accent },
                  ]}
                >
                  <Text style={styles.optionEmoji}>{icon}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.inputLabel, { color: palette.text }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((color) => (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: newHabitColor === color }}
                  accessibilityLabel={`Choose color ${color}`}
                  key={color}
                  onPress={() => setNewHabitColor(color)}
                  style={[styles.colorOption, { backgroundColor: color }, newHabitColor === color && styles.colorOptionSelected]}
                />
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={!newHabitName.trim()}
              onPress={saveHabit}
              style={[styles.createButton, { backgroundColor: palette.accent }, !newHabitName.trim() && styles.createButtonDisabled]}
            >
              <Text style={styles.createButtonText}>{editingHabitId ? 'Save changes' : 'Add habit'}</Text>
              <Text style={styles.createButtonArrow}>→</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  page: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center' },
  content: { paddingHorizontal: 22, paddingTop: 12, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#172217', fontSize: 19, fontWeight: '900' },
  brandName: { fontSize: 18, fontWeight: '800', letterSpacing: 0 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  themeButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  themeGlyph: { fontSize: 20 },
  addButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  addButtonText: { color: '#172217', fontSize: 28, fontWeight: '400', lineHeight: 31 },
  intro: { marginTop: 38, marginBottom: 23 },
  dateLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  title: { marginTop: 10, fontSize: 36, lineHeight: 40, fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) },
  subtitle: { marginTop: 9, fontSize: 14 },
  progressPanel: { padding: 20, borderRadius: 16 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  panelEyebrow: { color: '#CBD8CB', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  progressCount: { color: '#F4F5EF', fontSize: 34, fontWeight: '700', marginTop: 7, lineHeight: 38 },
  progressTotal: { color: '#B9C5B9', fontSize: 20, fontWeight: '500' },
  panelCaption: { color: '#C8D2C8', fontSize: 12, marginTop: 2 },
  streakBadge: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, borderColor: '#64776A', alignItems: 'center', justifyContent: 'center' },
  streakIcon: { color: '#B8E66A', fontSize: 14 },
  streakNumber: { color: '#F4F5EF', fontSize: 23, fontWeight: '700', lineHeight: 26 },
  streakLabel: { color: '#C8D2C8', fontSize: 7, fontWeight: '800', letterSpacing: 0.4, marginTop: 2 },
  progressTrack: { height: 5, borderRadius: 5, backgroundColor: '#53675A', marginTop: 19, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#B8E66A' },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 28, marginBottom: 13 },
  sectionTitle: { fontSize: 21, fontWeight: '700' },
  sectionMeta: { fontSize: 10, fontWeight: '700', marginTop: 4, letterSpacing: 0.35 },
  habitList: { gap: 9 },
  habitRow: { minHeight: 76, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  habitRowComplete: { opacity: 0.92 },
  habitIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  habitEmoji: { fontSize: 22 },
  habitInfo: { flex: 1, minWidth: 0 },
  habitName: { fontSize: 14, fontWeight: '700' },
  habitStreak: { fontSize: 11, marginTop: 5 },
  checkButton: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkmark: { fontSize: 16, fontWeight: '800', lineHeight: 19 },
  rowActionButton: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowActionGlyph: { fontSize: 19, fontWeight: '600' },
  emptyState: { borderRadius: 12, borderWidth: 1, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28 },
  emptyIcon: { fontSize: 28 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  emptyText: { fontSize: 13, lineHeight: 19, marginTop: 6, textAlign: 'center' },
  emptyAction: { borderRadius: 8, paddingHorizontal: 16, paddingVertical: 11, marginTop: 17 },
  emptyActionText: { color: '#172217', fontSize: 13, fontWeight: '700' },
  footerNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 23 },
  footerGlyph: { width: 19, height: 19, borderRadius: 10, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', fontSize: 12, fontWeight: '800' },
  footerText: { fontSize: 11 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 15, 11, 0.48)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 22, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 32 : 24 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#AAB3AA', alignSelf: 'center', marginBottom: 19 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 21 },
  sheetTitle: { fontSize: 23, fontWeight: '700' },
  sheetSubtitle: { fontSize: 12, marginTop: 4 },
  closeButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeGlyph: { fontSize: 23, lineHeight: 27 },
  inputLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.65, marginBottom: 8 },
  nameInput: { height: 48, borderRadius: 9, paddingHorizontal: 13, fontSize: 14, marginBottom: 19 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 19, gap: 6 },
  iconOption: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 19 },
  colorRow: { flexDirection: 'row', gap: 14, marginBottom: 23 },
  colorOption: { width: 27, height: 27, borderRadius: 14, borderWidth: 2, borderColor: 'transparent' },
  colorOptionSelected: { borderColor: '#253B30', transform: [{ scale: 1.1 }] },
  createButton: { height: 50, borderRadius: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createButtonDisabled: { opacity: 0.48 },
  createButtonText: { color: '#172217', fontWeight: '800', fontSize: 14 },
  createButtonArrow: { color: '#172217', fontSize: 17 },
});
