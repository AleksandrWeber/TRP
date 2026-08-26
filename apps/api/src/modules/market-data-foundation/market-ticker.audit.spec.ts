import { describe, expect, it } from 'vitest';
import { MarketTickerRetrievalAudit } from './market-ticker.audit';

describe('Market ticker retrieval audit (W2-S03-c)', () => {
  it('emits only started, completed, and failed through Security Audit', async () => {
    const events: Array<{ eventType: string; outcome: string; source: string }> = [];
    const audit = new MarketTickerRetrievalAudit({
      record: async (write: { eventType: string; outcome: string; source: string }) => {
        events.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'ticker_retrieval_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
    });
    await audit.record({
      outcome: 'ticker_retrieval_completed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
    });
    await audit.record({
      outcome: 'ticker_retrieval_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      failureReason: 'Provider unavailable',
    });

    expect(events.map((event) => event.outcome)).toEqual([
      'ticker_retrieval_started',
      'ticker_retrieval_completed',
      'ticker_retrieval_failed',
    ]);
    expect(events.every((event) => event.eventType === 'connection.validation')).toBe(true);
    expect(events.every((event) => event.source === 'market-data-foundation')).toBe(true);
  });
});
