import { describe, expect, it } from 'vitest';
import { Timeframe } from '../../market-data/timeframe';
import { MarkPriceSourceKind } from './mark-price-draft';
import { createMarketDataQuarantine } from './market-data-quarantine';
import { MarketDataValidator } from './market-data-validator';
import type { ClosedCandleDraft } from './closed-candle-draft';
import type { MarkPriceDraft } from './mark-price-draft';

const OPS = {
  exchangeOccurredAt: '2026-07-18T09:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

function candle(overrides: Partial<ClosedCandleDraft> = {}): ClosedCandleDraft {
  return Object.freeze({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'BTCUSDT',
    timeframe: Timeframe.H1,
    openTime: '2026-07-18T09:00:00.000Z',
    closeTime: '2026-07-18T09:59:59.999Z',
    open: 100,
    high: 110,
    low: 95,
    close: 105,
    volume: 1,
    sequence: 1,
    isClosed: true,
    ...OPS,
    ...overrides,
  });
}

function mark(overrides: Partial<MarkPriceDraft> = {}): MarkPriceDraft {
  return Object.freeze({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'ETHUSDT',
    price: 2000,
    markSource: MarkPriceSourceKind.BOOK_MID,
    sequence: 1,
    ...OPS,
    exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
    ...overrides,
  });
}

describe('Market data validation and quarantine (US137)', () => {
  const validator = new MarketDataValidator();

  it('rejects invalid candle shape/price/volume/timestamp without publishing an event', () => {
    const cases: Array<Partial<ClosedCandleDraft>> = [
      { high: 90, low: 95 },
      { volume: -1 },
      { openTime: 'not-a-date' },
      { instrument: '' },
      { isClosed: false },
    ];

    for (const override of cases) {
      const result = validator.validateClosedCandle({
        draft: candle(override),
        rawMessage: { e: 'kline', note: 'fixture' },
        quarantinedAt: '2026-07-18T10:00:01.000Z',
      });
      expect(result.outcome).toBe('quarantined');
      if (result.outcome !== 'quarantined') continue;
      expect(result.quarantine.reason.length).toBeGreaterThan(0);
      expect('event' in result).toBe(false);
    }
  });

  it('rejects invalid mark prices into quarantine', () => {
    const result = validator.validateMarkPrice({
      draft: mark({ price: -5 }),
      rawMessage: { e: 'bookTicker' },
      quarantinedAt: '2026-07-18T10:00:01.000Z',
    });
    expect(result.outcome).toBe('quarantined');
  });

  it('retains reason and raw-message reference without storing secrets', () => {
    const quarantine = createMarketDataQuarantine({
      workspaceId: 'ws-1',
      sourceId: 'binance_spot',
      instrument: 'BTCUSDT',
      channel: 'closed_candle',
      reason: 'invalid high/low',
      quarantinedAt: '2026-07-18T10:00:01.000Z',
      rawMessage: {
        e: 'kline',
        apiKey: 'SHOULD_BE_STRIPPED',
        apiSecret: 'SHOULD_BE_STRIPPED',
        k: { o: '1' },
      },
    });

    expect(quarantine.rawMessageRef).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(quarantine)).not.toContain('SHOULD_BE_STRIPPED');
    expect(JSON.stringify(quarantine)).not.toContain('apiKey');
    expect(quarantine.reason).toBe('invalid high/low');
  });

  it('does not terminate unrelated streams when one draft fails', () => {
    const bad = validator.validateClosedCandle({
      draft: candle({ volume: -1 }),
      rawMessage: { stream: 'btc' },
      quarantinedAt: '2026-07-18T10:00:01.000Z',
    });
    const good = validator.validateMarkPrice({
      draft: mark({ instrument: 'ETHUSDT', price: 2100 }),
      rawMessage: { stream: 'eth' },
      quarantinedAt: '2026-07-18T10:00:01.000Z',
    });

    expect(bad.outcome).toBe('quarantined');
    expect(good.outcome).toBe('accepted');
    if (good.outcome !== 'accepted') return;
    expect(good.event.instrument).toBe('ETHUSDT');
    expect(good.event.price).toBe(2100);
  });

  it('accepts valid closed candles as publishable market events', () => {
    const result = validator.validateClosedCandle({
      draft: candle(),
      rawMessage: { e: 'kline', x: true },
      quarantinedAt: '2026-07-18T10:00:01.000Z',
    });
    expect(result.outcome).toBe('accepted');
    if (result.outcome !== 'accepted') return;
    expect(result.event.eventType).toBe('MarketClosedCandle');
  });
});
