import { describe, expect, it } from 'vitest';
import { MarketOrderBookRetrievalAudit } from './market-order-book.audit';

describe('Market order book retrieval audit (W2-S03-e)', () => {
  it('emits only started, completed, and failed through Security Audit', async () => {
    const events: Array<{ eventType: string; outcome: string; source: string }> = [];
    const audit = new MarketOrderBookRetrievalAudit({
      record: async (write: { eventType: string; outcome: string; source: string }) => {
        events.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'order_book_retrieval_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      depthLimit: 20,
    });
    await audit.record({
      outcome: 'order_book_retrieval_completed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      depthLimit: 20,
    });
    await audit.record({
      outcome: 'order_book_retrieval_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      exchangeSymbol: 'BTCUSDT',
      depthLimit: 20,
      failureReason: 'Provider unavailable',
    });

    expect(events.map((event) => event.outcome)).toEqual([
      'order_book_retrieval_started',
      'order_book_retrieval_completed',
      'order_book_retrieval_failed',
    ]);
    expect(events.every((event) => event.eventType === 'connection.validation')).toBe(true);
    expect(events.every((event) => event.source === 'market-data-foundation')).toBe(true);
  });
});
