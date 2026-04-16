import { describe, it, expect } from 'vitest';
import { getTimezoneOffset, formatNFeDate } from '../../src/utils/date-utils.js';

describe('Timezone Offset', () => {
  it('should return -03:00 for most states', () => {
    expect(getTimezoneOffset('SP')).toBe('-03:00');
    expect(getTimezoneOffset('RJ')).toBe('-03:00');
    expect(getTimezoneOffset('MG')).toBe('-03:00');
    expect(getTimezoneOffset('PR')).toBe('-03:00');
  });

  it('should return -04:00 for AM, RR, RO, MT, MS', () => {
    expect(getTimezoneOffset('AM')).toBe('-04:00');
    expect(getTimezoneOffset('MT')).toBe('-04:00');
    expect(getTimezoneOffset('MS')).toBe('-04:00');
  });

  it('should return -05:00 for AC', () => {
    expect(getTimezoneOffset('AC')).toBe('-05:00');
  });

  it('should be case insensitive', () => {
    expect(getTimezoneOffset('sp')).toBe('-03:00');
  });
});

describe('Format NFe Date', () => {
  it('should format date with timezone offset', () => {
    const date = new Date('2023-03-15T10:30:00Z');
    const formatted = formatNFeDate(date, 'SP');

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
  });

  it('should use correct offset for different states', () => {
    const date = new Date('2023-03-15T10:30:00Z');
    const spDate = formatNFeDate(date, 'SP');
    const amDate = formatNFeDate(date, 'AM');

    expect(spDate).toContain('-03:00');
    expect(amDate).toContain('-04:00');
  });
});
