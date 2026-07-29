import { describe, expect, it } from 'vitest';
import { CLOSED_CANDLE_TICK_EVENT_TYPE, createClosedCandleTickEvent } from './closed-candle-tick';
import {
  assertRuntimeLeaseValid,
  createRuntimeLeaseProof,
  RUNTIME_LEASE_SESSION_STATUS_RUNNING,
} from './runtime-lease-proof';

describe('US218 — closed-candle tick + lease proof contracts', () => {
  it('creates a frozen closed-candle tick event', () => {
    const event = createClosedCandleTickEvent({
      eventId: 'evt-1',
      workspaceId: 'workspace-1',
      streamId: 'binance:btcusdt:1h',
      sequence: 1,
      openTime: '2026-07-29T16:00:00.000Z',
      closeTime: '2026-07-29T16:59:59.999Z',
      instrument: 'btcusdt',
      timeframe: '1h',
    });

    expect(event.eventType).toBe(CLOSED_CANDLE_TICK_EVENT_TYPE);
    expect(event.instrument).toBe('BTCUSDT');
    expect(Object.isFrozen(event)).toBe(true);
    expect(event).not.toHaveProperty('open');
    expect(event).not.toHaveProperty('high');
  });

  it('rejects non-closed candle event types at construction', () => {
    expect(() =>
      createClosedCandleTickEvent({
        eventType: 'MarketMarkPrice',
        eventId: 'evt-1',
        workspaceId: 'workspace-1',
        streamId: 'binance:btcusdt:1h',
        sequence: 1,
        openTime: '2026-07-29T16:00:00.000Z',
        closeTime: '2026-07-29T16:59:59.999Z',
        instrument: 'BTCUSDT',
        timeframe: '1h',
      }),
    ).toThrow(/MarketClosedCandle/);
  });

  it('validates RUNNING lease fencing against wall-clock expiry', () => {
    const lease = createRuntimeLeaseProof({
      sessionId: 'session-1',
      fencingToken: 2,
      ownerId: 'worker-1',
      expiresAt: '2026-07-29T18:05:00.000Z',
      sessionStatus: RUNTIME_LEASE_SESSION_STATUS_RUNNING,
    });

    expect(() =>
      assertRuntimeLeaseValid(lease, 'session-1', '2026-07-29T18:00:00.000Z'),
    ).not.toThrow();
    expect(() => assertRuntimeLeaseValid(lease, 'session-1', '2026-07-29T18:05:00.000Z')).toThrow(
      /lease expired/,
    );
    expect(() => assertRuntimeLeaseValid(lease, 'other', '2026-07-29T18:00:00.000Z')).toThrow(
      /session id/,
    );
  });
});
