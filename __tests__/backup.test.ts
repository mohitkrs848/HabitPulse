import { File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportCsv, exportJson } from '../src/services/backup';
import { createEmptyData, type Habit, type HabitPulseData } from '../src/domain/models';

jest.mock('expo-file-system', () => ({
  Paths: { cache: '/cache' },
  File: jest.fn(),
}));

jest.mock('expo-sharing', () => ({ shareAsync: jest.fn().mockResolvedValue(undefined) }));

const habit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'water',
  name: 'Drink water',
  description: '',
  category: 'Health',
  color: '#63966B',
  icon: 'water',
  frequency: { type: 'daily' },
  startDate: '2026-06-01',
  archived: false,
  favorite: false,
  completions: [],
  reminderTimes: [],
  createdAt: '2026-06-01T08:00:00.000Z',
  updatedAt: '2026-06-01T08:00:00.000Z',
  ...overrides,
});

const file = { uri: 'file:///cache/output', create: jest.fn(), write: jest.fn() };

describe('backup exports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(File).mockImplementation(() => file as never);
  });

  it('writes pretty-printed JSON and shares it with the system sheet', async () => {
    const data: HabitPulseData = { ...createEmptyData(), habits: [habit()] };

    await exportJson(data);

    expect(File).toHaveBeenCalledWith('/cache', 'habitpulse-backup.json');
    expect(file.create).toHaveBeenCalledWith({ intermediates: true, overwrite: true });
    expect(file.write).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    expect(Sharing.shareAsync).toHaveBeenCalledWith(file.uri, { mimeType: 'application/json', dialogTitle: 'Export HabitPulse backup' });
  });

  it('builds an escaped CSV of completions with notes', async () => {
    const data: HabitPulseData = {
      ...createEmptyData(),
      habits: [
        habit({ name: 'Say "hello"', completions: [{ date: '2026-06-01' }, { date: '2026-06-02', note: 'Felt, good' }] }),
        habit({ id: 'walk', name: 'Walk', category: 'Fitness', completions: [] }),
      ],
    };

    await exportCsv(data);

    expect(File).toHaveBeenCalledWith('/cache', 'habitpulse-completions.csv');
    expect(file.write).toHaveBeenCalledWith([
      '"Habit","Category","Date","Note"',
      '"Say ""hello""","Health","2026-06-01",""',
      '"Say ""hello""","Health","2026-06-02","Felt, good"',
    ].join('\r\n'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export HabitPulse completions' });
  });

  it('exports an empty library as a header-only CSV', async () => {
    await exportCsv(createEmptyData());

    expect(file.write).toHaveBeenCalledWith('"Habit","Category","Date","Note"');
  });
});