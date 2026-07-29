import { describe, expect, it } from 'vitest';
import {
  advanceStrategyCheckpoint,
  createStrategyCheckpoint,
  deterministicCheckpointId,
  type CreateStrategyCheckpointInput,
  type LastProcessedCandle,
} from './strategy-checkpoint';

const updatedAt = '2026-07-29T17:00:00.000Z';

function candle(overrides: Partial<LastProcessedCandle> = {}): LastProcessedCandle {
  return {
    streamId: 'binance:btcusdt:1h',
    sequence: 10,
    openTime: '2026-07-29T16:00:00.000Z',
    instrument: 'btcusdt',
    timeframe: '1h',
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<CreateStrategyCheckpointInput> = {},
): CreateStrategyCheckpointInput {
  return {
    workspaceId: 'workspace-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    lastProcessedCandle: candle(),
    lastProcessedEventId: 'evt-10',
    updatedAt,
    ...overrides,
  };
}

describe('US215 — Strategy Checkpoint domain', () => {
  it('creates a frozen versioned checkpoint with deterministic id', () => {
    const checkpoint = createStrategyCheckpoint(baseInput());

    expect(checkpoint).toMatchObject({
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      lastProcessedEventId: 'evt-10',
      runtimeVersion: '1',
      version: 1,
      lastProcessedCandle: {
        streamId: 'binance:btcusdt:1h',
        sequence: 10,
        instrument: 'BTCUSDT',
        timeframe: '1h',
      },
    });
    expect(checkpoint.id).toBe(deterministicCheckpointId('workspace-1', 'session-1'));
    expect(Object.isFrozen(checkpoint)).toBe(true);
    expect(Object.isFrozen(checkpoint.lastProcessedCandle)).toBe(true);
    expect(checkpoint).not.toHaveProperty('orderId');
    expect(checkpoint).not.toHaveProperty('position');
    expect(checkpoint).not.toHaveProperty('riskDecisionId');
    expect(checkpoint).not.toHaveProperty('fencingToken');
    expect(checkpoint).not.toHaveProperty('leaseOwnerId');
  });

  it('advances monotonically and rejects regressions', () => {
    const current = createStrategyCheckpoint(baseInput());
    const advanced = advanceStrategyCheckpoint(current, {
      lastProcessedCandle: candle({
        sequence: 11,
        openTime: '2026-07-29T17:00:00.000Z',
      }),
      lastProcessedEventId: 'evt-11',
      updatedAt: '2026-07-29T17:01:00.000Z',
    });

    expect(advanced.version).toBe(2);
    expect(advanced.lastProcessedEventId).toBe('evt-11');
    expect(advanced.lastProcessedCandle.sequence).toBe(11);

    expect(() =>
      advanceStrategyCheckpoint(advanced, {
        lastProcessedCandle: candle({
          sequence: 11,
          openTime: '2026-07-29T17:00:00.000Z',
        }),
        lastProcessedEventId: 'evt-11-retry-different',
        updatedAt: '2026-07-29T17:02:00.000Z',
      }),
    ).toThrow(/must advance monotonically/);

    expect(() =>
      advanceStrategyCheckpoint(advanced, {
        lastProcessedCandle: candle({
          streamId: 'binance:ethusdt:1h',
          sequence: 12,
          openTime: '2026-07-29T18:00:00.000Z',
          instrument: 'ETHUSDT',
        }),
        lastProcessedEventId: 'evt-12',
        updatedAt: '2026-07-29T17:03:00.000Z',
      }),
    ).toThrow(/stream id cannot change/);
  });

  it('treats identical progress as a successful no-op', () => {
    const current = createStrategyCheckpoint(baseInput());
    const same = advanceStrategyCheckpoint(current, {
      lastProcessedCandle: candle(),
      lastProcessedEventId: 'evt-10',
      updatedAt: '2026-07-29T17:05:00.000Z',
    });
    expect(same).toBe(current);
    expect(same.version).toBe(1);
  });

  it('rejects invalid candle and empty ids', () => {
    expect(() =>
      createStrategyCheckpoint(
        baseInput({
          lastProcessedCandle: candle({ timeframe: '2h' as LastProcessedCandle['timeframe'] }),
        }),
      ),
    ).toThrow(/unsupported timeframe/);
    expect(() => createStrategyCheckpoint(baseInput({ sessionId: '  ' }))).toThrow(
      /session id is required/,
    );
    expect(() =>
      createStrategyCheckpoint(baseInput({ lastProcessedCandle: candle({ sequence: -1 }) })),
    ).toThrow(/non-negative integer/);
  });
});
