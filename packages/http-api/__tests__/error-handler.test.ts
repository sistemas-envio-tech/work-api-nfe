import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { SefazError, SoapError } from '@acbr-node/core';
import { errorHandler } from '../src/middleware/error-handler.js';

function mockResponse() {
  const captured: { status?: number; body?: unknown } = {};
  const res = {
    status: vi.fn((code: number) => {
      captured.status = code;
      return res;
    }),
    json: vi.fn((body: unknown) => {
      captured.body = body;
      return res;
    }),
  } as unknown as Response;
  return { res, captured };
}

const noopNext: NextFunction = () => {};
const fakeReq = {} as Request;

describe('errorHandler', () => {
  it('mapeia SefazError para HTTP 502 com cStat e flag de retry', () => {
    const { res, captured } = mockResponse();
    const err = new SefazError('108', 'Servico paralisado momentaneamente');

    errorHandler(err, fakeReq, res, noopNext);

    expect(captured.status).toBe(502);
    expect(captured.body).toMatchObject({
      error: 'SefazError',
      cStat: '108',
      retryable: true,
    });
  });

  it('marca cStat nao-retryable corretamente', () => {
    const { res, captured } = mockResponse();
    const err = new SefazError('215', 'Falha schema XML');

    errorHandler(err, fakeReq, res, noopNext);

    expect(captured.status).toBe(502);
    expect(captured.body).toMatchObject({
      error: 'SefazError',
      cStat: '215',
      retryable: false,
    });
  });

  it('mapeia SoapError para HTTP 502', () => {
    const { res, captured } = mockResponse();
    const err = new SoapError('timeout SOAP', 504);

    errorHandler(err, fakeReq, res, noopNext);

    expect(captured.status).toBe(502);
    expect(captured.body).toMatchObject({
      error: 'SoapError',
      message: 'timeout SOAP',
    });
  });

  it('mapeia erros desconhecidos para HTTP 500', () => {
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { res, captured } = mockResponse();

    errorHandler(new Error('boom'), fakeReq, res, noopNext);

    expect(captured.status).toBe(500);
    expect(captured.body).toMatchObject({ error: 'InternalError', message: 'boom' });
    consoleErrSpy.mockRestore();
  });

  it('serializa erros nao-Error para string', () => {
    const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { res, captured } = mockResponse();

    errorHandler('falha em string', fakeReq, res, noopNext);

    expect(captured.status).toBe(500);
    expect(captured.body).toMatchObject({ error: 'InternalError', message: 'falha em string' });
    consoleErrSpy.mockRestore();
  });
});
