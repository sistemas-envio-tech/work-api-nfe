import { AcbrError } from './acbr-error.js';

export class SefazError extends AcbrError {
  public readonly cStat: string;
  public readonly xMotivo: string;

  constructor(cStat: string, xMotivo: string) {
    super(`SEFAZ [${cStat}]: ${xMotivo}`, 'SEFAZ_ERROR');
    this.name = 'SefazError';
    this.cStat = cStat;
    this.xMotivo = xMotivo;
  }

  get isRetryable(): boolean {
    const retryableCodes = ['108', '109', '105'];
    return retryableCodes.includes(this.cStat);
  }
}
