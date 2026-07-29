import { describe, expect, it } from 'vitest';
import { createOrderIntent, OrderSide, OrderType } from './order-intent';
import {
  mapProposeOrderFromSignalIntent,
  SIGNAL_INTENT_IDEMPOTENCY_PREFIX,
  type SignalIntentIntake,
} from './propose-from-signal-intent';

const signal: SignalIntentIntake = {
  id: 'si_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  intentHash: 'b'.repeat(64),
  workspaceId: 'workspace-1',
  sessionId: 'session-1',
  instrument: 'BTCUSDT',
  direction: 'buy',
  marketCheckpoint: {
    streamId: 'binance:BTCUSDT:1m',
    sequence: 42,
    eventId: 'market-event-42',
  },
  generatedAt: '2026-07-29T16:00:00.000Z',
  actorId: 'runtime-1',
  correlationId: 'corr-1',
};

describe('US221 — Signal Intent → Order Intent mapping', () => {
  it('maps Signal Intent to strategy-origin Order Intent with immutable reference', () => {
    const mapped = mapProposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 3,
      quantity: '0.5',
      recordedAt: '2026-07-29T16:00:00.100Z',
      eligibilityCheckedAt: '2026-07-29T16:00:00.050Z',
    });

    expect(mapped.kind).toBe('SIGNAL_INTENT');
    if (mapped.kind !== 'SIGNAL_INTENT') return;

    const intent = createOrderIntent(mapped.create);
    expect(intent.origin).toBe('strategy');
    expect(intent.signalIntentId).toBe(signal.id);
    expect(intent.signalIntentHash).toBe(signal.intentHash);
    expect(intent.clientOrderId).toBe(signal.id);
    expect(intent.idempotencyKey).toBe(`${SIGNAL_INTENT_IDEMPOTENCY_PREFIX}${signal.intentHash}`);
    expect(intent.side).toBe(OrderSide.BUY);
    expect(intent.type).toBe(OrderType.MARKET);
    expect(intent.quantity).toBe('0.5');
    expect(intent.occurredAt).toBe(signal.generatedAt);
    expect(intent.tradingSessionId).toBe(signal.sessionId);
  });

  it('NO_ACTION produces no Order Intent', () => {
    const mapped = mapProposeOrderFromSignalIntent({
      kind: 'NO_ACTION',
      reason: 'close equals open',
    });
    expect(mapped).toEqual({ kind: 'NO_ACTION', reason: 'close equals open' });
  });

  it('maps sell Signal Intent as reduce-only', () => {
    const mapped = mapProposeOrderFromSignalIntent({
      kind: 'SIGNAL_INTENT',
      signalIntent: { ...signal, direction: 'sell' },
      paperAccountId: 'account-1',
      sessionFencingToken: 3,
      quantity: '0.25',
      recordedAt: '2026-07-29T16:00:00.100Z',
      eligibilityCheckedAt: '2026-07-29T16:00:00.050Z',
    });
    expect(mapped.kind).toBe('SIGNAL_INTENT');
    if (mapped.kind !== 'SIGNAL_INTENT') return;
    const intent = createOrderIntent(mapped.create);
    expect(intent.side).toBe(OrderSide.SELL);
    expect(intent.positionEffect).toBe('reduce_only');
  });

  it('keeps mapping replay-stable for identical Signal Intent intake', () => {
    const command = {
      kind: 'SIGNAL_INTENT' as const,
      signalIntent: signal,
      paperAccountId: 'account-1',
      sessionFencingToken: 3,
      quantity: '0.5',
      recordedAt: '2026-07-29T16:00:00.100Z',
      eligibilityCheckedAt: '2026-07-29T16:00:00.050Z',
    };
    const first = mapProposeOrderFromSignalIntent(command);
    const second = mapProposeOrderFromSignalIntent({
      ...command,
      recordedAt: '2026-07-29T16:05:00.000Z',
      eligibilityCheckedAt: '2026-07-29T16:05:00.000Z',
      actorId: 'different-actor',
    });
    expect(first.kind).toBe('SIGNAL_INTENT');
    expect(second.kind).toBe('SIGNAL_INTENT');
    if (first.kind !== 'SIGNAL_INTENT' || second.kind !== 'SIGNAL_INTENT') return;
    expect(createOrderIntent(first.create).intentHash).toBe(
      createOrderIntent(second.create).intentHash,
    );
    expect(createOrderIntent(first.create).orderId).toBe(createOrderIntent(second.create).orderId);
  });
});
