import { describe, it, expect } from 'vitest';
import { IBGE_UF, obterCodigoUF, obterUFPorCodigo } from '../../src/utils/ibge-codes.js';

describe('IBGE Codes', () => {
  it('should have all 27 UFs', () => {
    expect(Object.keys(IBGE_UF)).toHaveLength(27);
  });

  it('should return correct codes', () => {
    expect(obterCodigoUF('SP')).toBe(35);
    expect(obterCodigoUF('RJ')).toBe(33);
    expect(obterCodigoUF('MG')).toBe(31);
    expect(obterCodigoUF('PR')).toBe(41);
    expect(obterCodigoUF('RS')).toBe(43);
    expect(obterCodigoUF('AM')).toBe(13);
  });

  it('should reverse lookup UF by code', () => {
    expect(obterUFPorCodigo(35)).toBe('SP');
    expect(obterUFPorCodigo(33)).toBe('RJ');
    expect(obterUFPorCodigo(43)).toBe('RS');
  });

  it('should throw for invalid UF', () => {
    expect(() => obterCodigoUF('XX')).toThrow('UF inválida');
  });

  it('should throw for invalid code', () => {
    expect(() => obterUFPorCodigo(99)).toThrow('Código IBGE inválido');
  });
});
