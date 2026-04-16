import { describe, it, expect, vi } from 'vitest';
import { CertificateWatcher } from '../../src/certificate/certificate-watcher.js';
import type { CertificateInfo } from '../../src/certificate/types.js';

function makeCertInfo(daysFromNow: number): CertificateInfo {
  const now = new Date();
  return {
    subject: { CN: 'TESTE LTDA', CNPJ: '08043291000155' },
    issuer: 'ICP-Brasil',
    serialNumber: '123',
    validFrom: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    validTo: new Date(now.getTime() + daysFromNow * 24 * 60 * 60 * 1000),
    thumbprint: 'ABCDEF',
  };
}

describe('CertificateWatcher', () => {
  it('should return ok for certificate with >30 days', () => {
    const watcher = new CertificateWatcher();
    const result = watcher.check(makeCertInfo(60));
    expect(result.status).toBe('ok');
    expect(result.daysLeft).toBeGreaterThan(30);
  });

  it('should return warning for certificate with <=30 days', () => {
    const watcher = new CertificateWatcher();
    const result = watcher.check(makeCertInfo(20));
    expect(result.status).toBe('warning');
    expect(result.daysLeft).toBeLessThanOrEqual(30);
  });

  it('should return critical for certificate with <=7 days', () => {
    const watcher = new CertificateWatcher();
    const result = watcher.check(makeCertInfo(5));
    expect(result.status).toBe('critical');
  });

  it('should return expired for expired certificate', () => {
    const watcher = new CertificateWatcher();
    const result = watcher.check(makeCertInfo(-5));
    expect(result.status).toBe('expired');
    expect(result.daysLeft).toBeLessThan(0);
  });

  it('should call onWarning callback', () => {
    const onWarning = vi.fn();
    const watcher = new CertificateWatcher({ warningDays: 30, criticalDays: 7, onWarning });
    watcher.check(makeCertInfo(15));
    expect(onWarning).toHaveBeenCalledWith(expect.any(Number), expect.any(Object));
  });

  it('should call onCritical callback', () => {
    const onCritical = vi.fn();
    const watcher = new CertificateWatcher({ warningDays: 30, criticalDays: 7, onCritical });
    watcher.check(makeCertInfo(3));
    expect(onCritical).toHaveBeenCalled();
  });

  it('should call onExpired callback', () => {
    const onExpired = vi.fn();
    const watcher = new CertificateWatcher({ warningDays: 30, criticalDays: 7, onExpired });
    watcher.check(makeCertInfo(-1));
    expect(onExpired).toHaveBeenCalled();
  });

  it('should use custom thresholds', () => {
    const watcher = new CertificateWatcher({ warningDays: 60, criticalDays: 15 });
    const result = watcher.check(makeCertInfo(45));
    expect(result.status).toBe('warning');
  });
});
