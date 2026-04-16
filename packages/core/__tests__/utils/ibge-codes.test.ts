import { describe, it, expect } from 'vitest';
import { IBGE_UF, getUFCode, getUFByCode } from '../../src/utils/ibge-codes.js';

describe('IBGE Codes', () => {
  it('should have all 27 UFs', () => {
    expect(Object.keys(IBGE_UF)).toHaveLength(27);
  });

  it('should return correct codes', () => {
    expect(getUFCode('SP')).toBe(35);
    expect(getUFCode('RJ')).toBe(33);
    expect(getUFCode('MG')).toBe(31);
    expect(getUFCode('PR')).toBe(41);
    expect(getUFCode('RS')).toBe(43);
    expect(getUFCode('AM')).toBe(13);
  });

  it('should reverse lookup UF by code', () => {
    expect(getUFByCode(35)).toBe('SP');
    expect(getUFByCode(33)).toBe('RJ');
    expect(getUFByCode(43)).toBe('RS');
  });

  it('should throw for invalid UF', () => {
    expect(() => getUFCode('XX')).toThrow('UF inválida');
  });

  it('should throw for invalid code', () => {
    expect(() => getUFByCode(99)).toThrow('Código IBGE inválido');
  });
});
