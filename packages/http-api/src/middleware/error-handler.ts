import type { Request, Response, NextFunction } from 'express';
import { SefazError, SoapError } from '@acbr-node/core';
import { appLogger } from '../logging/app-logger.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof SefazError) {
    res.status(502).json({
      error: 'SefazError',
      cStat: err.cStat,
      xMotivo: err.message,
      retryable: err.isRetryable,
    });
    return;
  }
  if (err instanceof SoapError) {
    res.status(502).json({
      error: 'SoapError',
      message: err.message,
    });
    return;
  }
  const message = err instanceof Error ? err.message : String(err);
  appLogger.error('erro inesperado:', message);
  res.status(500).json({ error: 'InternalError', message });
}
