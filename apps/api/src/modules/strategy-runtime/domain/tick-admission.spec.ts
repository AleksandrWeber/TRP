import { describe, expect, it } from 'vitest';
import { CLOSED_CANDLE_TICK_EVENT_TYPE, createClosedCandleTickEvent } from './closed-candle-tick';
import { createRuntimeLeaseProof } from './runtime-lease-proof';
import { createStrategyCheckpoint } from './strategy-checkpoint';
import { admitClosedCandleTick, TickAdmissionStatus } from './tick-admission';

const now = '2026-07-29T18:00:00.000Z';
const expiresAt = '2026-07-29T18:05:00.000Z';

function lease(overrides: Partial<ReturnType<typeof createRuntimeLeaseProof>> = {}) {
  return createRuntimeLeaseProof({
    sessionId: 'session-1',
    fencingToken: 3,
    ownerId: 'runtime-worker-1',
    expiresAt,
    sessionStatus: 'RUNNING',
    ...overrides,
  });
}

function tick(overrides: Partial<Parameters<typeof createClosedCandleTickEvent>[0]> = {}) {
  return createClosedCandleTickEvent({
    eventType: CLOSED_CANDLE_TICK_EVENT_TYPE,
    eventId: 'evt-11',
    workspaceId: 'workspace-1',
    streamId: 'binance:btcusdt:1h',
    sequence: 11,
    openTime: '2026-07-29T17:00:00.000Z',
    closeTime: '2026-07-29T17:59:59.999Z',
    instrument: 'BTCUSDT',
    timeframe: '1h',
    ...overrides,
  });
}

function checkpoint() {
  return createStrategyCheckpoint({
    workspaceId: 'workspace-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    lastProcessedCandle: {
      streamId: 'binance:btcusdt:1h',
      sequence: 10,
      openTime: '2026-07-29T16:00:00.000Z',
      instrument: 'BTCUSDT',
      timeframe: '1h',
    },
    lastProcessedEventId: 'evt-10',
    updatedAt: '2026-07-29T17:00:00.000Z',
  });
}

describe('US218 — closed-candle tick admission', () => {
  it('admits the next closed-candle tick under a valid lease', () => {
    const result = admitClosedCandleTick({
      event: tick(),
      lease: lease(),
      checkpoint: checkpoint(),
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });

    expect(result).toMatchObject({
      status: TickAdmissionStatus.ADMITTED,
      admitted: true,
      eventId: 'evt-11',
      sequence: 11,
    });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('admits the first tick when no checkpoint exists', () => {
    const result = admitClosedCandleTick({
      event: tick({ sequence: 0, eventId: 'evt-0', openTime: '2026-07-29T12:00:00.000Z' }),
      lease: lease(),
      checkpoint: null,
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });

    expect(result.status).toBe(TickAdmissionStatus.ADMITTED);
    expect(result.admitted).toBe(true);
  });

  it('rejects non-closed-candle events', () => {
    const result = admitClosedCandleTick({
      event: {
        ...tick(),
        eventType: 'MarketMarkPrice',
      },
      lease: lease(),
      checkpoint: null,
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });

    expect(result.status).toBe(TickAdmissionStatus.REJECTED_NOT_CLOSED_CANDLE);
    expect(result.admitted).toBe(false);
  });

  it('rejects invalid or expired leases', () => {
    expect(
      admitClosedCandleTick({
        event: tick(),
        lease: lease({ sessionStatus: 'PAUSED' }),
        checkpoint: null,
        expectedSessionId: 'session-1',
        expectedWorkspaceId: 'workspace-1',
        nowIso: now,
      }).status,
    ).toBe(TickAdmissionStatus.REJECTED_LEASE_INVALID);

    expect(
      admitClosedCandleTick({
        event: tick(),
        lease: lease({ expiresAt: '2026-07-29T17:59:59.000Z' }),
        checkpoint: null,
        expectedSessionId: 'session-1',
        expectedWorkspaceId: 'workspace-1',
        nowIso: now,
      }).status,
    ).toBe(TickAdmissionStatus.REJECTED_LEASE_INVALID);

    expect(
      admitClosedCandleTick({
        event: tick(),
        lease: lease({ sessionId: 'other-session' }),
        checkpoint: null,
        expectedSessionId: 'session-1',
        expectedWorkspaceId: 'workspace-1',
        nowIso: now,
      }).status,
    ).toBe(TickAdmissionStatus.REJECTED_LEASE_INVALID);
  });

  it('rejects duplicate ticks', () => {
    const result = admitClosedCandleTick({
      event: tick({
        eventId: 'evt-10',
        sequence: 10,
        openTime: '2026-07-29T16:00:00.000Z',
        closeTime: '2026-07-29T16:59:59.999Z',
      }),
      lease: lease(),
      checkpoint: checkpoint(),
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });

    expect(result.status).toBe(TickAdmissionStatus.REJECTED_DUPLICATE);
  });

  it('rejects stale ticks', () => {
    const result = admitClosedCandleTick({
      event: tick({
        eventId: 'evt-9',
        sequence: 9,
        openTime: '2026-07-29T15:00:00.000Z',
        closeTime: '2026-07-29T15:59:59.999Z',
      }),
      lease: lease(),
      checkpoint: checkpoint(),
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });

    expect(result.status).toBe(TickAdmissionStatus.REJECTED_STALE);
  });

  it('rejects out-of-order and stream-mismatched ticks', () => {
    expect(
      admitClosedCandleTick({
        event: tick({
          eventId: 'evt-12',
          sequence: 12,
          openTime: '2026-07-29T18:00:00.000Z',
          closeTime: '2026-07-29T18:59:59.999Z',
        }),
        lease: lease(),
        checkpoint: checkpoint(),
        expectedSessionId: 'session-1',
        expectedWorkspaceId: 'workspace-1',
        nowIso: now,
      }).status,
    ).toBe(TickAdmissionStatus.REJECTED_OUT_OF_ORDER);

    expect(
      admitClosedCandleTick({
        event: tick({ streamId: 'binance:ethusdt:1h', instrument: 'ETHUSDT' }),
        lease: lease(),
        checkpoint: checkpoint(),
        expectedSessionId: 'session-1',
        expectedWorkspaceId: 'workspace-1',
        nowIso: now,
      }).status,
    ).toBe(TickAdmissionStatus.REJECTED_STREAM_MISMATCH);
  });

  it('does not mutate checkpoint identity on admission', () => {
    const current = checkpoint();
    const before = structuredClone(current);
    admitClosedCandleTick({
      event: tick(),
      lease: lease(),
      checkpoint: current,
      expectedSessionId: 'session-1',
      expectedWorkspaceId: 'workspace-1',
      nowIso: now,
    });
    expect(current).toEqual(before);
  });
});
