import { describe, expect, it } from 'vitest';
import {
  createSignalIntent,
  SignalIntentDirection,
  type CreateSignalIntentInput,
} from './signal-intent';

const generatedAt = '2026-07-29T16:00:00.000Z';

function baseInput(overrides: Partial<CreateSignalIntentInput> = {}): CreateSignalIntentInput {
  return {
    workspaceId: 'workspace-1',
    deploymentId: 'deployment-1',
    sessionId: 'session-1',
    strategyVersion: '1.0.0',
    instrument: 'btcusdt',
    timeframe: '1h',
    direction: SignalIntentDirection.BUY,
    confidence: 0.81234,
    marketCheckpoint: {
      streamId: 'binance:btcusdt:1h',
      sequence: 42,
      eventId: 'candle-42',
    },
    generatedAt,
    recordedAt: '2026-07-29T16:00:01.000Z',
    actorId: 'runtime-worker-1',
    correlationId: 'corr-1',
    metadata: { evaluator: 'ema-cross' },
    ...overrides,
  };
}

describe('US214 — Signal Intent domain', () => {
  it('creates an immutable intent with stable semantic identity', () => {
    const intent = createSignalIntent(baseInput());

    expect(intent).toMatchObject({
      intentVersion: 1,
      instrument: 'BTCUSDT',
      timeframe: '1h',
      direction: SignalIntentDirection.BUY,
      confidence: 0.8123,
      deploymentId: 'deployment-1',
      sessionId: 'session-1',
      strategyVersion: '1.0.0',
      generatedAt,
    });
    expect(intent.id).toMatch(/^si_[a-f0-9]{32}$/);
    expect(intent.intentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(intent.id).toBe(`si_${intent.intentHash.slice(0, 32)}`);
    expect(Object.isFrozen(intent)).toBe(true);
    expect(Object.isFrozen(intent.marketCheckpoint)).toBe(true);
    expect(Object.isFrozen(intent.metadata)).toBe(true);
    expect(intent).not.toHaveProperty('orderId');
    expect(intent).not.toHaveProperty('riskDecisionId');
    expect(intent).not.toHaveProperty('fillId');
  });

  it('keeps identity stable across operational metadata changes', () => {
    const first = createSignalIntent(baseInput());
    const second = createSignalIntent(
      baseInput({
        recordedAt: '2026-07-29T16:05:00.000Z',
        actorId: 'runtime-worker-2',
        correlationId: 'corr-other',
        metadata: { evaluator: 'different-label' },
      }),
    );

    expect(second.intentHash).toBe(first.intentHash);
    expect(second.id).toBe(first.id);
  });

  it('changes identity when semantic evaluation inputs change', () => {
    const base = createSignalIntent(baseInput());
    const directionChanged = createSignalIntent(
      baseInput({ direction: SignalIntentDirection.SELL }),
    );
    const checkpointChanged = createSignalIntent(
      baseInput({
        marketCheckpoint: {
          streamId: 'binance:btcusdt:1h',
          sequence: 43,
          eventId: 'candle-43',
        },
      }),
    );

    expect(directionChanged.intentHash).not.toBe(base.intentHash);
    expect(checkpointChanged.intentHash).not.toBe(base.intentHash);
  });

  it('rejects invalid direction, confidence, timeframe, and empty ids', () => {
    expect(() =>
      createSignalIntent(baseInput({ direction: 'hold' as SignalIntentDirection })),
    ).toThrow(/unsupported signal intent direction/);
    expect(() => createSignalIntent(baseInput({ confidence: 1.5 }))).toThrow(
      /confidence must be in \[0, 1\]/,
    );
    expect(() => createSignalIntent(baseInput({ timeframe: '2h' }))).toThrow(
      /unsupported timeframe/,
    );
    expect(() => createSignalIntent(baseInput({ deploymentId: '  ' }))).toThrow(
      /deployment id is required/,
    );
    expect(() => createSignalIntent(baseInput({ instrument: 'bt' }))).toThrow(
      /instrument must be 3-32/,
    );
  });

  it('allows null confidence', () => {
    const intent = createSignalIntent(baseInput({ confidence: null }));
    expect(intent.confidence).toBeNull();
  });
});
