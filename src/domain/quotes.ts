export const DAILY_QUOTES: readonly string[] = [
  'Small steps, repeated daily, become big change.',
  'Rest is part of the work.',
  'Showing up counts, even imperfectly.',
  'One good choice sparks the next.',
  'Consistency beats intensity, every time.',
  'Progress hides in ordinary days.',
  'Drink water. Move a little. Repeat.',
  'A habit is a promise you keep.',
  "Today's effort is tomorrow's strength.",
  'Be patient with yourself; growth is quiet.',
  'Health is built in quiet moments.',
  'Start small enough to actually start.',
  'The streak starts with one.',
  'Kindness to yourself is a habit too.',
  'Sleep is a superpower.',
  'Move your body, lighten your mind.',
  'Done today beats perfect someday.',
  'You are one choice away from better.',
  'Momentum loves a starting line.',
  'Notice the win before noon.',
  'Breathe in, breathe out, begin again.',
  'Your future self is cheering you on.',
  'Walk it off; clarity follows.',
  'Every check-in is a vote for the person you want to become.',
];

export const quoteOfDay = (dateKey: string): string => {
  let hash = 0;
  for (let index = 0; index < dateKey.length; index += 1) {
    hash = (hash * 31 + dateKey.charCodeAt(index)) >>> 0;
  }
  return DAILY_QUOTES[hash % DAILY_QUOTES.length];
};