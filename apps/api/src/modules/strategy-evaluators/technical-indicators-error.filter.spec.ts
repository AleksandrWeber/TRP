import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  DuplicateIndicatorError,
  InsufficientIndicatorInputError,
  InvalidIndicatorInputError,
  InvalidIndicatorPeriodError,
  UnknownIndicatorError,
  type TechnicalIndicatorsError,
} from '../technical-indicators';
import { TechnicalIndicatorsErrorFilter } from './technical-indicators-error.filter';

function runFilter(exception: TechnicalIndicatorsError) {
  const sent: { status?: number; body?: any } = {};
  const response = {
    code: (status: number) => ({
      send: (body: unknown) => {
        sent.status = status;
        sent.body = body;
        return body;
      },
    }),
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;

  new TechnicalIndicatorsErrorFilter().catch(exception, host);
  return sent;
}

describe('TechnicalIndicatorsErrorFilter (US012)', () => {
  it('maps UNKNOWN_INDICATOR to 400', () => {
    const sent = runFilter(new UnknownIndicatorError('rsi', ['sma', 'ema']));
    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({ statusCode: 400, code: 'UNKNOWN_INDICATOR' });
    expect(sent.body.message).toMatch(/rsi.*sma, ema/);
  });

  it('maps INVALID_PERIOD to 400', () => {
    const sent = runFilter(new InvalidIndicatorPeriodError(0));
    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({ code: 'INVALID_PERIOD' });
  });

  it('maps INSUFFICIENT_INPUT to 400', () => {
    const sent = runFilter(new InsufficientIndicatorInputError(50, 10));
    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({ code: 'INSUFFICIENT_INPUT' });
  });

  it('maps INVALID_INPUT (non-finite upstream data) to 502', () => {
    const sent = runFilter(new InvalidIndicatorInputError('NaN at index 3'));
    expect(sent.status).toBe(502);
    expect(sent.body).toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('maps DUPLICATE_INDICATOR (boot-time invariant) to 500', () => {
    const sent = runFilter(new DuplicateIndicatorError('sma'));
    expect(sent.status).toBe(500);
    expect(sent.body).toMatchObject({ code: 'DUPLICATE_INDICATOR' });
  });
});
