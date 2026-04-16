import { describe, it, expect } from 'vitest';
import {
  AcbrError,
  CertificateError,
  SefazError,
  ValidationError,
  SoapError,
} from '../../src/errors/index.js';

describe('Error Hierarchy', () => {
  it('AcbrError should be base error', () => {
    const err = new AcbrError('test', 'TEST');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AcbrError);
    expect(err.code).toBe('TEST');
    expect(err.message).toBe('test');
  });

  it('CertificateError should extend AcbrError', () => {
    const err = new CertificateError('cert expired');
    expect(err).toBeInstanceOf(AcbrError);
    expect(err.code).toBe('CERTIFICATE_ERROR');
  });

  it('SefazError should include cStat and xMotivo', () => {
    const err = new SefazError('204', 'Duplicidade de NF-e');
    expect(err).toBeInstanceOf(AcbrError);
    expect(err.cStat).toBe('204');
    expect(err.xMotivo).toBe('Duplicidade de NF-e');
    expect(err.isRetryable).toBe(false);
  });

  it('SefazError should identify retryable codes', () => {
    expect(new SefazError('108', 'Servico Paralisado Momentaneamente').isRetryable).toBe(true);
    expect(new SefazError('109', 'Servico Paralisado sem Previsao').isRetryable).toBe(true);
    expect(new SefazError('105', 'Lote em Processamento').isRetryable).toBe(true);
  });

  it('ValidationError should include field and details', () => {
    const err = new ValidationError('Invalid', 'cnpj', ['Must be 14 digits']);
    expect(err.field).toBe('cnpj');
    expect(err.details).toEqual(['Must be 14 digits']);
  });

  it('SoapError should include statusCode', () => {
    const err = new SoapError('HTTP 500', 500, '<fault>Server Error</fault>');
    expect(err.statusCode).toBe(500);
    expect(err.soapFault).toContain('Server Error');
  });
});
