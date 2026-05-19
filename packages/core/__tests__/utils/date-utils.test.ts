import { describe, it, expect } from 'vitest';
import { obterOffsetTimezone, formatarDataNFe } from '../../src/utils/date-utils.js';

describe('Timezone Offset', () => {
  it('should return -03:00 for most states', () => {
    expect(obterOffsetTimezone('SP')).toBe('-03:00');
    expect(obterOffsetTimezone('RJ')).toBe('-03:00');
    expect(obterOffsetTimezone('MG')).toBe('-03:00');
    expect(obterOffsetTimezone('PR')).toBe('-03:00');
  });

  it('should return -04:00 for AM, RR, RO, MT, MS', () => {
    expect(obterOffsetTimezone('AM')).toBe('-04:00');
    expect(obterOffsetTimezone('MT')).toBe('-04:00');
    expect(obterOffsetTimezone('MS')).toBe('-04:00');
  });

  it('should return -05:00 for AC', () => {
    expect(obterOffsetTimezone('AC')).toBe('-05:00');
  });

  it('should be case insensitive', () => {
    expect(obterOffsetTimezone('sp')).toBe('-03:00');
  });
});

describe('Format NFe Date', () => {
  it('should format date with timezone offset', () => {
    const date = new Date('2023-03-15T10:30:00Z');
    const formatted = formatarDataNFe(date, 'SP');

    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
  });

  it('should use correct offset for different states', () => {
    const date = new Date('2023-03-15T10:30:00Z');
    const spDate = formatarDataNFe(date, 'SP');
    const amDate = formatarDataNFe(date, 'AM');

    expect(spDate).toContain('-03:00');
    expect(amDate).toContain('-04:00');
  });
});
