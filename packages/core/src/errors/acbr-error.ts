export class AcbrError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'ACBR_ERROR') {
    super(message);
    this.name = 'AcbrError';
    this.code = code;
  }
}
