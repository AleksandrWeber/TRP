import { describe, expect, it } from 'vitest';
import { MarketCandleRetrievalAudit } from './market-candle.audit';

describe('Market candle retrieval audit (W2-S03-d)', () => {
  it('emits only started, completed, and failed through Security Audit', async () => {
    const events: Array<{ eventType: string; outcome: string; source: string }> = [];
    const audit = new MarketCandleRetrievalAudit({
      record: async (write: { eventType: string; outcome: string; source: string }) => {
        events.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'candlestick_retrieval_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      interval: '1h',
    });
    await audit.record({
      outcome: 'candlestick_retrieval_completed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      interval: '1h',
    });
    await audit.record({
      outcome: 'candlestick_retrieval_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      interval: '1h',
      failureReason: 'Provider unavailable',
    });

    expect(events.map((event) => event.outcome)).toEqual([
      'candlestick_retrieval_started',
      'candlestick_retrieval_completed',
      'candlestick_retrieval_failed',
    ]);
    expect(events.every((event) => event.eventType === 'connection.validation')).toBe(true);
    expect(events.every((event) => event.source === 'market-data-foundation')).toBe(true);
  });
});
