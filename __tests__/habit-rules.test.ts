import { dayDifference, mondayOfWeek, shiftDateKey } from '../src/domain/dates';
import { getHabitStats, isCompleteOn, isDueOn, isMissedOn, isWeeklyTargetMet } from '../src/domain/habitRules';
import { selectHabits } from '../src/domain/habitSelectors';
import type { Habit } from '../src/domain/models';

const habit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'walk',
  name: 'Take a walk',
  description: '',
  category: 'Fitness',
  color: '#63966B',
  icon: 'walk',
  frequency: { type: 'daily' },
  startDate: '2026-06-01',
  archived: false,
  favorite: false,
  completions: [],
  reminderTimes: [],
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:00:00.000Z',
  ...overrides,
});

const completedDays = (first: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({ date: shiftDateKey(first, index) }));

describe('local calendar date rules', () => {
  it('keeps date arithmetic on local calendar keys', () => {
    expect(shiftDateKey('2026-06-01', 1)).toBe('2026-06-02');
    expect(dayDifference('2026-06-01', '2026-06-08')).toBe(7);
    expect(mondayOfWeek('2026-06-07')).toBe('2026-06-01');
  });

  it('computes a daily streak and completion percentage', () => {
    const item = habit({ completions: completedDays('2026-06-01', 5) });
    expect(getHabitStats(item, '2026-06-05')).toEqual({ currentStreak: 5, longestStreak: 5, totalCompletions: 5, completionPercent: 100 });
  });

  it('breaks a streak on a missed scheduled day while preserving the longest streak', () => {
    const item = habit({ completions: [{ date: '2026-06-01' }, { date: '2026-06-02' }, { date: '2026-06-04' }] });
    expect(getHabitStats(item, '2026-06-04')).toMatchObject({ currentStreak: 1, longestStreak: 2, totalCompletions: 3, completionPercent: 75 });
  });

  it('identifies custom weekdays and interval due dates', () => {
    const weekdays = habit({ frequency: { type: 'weekdays', days: [1, 3, 5] } });
    const interval = habit({ frequency: { type: 'interval', everyDays: 2 } });
    expect(isDueOn(weekdays, '2026-06-01')).toBe(true);
    expect(isDueOn(weekdays, '2026-06-02')).toBe(false);
    expect(isDueOn(interval, '2026-06-03')).toBe(true);
    expect(isDueOn(interval, '2026-06-04')).toBe(false);
  });

  it('counts weekly targets as successful weekly streak periods', () => {
    const weekly = habit({
      frequency: { type: 'weekly', target: 3 },
      completions: [{ date: '2026-06-01' }, { date: '2026-06-03' }, { date: '2026-06-05' }, { date: '2026-06-08' }, { date: '2026-06-10' }, { date: '2026-06-12' }],
    });
    expect(isWeeklyTargetMet(weekly, '2026-06-01')).toBe(true);
    expect(getHabitStats(weekly, '2026-06-12')).toMatchObject({ currentStreak: 2, longestStreak: 2, totalCompletions: 6, completionPercent: 100 });
  });

  it('only classifies an unmet weekly target as missed when the week closes', () => {
    const weekly = habit({ frequency: { type: 'weekly', target: 3 } });
    expect(isMissedOn(weekly, '2026-06-05')).toBe(false);
    expect(isMissedOn(weekly, '2026-06-07')).toBe(true);
  });

  it('treats hourly habits as due every day from the start date', () => {
    const hourly = habit({ frequency: { type: 'hourly', everyHours: 2 } });
    expect(isDueOn(hourly, '2026-05-31')).toBe(false);
    expect(isDueOn(hourly, '2026-06-01')).toBe(true);
    expect(isDueOn(hourly, '2026-06-05')).toBe(true);
    const tracked = habit({ frequency: { type: 'hourly', everyHours: 3 }, completions: completedDays('2026-06-01', 2) });
    expect(getHabitStats(tracked, '2026-06-02')).toMatchObject({ currentStreak: 2, completionPercent: 100 });
  });

  it('searches habit names, categories, and descriptions', () => {
    const habits = [
      habit({ id: 'read', name: 'Read', category: 'Learning', description: 'Two pages before screens' }),
      habit({ id: 'walk', name: 'Walk', category: 'Fitness', description: 'Around the block' }),
    ];
    expect(selectHabits(habits, 'active', 'learning', '2026-06-01').map((item) => item.id)).toEqual(['read']);
    expect(selectHabits(habits, 'active', 'pages', '2026-06-01').map((item) => item.id)).toEqual(['read']);
    expect(selectHabits(habits, 'active', 'walk', '2026-06-01').map((item) => item.id)).toEqual(['walk']);
  });

  it('filters habits by query, archive state, due completion and favorites', () => {
    const habits = [
      habit({ id: 'walk', name: 'Take a walk', favorite: true, completions: [{ date: '2026-06-05' }] }),
      habit({ id: 'read', name: 'Read', category: 'Learning' }),
      habit({ id: 'old', name: 'Old run', archived: true }),
    ];
    expect(selectHabits(habits, 'active', 'fit', '2026-06-05').map((item) => item.id)).toEqual(['walk']);
    expect(selectHabits(habits, 'completed', '', '2026-06-05').map((item) => item.id)).toEqual(['walk']);
    expect(selectHabits(habits, 'missed', '', '2026-06-05').map((item) => item.id)).toEqual(['read']);
    expect(selectHabits(habits, 'archived', '', '2026-06-05').map((item) => item.id)).toEqual(['old']);
    expect(selectHabits(habits, 'favorites', '', '2026-06-05').map((item) => item.id)).toEqual(['walk']);
  });

  it('does not treat duplicate same-day completion records as separate days', () => {
    const item = habit({ completions: [{ date: '2026-06-01' }, { date: '2026-06-01' }] });
    expect(isCompleteOn(item, '2026-06-01')).toBe(true);
    expect(getHabitStats(item, '2026-06-01').longestStreak).toBe(1);
  });
});
