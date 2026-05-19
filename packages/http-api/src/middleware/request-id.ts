import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { appLogger } from '../logging/app-logger.js';

/**
 * Atribui um requestId por request (recebe via header X-Request-Id se
 * presente, senao gera UUID v4) e ecoa no response. Loga inicio do request.
 *
 * Endereca o item M4 da auditoria — sem requestId, debug em producao com
 * varios clientes simultaneos vira adivinhacao. O id no header permite que
 * o chamador (work-manager) correlacione com seus proprios logs.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = req.header('X-Request-Id') || randomUUID();
  res.setHeader('X-Request-Id', id);
  // /health roda a cada poucos segundos no Railway — nao loga pra evitar spam.
  if (req.path !== '/health' && req.path !== '/') {
    appLogger.info(`${req.method} ${req.path} reqId=${id}`);
  }
  next();
}
