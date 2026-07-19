import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import {
  MarketDataProviderTimeoutError,
  MarketDataProviderUnavailableError,
  UnsupportedMarketSymbolError,
  UnsupportedMarketTimeframeError,
  type MarketDataDomainError,
} from './domain/market-data-domain.error';
import { MarketDataDomainErrorFilter } from './market-data-domain-error.filter';

function run(exception: MarketDataDomainError): { status: number; body: unknown } {
  const sent: { status: number; body: unknown } = { status: 0, body: null };
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({
        code: (status: number) => ({
          send: (body: unknown) => {
            sent.status = status;
            sent.body = body;
          },
        }),
      }),
    }),
  } as unknown as ArgumentsHost;

  new MarketDataDomainErrorFilter().catch(exception, host);
  return sent;
}

describe('MarketDataDomainErrorFilter (US007)', () => {
  it('maps unsupported symbol/timeframe to 400', () => {
    expect(run(new UnsupportedMarketSymbolError('NOPE', 'binance')).status).toBe(400);
    expect(run(new UnsupportedMarketTimeframeError('2w', 'binance')).status).toBe(400);
  });

  it('maps provider unavailability to 502 and timeout to 504', () => {
    expect(run(new MarketDataProviderUnavailableError('binance', 'upstream HTTP 503')).status).toBe(
      502,
    );
    expect(run(new MarketDataProviderTimeoutError('binance', 5000)).status).toBe(504);
  });

  it('exposes the domain error code and message in the body', () => {
    const { status, body } = run(new UnsupportedMarketSymbolError('NOPE', 'binance'));
    expect(body).toEqual({
      statusCode: status,
      code: 'UNSUPPORTED_SYMBOL',
      message: expect.stringContaining('NOPE'),
    });
  });
});
