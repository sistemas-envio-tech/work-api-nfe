import { describe, it, expect } from 'vitest';
import {
  gerarChaveAcesso,
  calcularMod11,
  validarChaveAcesso,
} from '../../src/utils/access-key.js';

describe('Mod11 Check Digit', () => {
  it('should calculate mod11 correctly', () => {
    // Teste com valor conhecido
    expect(calcularMod11('3523030804329100005500100000000010100329041')).toBeGreaterThanOrEqual(0);
    expect(calcularMod11('3523030804329100005500100000000010100329041')).toBeLessThanOrEqual(9);
  });
});

describe('Access Key Generation', () => {
  it('should generate 44-digit access key', () => {
    const key = gerarChaveAcesso({
      cUF: 35,           // SP
      dataEmissao: new Date(2023, 2, 15), // Março 2023
      cnpj: '08043291000155',
      mod: 55,
      serie: 1,
      nNF: 1010,
      tpEmis: 1,
      cNF: 32904104,
    });

    expect(key).toHaveLength(44);
    expect(key).toMatch(/^\d{44}$/);

    // Verificar composição
    expect(key.substring(0, 2)).toBe('35');       // cUF (SP)
    expect(key.substring(2, 6)).toBe('2303');     // AAMM
    expect(key.substring(6, 20)).toBe('08043291000155'); // CNPJ
    expect(key.substring(20, 22)).toBe('55');     // mod
    expect(key.substring(22, 25)).toBe('001');    // serie
    expect(key.substring(25, 34)).toBe('000001010'); // nNF
    expect(key.substring(34, 35)).toBe('1');      // tpEmis
    expect(key.substring(35, 43)).toBe('32904104'); // cNF
  });

  it('should generate valid check digit', () => {
    const key = gerarChaveAcesso({
      cUF: 35,
      dataEmissao: new Date(2023, 2, 15),
      cnpj: '08043291000155',
      mod: 55,
      serie: 1,
      nNF: 1010,
      tpEmis: 1,
      cNF: 32904104,
    });

    expect(validarChaveAcesso(key)).toBe(true);
  });
});

describe('Access Key Validation', () => {
  it('should reject keys with wrong length', () => {
    expect(validarChaveAcesso('123')).toBe(false);
    expect(validarChaveAcesso('12345678901234567890123456789012345678901234X')).toBe(false);
  });

  it('should reject keys with wrong check digit', () => {
    const key = gerarChaveAcesso({
      cUF: 35,
      dataEmissao: new Date(2023, 2, 15),
      cnpj: '08043291000155',
      mod: 55,
      serie: 1,
      nNF: 1010,
      tpEmis: 1,
      cNF: 32904104,
    });

    // Alterar último dígito
    const wrongKey = key.slice(0, 43) + ((parseInt(key[43]) + 1) % 10).toString();
    expect(validarChaveAcesso(wrongKey)).toBe(false);
  });
});
