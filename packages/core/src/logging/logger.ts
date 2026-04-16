export interface LoggerInterface {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export const noopLogger: LoggerInterface = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

export function createLogger(enabled: boolean = true): LoggerInterface {
  if (!enabled) return noopLogger;

  return {
    debug(message: string, ...args: unknown[]) {
      console.debug(`[acbr-node] ${message}`, ...args);
    },
    info(message: string, ...args: unknown[]) {
      console.info(`[acbr-node] ${message}`, ...args);
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(`[acbr-node] ${message}`, ...args);
    },
    error(message: string, ...args: unknown[]) {
      console.error(`[acbr-node] ${message}`, ...args);
    },
  };
}
