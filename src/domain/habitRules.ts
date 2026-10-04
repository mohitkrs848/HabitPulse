import type { Habit, HabitCompletion, HabitStats } from './models';
import { dayDifference, fromDateKey, mondayOfWeek, shiftDateKey, toDateKey } from './dates';

export const getCompletion = (habit: Habit, date: string): HabitCompletion | undefined =>
  habit.completions.find((completion) => completion.date === date);

export const isDueOn = (habit: Habit, date: string): boolean => {
  if (date < habit.startDate) return false;
  const weekday = fromDateKey(date).getDay();

  switch (habit.frequency.type) {
    case 'daily':
    case 'weekly':
      return true;
    case 'weekdays':
      return habit.frequency.days.includes(weekday);
    case 'interval':
      return dayDifference(habit.startDate, date) % Math.max(1, habit.frequency.everyDays) === 0;
  }
};

export const isCompleteOn = (habit: Habit, date: string): boolean => Boolean(getCompletion(habit, date));

export const isMissedOn = (habit: Habit, date: string): boolean => {
  if (habit.frequency.type === 'weekly') {
    return fromDateKey(date).getDay() === 0 && !isWeeklyTargetMet(habit, mondayOfWeek(date));
  }
  return isDueOn(habit, date) && !isCompleteOn(habit, date);
};

export const isWeeklyTargetMet = (habit: Habit, weekStart: string): boolean => {
  if (habit.frequency.type !== 'weekly') return false;
  const count = habit.completions.filter((entry) => {
    const monday = mondayOfWeek(entry.date);
    return monday === weekStart;
  }).length;
  return count >= habit.frequency.target;
};

const getEligibleDates = (habit: Habit, today: string): string[] => {
  const dates: string[] = [];
  for (let date = habit.startDate; date <= today; date = shiftDateKey(date, 1)) {
    if (isDueOn(habit, date)) dates.push(date);
  }
  return dates;
};

export const getHabitStats = (habit: Habit, today = toDateKey(new Date())): HabitStats => {
  const totalCompletions = habit.completions.length;
  const eligibleDates = getEligibleDates(habit, today);
  const completedDates = new Set(habit.completions.map((entry) => entry.date));
  let currentStreak = 0;
  let longestStreak = 0;

  if (habit.frequency.type === 'weekly') {
    const weeklyFrequency = habit.frequency;
    const firstWeek = mondayOfWeek(habit.startDate);
    let thisWeek = mondayOfWeek(today);
    const completedWeeks: boolean[] = [];
    for (let week = firstWeek; week <= thisWeek; week = shiftDateKey(week, 7)) {
      completedWeeks.push(isWeeklyTargetMet(habit, week));
    }
    longestStreak = completedWeeks.reduce((run, succeeded) => {
      const next = succeeded ? run + 1 : 0;
      longestStreak = Math.max(longestStreak, next);
      return next;
    }, 0);
    if (!isWeeklyTargetMet(habit, thisWeek)) thisWeek = shiftDateKey(thisWeek, -7);
    for (let week = thisWeek; week >= firstWeek; week = shiftDateKey(week, -7)) {
      if (!isWeeklyTargetMet(habit, week)) break;
      currentStreak += 1;
    }
    const weeksElapsed = Math.max(1, Math.floor(dayDifference(firstWeek, mondayOfWeek(today)) / 7) + 1);
    const expected = Math.min(totalCompletions, weeksElapsed * weeklyFrequency.target);
    return {
      currentStreak,
      longestStreak,
      totalCompletions,
      completionPercent: Math.min(100, Math.round((expected / (weeksElapsed * weeklyFrequency.target)) * 100)),
    };
  }

  let run = 0;
  for (const date of eligibleDates) {
    if (completedDates.has(date)) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }

  let cursor = today;
  if (!completedDates.has(cursor)) cursor = shiftDateKey(cursor, -1);
  while (cursor >= habit.startDate) {
    if (isDueOn(habit, cursor)) {
      if (!completedDates.has(cursor)) break;
      currentStreak += 1;
    }
    cursor = shiftDateKey(cursor, -1);
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions,
    completionPercent: eligibleDates.length
      ? Math.min(100, Math.round((eligibleDates.filter((date) => completedDates.has(date)).length / eligibleDates.length) * 100))
      : 0,
  };
};

export const getWeekDates = (today = toDateKey(new Date())): string[] => {
  const monday = mondayOfWeek(today);
  return Array.from({ length: 7 }, (_, index) => shiftDateKey(monday, index));
};
