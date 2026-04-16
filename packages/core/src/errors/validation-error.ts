import { AcbrError } from './acbr-error.js';

export class ValidationError extends AcbrError {
  public readonly field?: string;
  public readonly details?: string[];

  constructor(message: string, field?: string, details?: string[]) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
    this.details = details;
  }
}
