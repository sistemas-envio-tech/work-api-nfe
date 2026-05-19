import { criarLogger, type LoggerInterface } from '@acbr-node/core';
import { env } from '../config/env.js';

/**
 * Logger singleton do http-api. Respeita LOG_LEVEL do env (debug|info|warn|error)
 * e prefixa todas as mensagens com [http-api] para facilitar filtragem em
 * producao (Railway logs, datadog, etc.).
 */
export const appLogger: LoggerInterface = criarLogger({
  level: env.logLevel,
  prefix: '[http-api]',
});
