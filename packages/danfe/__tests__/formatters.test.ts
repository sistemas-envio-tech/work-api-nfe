import { describe, it, expect } from 'vitest';
import {
  fmtCNPJ, fmtCPF, fmtCEP, fmtFone, fmtMoney, fmtQtd,
  fmtChaveAcesso, fmtData, fmtDataHora,
} from '../src/utils/formatters.js';

describe('Formatters', () => {
  it('fmtCNPJ', () => {
    expect(fmtCNPJ('08043291000155')).toBe('08.043.291/0001-55');
    expect(fmtCNPJ('123')).toBe('123'); // invalid, return as-is
  });

  it('fmtCPF', () => {
    expect(fmtCPF('52998224725')).toBe('529.982.247-25');
  });

  it('fmtCEP', () => {
    expect(fmtCEP('01001000')).toBe('01001-000');
  });

  it('fmtFone', () => {
    expect(fmtFone('11987654321')).toBe('(11) 98765-4321');
    expect(fmtFone('1134567890')).toBe('(11) 3456-7890');
  });

  it('fmtMoney', () => {
    expect(fmtMoney(1234.56)).toBe('1.234,56');
    expect(fmtMoney(0)).toBe('0,00');
    expect(fmtMoney('100.5')).toBe('100,50');
    expect(fmtMoney('invalid')).toBe('0,00');
  });

  it('fmtQtd', () => {
    expect(fmtQtd(1)).toBe('1,0000');
    expect(fmtQtd(10.5, 2)).toBe('10,50');
  });

  it('fmtChaveAcesso', () => {
    const chave = '35230308043291000155550010000010011003290410';
    const formatted = fmtChaveAcesso(chave);
    expect(formatted).toContain(' ');
    expect(formatted.replace(/ /g, '')).toBe(chave);
  });

  it('fmtData', () => {
    expect(fmtData('2023-03-15T10:30:00-03:00')).toBe('15/03/2023');
    expect(fmtData('')).toBe('');
  });

  it('fmtDataHora', () => {
    expect(fmtDataHora('2023-03-15T10:30:45-03:00')).toBe('15/03/2023 10:30:45');
  });
});
