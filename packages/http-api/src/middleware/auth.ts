import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health') {
    next();
    return;
  }

  const token = req.header('X-Internal-Token');
  if (!env.internalToken || token !== env.internalToken) {
    res.status(401).json({ error: 'Token invalido' });
    return;
  }
  next();
}
