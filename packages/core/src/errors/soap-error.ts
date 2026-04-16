import { AcbrError } from './acbr-error.js';

export class SoapError extends AcbrError {
  public readonly statusCode?: number;
  public readonly soapFault?: string;

  constructor(message: string, statusCode?: number, soapFault?: string) {
    super(message, 'SOAP_ERROR');
    this.name = 'SoapError';
    this.statusCode = statusCode;
    this.soapFault = soapFault;
  }
}
