import { AcbrError } from './acbr-error.js';

export class CertificateError extends AcbrError {
  constructor(message: string) {
    super(message, 'CERTIFICATE_ERROR');
    this.name = 'CertificateError';
  }
}
