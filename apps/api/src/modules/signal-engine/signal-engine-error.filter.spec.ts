import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  EmptyCandleSeriesError,
  UnknownStrategyEvaluatorError,
} from './domain/signal-engine.error';
import { SignalEngineErrorFilter } from './signal-engine-error.filter';

function captureResponse() {
  const sent: { status?: number; body?: unknown } = {};
  const response = {
    code(status: number) {
      sent.status = status;
      return {
        send(body: unknown) {
          sent.body = body;
          return body;
        },
      };
    },
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as unknown as ArgumentsHost;
  return { sent, host };
}

describe('SignalEngineErrorFilter (US009)', () => {
  const filter = new SignalEngineErrorFilter();

  it('maps UNKNOWN_EVALUATOR to 400', () => {
    const { sent, host } = captureResponse();
    filter.catch(new UnknownStrategyEvaluatorError('macd', ['dummy']), host);

    expect(sent.status).toBe(400);
    expect(sent.body).toMatchObject({
      statusCode: 400,
      code: 'UNKNOWN_EVALUATOR',
      message: expect.stringContaining('macd'),
    });
  });

  it('maps EMPTY_CANDLE_SERIES to 502', () => {
    const { sent, host } = captureResponse();
    filter.catch(new EmptyCandleSeriesError('BTCUSDT', '1h'), host);

    expect(sent.status).toBe(502);
    expect(sent.body).toMatchObject({
      statusCode: 502,
      code: 'EMPTY_CANDLE_SERIES',
      message: expect.stringContaining('BTCUSDT'),
    });
  });
});
