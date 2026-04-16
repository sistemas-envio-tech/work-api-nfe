import { describe, it, expect } from 'vitest';
import { CircuitBreaker, CircuitState } from '../../src/utils/circuit-breaker.js';

describe('CircuitBreaker', () => {
  it('should start in CLOSED state', () => {
    const cb = new CircuitBreaker();
    expect(cb.currentState).toBe(CircuitState.CLOSED);
  });

  it('should execute successfully in CLOSED state', async () => {
    const cb = new CircuitBreaker();
    const result = await cb.execute(() => Promise.resolve('ok'));
    expect(result).toBe('ok');
    expect(cb.currentState).toBe(CircuitState.CLOSED);
  });

  it('should open after reaching failure threshold', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 60000, failureWindowMs: 120000 });

    for (let i = 0; i < 3; i++) {
      await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow('fail');
    }

    expect(cb.currentState).toBe(CircuitState.OPEN);
  });

  it('should reject immediately when OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 60000, failureWindowMs: 120000 });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();

    expect(cb.currentState).toBe(CircuitState.OPEN);

    await expect(cb.execute(() => Promise.resolve('ok'))).rejects.toThrow('Circuit breaker OPEN');
  });

  it('should transition to HALF_OPEN after reset timeout', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50, failureWindowMs: 120000 });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.currentState).toBe(CircuitState.OPEN);

    // Esperar timeout
    await new Promise(r => setTimeout(r, 60));
    expect(cb.currentState).toBe(CircuitState.HALF_OPEN);
  });

  it('should close after successful call in HALF_OPEN', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 50, failureWindowMs: 120000 });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    await new Promise(r => setTimeout(r, 60));

    const result = await cb.execute(() => Promise.resolve('recovered'));
    expect(result).toBe('recovered');
    expect(cb.currentState).toBe(CircuitState.CLOSED);
  });

  it('should reset manually', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 1, resetTimeoutMs: 60000, failureWindowMs: 120000 });

    await expect(cb.execute(() => Promise.reject(new Error('fail')))).rejects.toThrow();
    expect(cb.currentState).toBe(CircuitState.OPEN);

    cb.reset();
    expect(cb.currentState).toBe(CircuitState.CLOSED);
  });
});
