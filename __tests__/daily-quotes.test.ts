import { DAILY_QUOTES, quoteOfDay } from '../src/domain/quotes';

describe('daily quotes', () => {
  it('returns the same quote for the same day and always a known quote', () => {
    expect(quoteOfDay('2026-10-11')).toBe(quoteOfDay('2026-10-11'));
    expect(DAILY_QUOTES).toContain(quoteOfDay('2026-10-11'));
  });

  it('varies the pick across consecutive days', () => {
    const picks = new Set(Array.from({ length: 30 }, (_, index) => quoteOfDay(`2026-09-${String(index + 1).padStart(2, '0')}`)));
    expect(picks.size).toBeGreaterThan(1);
    expect([...picks].every((quote) => DAILY_QUOTES.includes(quote))).toBe(true);
  });

  it('keeps every quote non-empty and short enough for the page headline', () => {
    expect(DAILY_QUOTES.length).toBeGreaterThan(0);
    expect(DAILY_QUOTES.every((quote) => quote.trim().length > 0 && quote.length <= 70)).toBe(true);
    expect(new Set(DAILY_QUOTES).size).toBe(DAILY_QUOTES.length);
  });
});