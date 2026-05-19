import { describe, it, expect } from 'vitest';
import {
  cnpjValido,
  cpfValido,
  formatarCNPJ,
  formatarCPF,
} from '../../src/utils/validators.js';

describe('CNPJ Validator', () => {
  it('should validate correct CNPJ', () => {
    expect(cnpjValido('11222333000181')).toBe(true);
    expect(cnpjValido('11.222.333/0001-81')).toBe(true);
  });

  it('should reject invalid CNPJ', () => {
    expect(cnpjValido('11222333000182')).toBe(false);
    expect(cnpjValido('00000000000000')).toBe(false);
    expect(cnpjValido('1234')).toBe(false);
    expect(cnpjValido('')).toBe(false);
  });

  it('should reject repeated digits', () => {
    expect(cnpjValido('11111111111111')).toBe(false);
    expect(cnpjValido('22222222222222')).toBe(false);
  });
});

describe('CPF Validator', () => {
  it('should validate correct CPF', () => {
    expect(cpfValido('52998224725')).toBe(true);
    expect(cpfValido('529.982.247-25')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(cpfValido('52998224726')).toBe(false);
    expect(cpfValido('00000000000')).toBe(false);
    expect(cpfValido('123')).toBe(false);
  });

  it('should reject repeated digits', () => {
    expect(cpfValido('11111111111')).toBe(false);
    expect(cpfValido('99999999999')).toBe(false);
  });
});

describe('Format CNPJ', () => {
  it('should format CNPJ correctly', () => {
    expect(formatarCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('Format CPF', () => {
  it('should format CPF correctly', () => {
    expect(formatarCPF('52998224725')).toBe('529.982.247-25');
  });
});
