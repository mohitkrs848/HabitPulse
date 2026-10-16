import type { Habit, HabitFilter } from './models';
import { isCompleteOn, isMissedOn } from './habitRules';

export const selectHabits = (
  habits: Habit[],
  filter: HabitFilter,
  query = '',
  today: string,
): Habit[] => habits
  .filter((habit) => {
    const matchesQuery = `${habit.name} ${habit.category} ${habit.description}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === 'archived'
      ? habit.archived
      : filter === 'favorites'
        ? !habit.archived && habit.favorite
        : filter === 'completed'
          ? !habit.archived && isCompleteOn(habit, today)
          : filter === 'missed'
            ? !habit.archived && isMissedOn(habit, today)
            : !habit.archived;
    return matchesQuery && matchesFilter;
  })
  .sort((first, second) => Number(second.favorite) - Number(first.favorite));
