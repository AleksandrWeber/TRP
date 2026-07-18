import { describe, expect, it } from 'vitest';
import { mapBinanceBookTickerToDraft } from '../connectors/binance/map-binance-book-ticker';
import { MarkPriceSourceKind } from './mark-price-draft';
import { markPricesAreSemanticallyEqual, normalizeMarkPrice } from './normalize-mark-price';
import type { MarkPriceDraft } from './mark-price-draft';

const OPS = {
  exchangeOccurredAt: '2026-07-18T10:00:00.000Z',
  receivedAt: '2026-07-18T10:00:00.050Z',
  processedAt: '2026-07-18T10:00:00.080Z',
  recordedAt: '2026-07-18T10:00:00.100Z',
} as const;

function draft(overrides: Partial<MarkPriceDraft> = {}): MarkPriceDraft {
  return Object.freeze({
    workspaceId: 'ws-1',
    sourceId: 'binance_spot',
    instrument: 'ETHUSDT',
    price: 3500.25,
    markSource: MarkPriceSourceKind.EXCHANGE_MARK,
    sequence: 1,
    ...OPS,
    ...overrides,
  });
}

describe('Mark-price normalization (US136)', () => {
  it('requires finite positive price and explicit mark source', () => {
    expect(normalizeMarkPrice(draft({ price: 0 })).ok).toBe(false);
    expect(normalizeMarkPrice(draft({ price: Number.NaN })).ok).toBe(false);

    const ok = normalizeMarkPrice(draft());
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.markSource).toBe(MarkPriceSourceKind.EXCHANGE_MARK);
    expect(ok.event.price).toBe(3500.25);
    expect(ok.event.sourceId).toBe('binance_spot');
  });

  it('produces deterministic semantic identity independent of operational clocks', () => {
    const a = normalizeMarkPrice(
      draft({
        receivedAt: '2026-07-18T10:00:00.010Z',
        processedAt: '2026-07-18T10:00:00.020Z',
        recordedAt: '2026-07-18T10:00:00.030Z',
      }),
    );
    const b = normalizeMarkPrice(
      draft({
        receivedAt: '2026-07-18T12:00:00.010Z',
        processedAt: '2026-07-18T12:00:05.020Z',
        recordedAt: '2026-07-18T12:00:05.030Z',
      }),
    );
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(markPricesAreSemanticallyEqual(a.event, b.event)).toBe(true);
  });

  it('does not introduce Position, Portfolio, or fill calculation fields', () => {
    const result = normalizeMarkPrice(draft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const field of [
      'positionId',
      'portfolioId',
      'fillId',
      'orderId',
      'unrealizedPnL',
      'equity',
    ]) {
      expect(field in result.event).toBe(false);
    }
  });

  it('applies configurable publication/retention policy without changing semantics', () => {
    const first = normalizeMarkPrice(draft(), {
      policy: { minPublishIntervalMs: 1000, retentionMs: 60_000 },
      lastPublishedAt: null,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.published).toBe(true);
    expect(first.policy.retentionMs).toBe(60_000);

    const throttled = normalizeMarkPrice(
      draft({ exchangeOccurredAt: '2026-07-18T10:00:00.500Z' }),
      {
        policy: { minPublishIntervalMs: 1000 },
        lastPublishedAt: '2026-07-18T10:00:00.000Z',
      },
    );
    expect(throttled.ok).toBe(true);
    if (!throttled.ok) return;
    expect(throttled.published).toBe(false);
    expect(throttled.event.price).toBe(3500.25);
  });

  it('maps Binance bookTicker inside the adapter to BOOK_MID without leaking raw keys', () => {
    const mapped = mapBinanceBookTickerToDraft({
      workspaceId: 'ws-1',
      sequence: 3,
      exchangeOccurredAt: OPS.exchangeOccurredAt,
      receivedAt: OPS.receivedAt,
      processedAt: OPS.processedAt,
      recordedAt: OPS.recordedAt,
      message: {
        e: 'bookTicker',
        u: 1,
        s: 'ETHUSDT',
        b: '3500.00',
        B: '1',
        a: '3500.50',
        A: '2',
      },
    });

    expect(mapped.markSource).toBe(MarkPriceSourceKind.BOOK_MID);
    expect(mapped.price).toBe(3500.25);
    expect('e' in mapped).toBe(false);
    expect('b' in mapped).toBe(false);
    expect('a' in mapped).toBe(false);

    const normalized = normalizeMarkPrice(mapped);
    expect(normalized.ok).toBe(true);
    if (!normalized.ok) return;
    expect(JSON.stringify(normalized.event)).not.toContain('bookTicker');
  });
});
