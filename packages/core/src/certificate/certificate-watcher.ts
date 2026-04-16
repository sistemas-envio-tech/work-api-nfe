import type { CertificateInfo } from './types.js';
import type { LoggerInterface } from '../logging/logger.js';

export interface CertificateWatcherOptions {
  /** Dias antes da expiração para emitir warning (padrão: 30) */
  warningDays: number;
  /** Dias antes da expiração para emitir alerta crítico (padrão: 7) */
  criticalDays: number;
  /** Callback quando certificado está próximo de expirar */
  onWarning?: (daysLeft: number, info: CertificateInfo) => void;
  /** Callback quando certificado está em estado crítico */
  onCritical?: (daysLeft: number, info: CertificateInfo) => void;
  /** Callback quando certificado expirou */
  onExpired?: (info: CertificateInfo) => void;
}

const DEFAULT_OPTIONS: CertificateWatcherOptions = {
  warningDays: 30,
  criticalDays: 7,
};

export class CertificateWatcher {
  private options: CertificateWatcherOptions;
  private logger?: LoggerInterface;

  constructor(options?: Partial<CertificateWatcherOptions>, logger?: LoggerInterface) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.logger = logger;
  }

  /**
   * Verifica o status do certificado e emite alertas
   */
  check(info: CertificateInfo): CertificateStatus {
    const now = new Date();
    const daysLeft = Math.floor(
      (info.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      this.logger?.error(`Certificado EXPIRADO há ${Math.abs(daysLeft)} dias! CN: ${info.subject.CN}`);
      this.options.onExpired?.(info);
      return { status: 'expired', daysLeft };
    }

    if (daysLeft <= this.options.criticalDays) {
      this.logger?.error(`Certificado expira em ${daysLeft} dias! CN: ${info.subject.CN}`);
      this.options.onCritical?.(daysLeft, info);
      return { status: 'critical', daysLeft };
    }

    if (daysLeft <= this.options.warningDays) {
      this.logger?.warn(`Certificado expira em ${daysLeft} dias. CN: ${info.subject.CN}`);
      this.options.onWarning?.(daysLeft, info);
      return { status: 'warning', daysLeft };
    }

    return { status: 'ok', daysLeft };
  }
}

export interface CertificateStatus {
  status: 'ok' | 'warning' | 'critical' | 'expired';
  daysLeft: number;
}
