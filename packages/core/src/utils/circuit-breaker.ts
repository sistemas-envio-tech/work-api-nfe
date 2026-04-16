/**
 * Circuit Breaker para proteger contra falhas repetidas do SEFAZ
 *
 * Estados:
 * - CLOSED: operação normal, erros são contados
 * - OPEN: chamadas bloqueadas, retorna erro imediato
 * - HALF_OPEN: permite uma chamada de teste para verificar recuperação
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
  /** Número de falhas antes de abrir o circuito (padrão: 5) */
  failureThreshold: number;
  /** Tempo em ms que o circuito fica aberto antes de testar (padrão: 60000) */
  resetTimeoutMs: number;
  /** Tempo em ms para esquecer falhas anteriores (padrão: 120000) */
  failureWindowMs: number;
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  resetTimeoutMs: 60000,
  failureWindowMs: 120000,
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private openedAt = 0;
  private options: CircuitBreakerOptions;

  constructor(options?: Partial<CircuitBreakerOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  get currentState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.openedAt >= this.options.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
      }
    }
    return this.state;
  }

  /**
   * Executa uma função protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;

    if (state === CircuitState.OPEN) {
      throw new Error(
        `Circuit breaker OPEN: SEFAZ indisponível. Tente novamente em ${Math.ceil((this.options.resetTimeoutMs - (Date.now() - this.openedAt)) / 1000)}s`
      );
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
  }

  private onFailure(): void {
    const now = Date.now();

    // Reset failure count se a janela expirou
    if (now - this.lastFailureTime > this.options.failureWindowMs) {
      this.failureCount = 0;
    }

    this.failureCount++;
    this.lastFailureTime = now;

    if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.openedAt = now;
    }
  }

  /** Reseta o circuit breaker manualmente */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.openedAt = 0;
  }
}
