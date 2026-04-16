import { describe, it, expect } from 'vitest';
import {
  isValidCNPJ,
  isValidCPF,
  formatCNPJ,
  formatCPF,
} from '../../src/utils/validators.js';

describe('CNPJ Validator', () => {
  it('should validate correct CNPJ', () => {
    expect(isValidCNPJ('11222333000181')).toBe(true);
    expect(isValidCNPJ('11.222.333/0001-81')).toBe(true);
  });

  it('should reject invalid CNPJ', () => {
    expect(isValidCNPJ('11222333000182')).toBe(false);
    expect(isValidCNPJ('00000000000000')).toBe(false);
    expect(isValidCNPJ('1234')).toBe(false);
    expect(isValidCNPJ('')).toBe(false);
  });

  it('should reject repeated digits', () => {
    expect(isValidCNPJ('11111111111111')).toBe(false);
    expect(isValidCNPJ('22222222222222')).toBe(false);
  });
});

describe('CPF Validator', () => {
  it('should validate correct CPF', () => {
    expect(isValidCPF('52998224725')).toBe(true);
    expect(isValidCPF('529.982.247-25')).toBe(true);
  });

  it('should reject invalid CPF', () => {
    expect(isValidCPF('52998224726')).toBe(false);
    expect(isValidCPF('00000000000')).toBe(false);
    expect(isValidCPF('123')).toBe(false);
  });

  it('should reject repeated digits', () => {
    expect(isValidCPF('11111111111')).toBe(false);
    expect(isValidCPF('99999999999')).toBe(false);
  });
});

describe('Format CNPJ', () => {
  it('should format CNPJ correctly', () => {
    expect(formatCNPJ('11222333000181')).toBe('11.222.333/0001-81');
  });
});

describe('Format CPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25');
  });
});
