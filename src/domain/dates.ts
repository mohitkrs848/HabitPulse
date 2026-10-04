export const toDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

export const shiftDateKey = (key: string, days: number): string => {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

export const dayDifference = (from: string, to: string): number =>
  Math.round((fromDateKey(to).getTime() - fromDateKey(from).getTime()) / 86_400_000);

export const mondayOfWeek = (key: string): string => {
  const date = fromDateKey(key);
  const offset = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - offset);
  return toDateKey(date);
};

export const monthDateKeys = (month: Date): string[] => {
  const cursor = new Date(month.getFullYear(), month.getMonth(), 1, 12);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, index) => {
    cursor.setDate(index + 1);
    return toDateKey(cursor);
  });
};
