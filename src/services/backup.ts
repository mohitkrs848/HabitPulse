import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { HabitPulseData } from '../domain/models';

const csvCell = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export const exportJson = async (data: HabitPulseData): Promise<void> => {
  const file = new File(Paths.cache, 'habitpulse-backup.json');
  file.create({ intermediates: true, overwrite: true });
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export HabitPulse backup' });
};

export const exportCsv = async (data: HabitPulseData): Promise<void> => {
  const rows = [
    ['Habit', 'Category', 'Date', 'Note'],
    ...data.habits.flatMap((habit) => habit.completions.map((completion) => [habit.name, habit.category, completion.date, completion.note ?? ''])),
  ];
  const contents = rows.map((row) => row.map((cell) => csvCell(String(cell))).join(',')).join('\r\n');
  const file = new File(Paths.cache, 'habitpulse-completions.csv');
  file.create({ intermediates: true, overwrite: true });
  file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export HabitPulse completions' });
};
