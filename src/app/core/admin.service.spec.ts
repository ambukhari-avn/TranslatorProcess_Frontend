import { dayBound } from './admin.service';

describe('dayBound', () => {
  it('turns a picked date into the start of that day, or its end for an upper bound', () => {
    expect(dayBound('2026-10-08')).toBe('2026-10-08T00:00:00');
    expect(dayBound('2026-10-08', true)).toBe('2026-10-08T23:59:59');
  });

  it('sends nothing when no date was picked', () => {
    expect(dayBound('')).toBe('');
    expect(dayBound('', true)).toBe('');
  });
});
