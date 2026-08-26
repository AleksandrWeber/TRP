import { describe, expect, it } from 'vitest';
import { MarketSymbolDiscoveryAudit } from './market-symbol.audit';

describe('Market symbol discovery audit (W2-S03-b)', () => {
  it('emits only started, completed, and failed through Security Audit', async () => {
    const events: Array<{ eventType: string; outcome: string; source: string }> = [];
    const audit = new MarketSymbolDiscoveryAudit({
      record: async (write: { eventType: string; outcome: string; source: string }) => {
        events.push(write);
      },
    } as never);

    await audit.record({
      outcome: 'symbol_discovery_started',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'symbol_discovery_completed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
    });
    await audit.record({
      outcome: 'symbol_discovery_failed',
      workspaceId: 'workspace-a',
      actorUserId: 'operator-a',
      connectionId: 'connection-a',
      provider: 'BINANCE',
      failureReason: 'Provider unavailable',
    });

    expect(events.map((event) => event.outcome)).toEqual([
      'symbol_discovery_started',
      'symbol_discovery_completed',
      'symbol_discovery_failed',
    ]);
    expect(events.every((event) => event.eventType === 'connection.validation')).toBe(true);
    expect(events.every((event) => event.source === 'market-data-foundation')).toBe(true);
  });
});
