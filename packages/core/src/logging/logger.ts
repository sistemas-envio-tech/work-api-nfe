export interface LoggerInterface {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export const loggerNoop: LoggerInterface = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface LoggerOptions {
  /** Limiar minimo. 'silent' = loggerNoop. Default 'info'. */
  level?: LogLevel;
  /** Prefixo prependado a toda mensagem. Default '[acbr-node]'. */
  prefix?: string;
  /** Contexto estatico exibido em cada linha (ex.: { requestId, cnpj }). */
  context?: Record<string, string | number | boolean>;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3, silent: 99,
};

/**
 * Cria um logger com nivel/prefixo/contexto. Aceita boolean por retrocompat:
 * `criarLogger(true)` equivale a `criarLogger({ level: 'info' })` e
 * `criarLogger(false)` equivale ao loggerNoop.
 */
export function criarLogger(enabledOrOptions: boolean | LoggerOptions = true): LoggerInterface {
  if (typeof enabledOrOptions === 'boolean') {
    return enabledOrOptions ? criarLogger({}) : loggerNoop;
  }

  const { level = 'info', prefix = '[acbr-node]', context } = enabledOrOptions;
  const threshold = LEVEL_ORDER[level];
  if (threshold >= LEVEL_ORDER.silent) return loggerNoop;

  const ctxStr = context
    ? ' ' + Object.entries(context).map(([k, v]) => `${k}=${v}`).join(' ')
    : '';
  const format = (msg: string): string => `${prefix}${ctxStr} ${msg}`;

  return {
    debug(message, ...args) {
      if (threshold <= LEVEL_ORDER.debug) console.debug(format(message), ...args);
    },
    info(message, ...args) {
      if (threshold <= LEVEL_ORDER.info) console.info(format(message), ...args);
    },
    warn(message, ...args) {
      if (threshold <= LEVEL_ORDER.warn) console.warn(format(message), ...args);
    },
    error(message, ...args) {
      if (threshold <= LEVEL_ORDER.error) console.error(format(message), ...args);
    },
  };
}
