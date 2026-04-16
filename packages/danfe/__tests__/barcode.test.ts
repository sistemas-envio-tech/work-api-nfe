import { describe, it, expect } from 'vitest';
import { generateCode128Bars, getCode128Width } from '../src/utils/barcode.js';

describe('Code128 Barcode', () => {
  it('should generate bars for numeric data', () => {
    const bars = generateCode128Bars('12345678');
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.some(b => b === true)).toBe(true);
    expect(bars.some(b => b === false)).toBe(true);
  });

  it('should generate bars for 44-digit access key', () => {
    const chave = '35230308043291000155550010000010011003290410';
    const bars = generateCode128Bars(chave);
    expect(bars.length).toBeGreaterThan(100); // 44 digits encoded in pairs = many bars
  });

  it('should return width matching bars length', () => {
    const chave = '35230308043291000155550010000010011003290410';
    const width = getCode128Width(chave);
    const bars = generateCode128Bars(chave);
    expect(width).toBe(bars.length);
  });

  it('should handle odd-length input (pads with 0)', () => {
    const bars1 = generateCode128Bars('123');
    const bars2 = generateCode128Bars('0123');
    expect(bars1.length).toBe(bars2.length);
  });
});
